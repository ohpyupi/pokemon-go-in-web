import { useEffect, useState } from 'react';
import type { Acquisition, Friend } from '@/model/types';
import type { PokedexRow } from '@/model/pokedex';
import { sendRequestToBackground } from '@/utils/messages';
import { Modal } from '../components/Modal';
import { PokemonIcon } from '../components/PokemonIcon';
import { PokemonTypeChip } from '../components/PokemonTypeChip';
import './PokedexEntry.css';

type ShareState =
  | { step: 'pick' }
  | { step: 'code'; code: string }
  | { step: 'failed' };

export function PokedexEntry({
  row,
  friends,
}: {
  row: PokedexRow;
  friends: Record<string, Friend>;
}) {
  /** null = not read yet — the section stays hidden until the read lands. */
  const [rows, setRows] = useState<Acquisition[] | null>(null);
  const [share, setShare] = useState<ShareState | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // The history is a nice-to-have: a failed read simply leaves the
    // section hidden — no loading or error UI on this page.
    void sendRequestToBackground({ type: 'get-acquisitions', dexId: row.dexId })
      .then((reply) => setRows(reply.acquisitions))
      .catch(() => {});
  }, [row.dexId]);

  const list = Object.values(friends);
  const canShare = rows?.some((one) => one.kind === 'found') ?? false;

  const pickFriend = async (friend: Friend): Promise<void> => {
    const { code } = await sendRequestToBackground({
      type: 'create-share-code',
      address: friend.address,
      dexId: row.dexId,
    });
    setShare(code === null ? { step: 'failed' } : { step: 'code', code });
  };

  const copyCode = async (code: string): Promise<void> => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    setShare(null);
  };

  /** PokeAPI raw units (dm/hg) → meters/kilograms with one decimal,
   *  the way the GO dex shows size. */
  const size = (raw: number | undefined, unit: 'm' | 'kg'): string =>
    raw === undefined ? '—' : `${(raw / 10).toFixed(1)} ${unit}`;

  const chips = row.types.map((type) => (
    <PokemonTypeChip key={type} type={type} />
  ));

  const kind = (acquisition: Acquisition): string =>
    acquisition.kind === 'found' ? 'Found' : 'Shared';

  const source = (acquisition: Acquisition): string =>
    acquisition.kind === 'found'
      ? acquisition.foundOn
      : acquisition.sharedBy;

  const when = (acquiredAt: number): string =>
    new Date(acquiredAt).toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });

  return (
    <div className="view view--center">
      <div className="view-head">
        <p className="view-name">{row.name}</p>
        {canShare && (
          <button
            type="button"
            className="share-btn"
            onClick={() => setShare({ step: 'pick' })}
          >
            Share
          </button>
        )}
      </div>
      <p className="dex-no">#{String(row.dexId).padStart(3, '0')}</p>
      <div className="types">{chips}</div>
      <div className="sprite">
        <PokemonIcon dexId={row.dexId} alt={row.name} />
      </div>
      {/* One card: the record facts, then the description. */}
      <div className="meta">
        <div className="meta-row">
          <span className="meta-label">Height</span>
          <span className="meta-value">{size(row.height, 'm')}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Weight</span>
          <span className="meta-value">{size(row.weight, 'kg')}</span>
        </div>
        <p className="meta-desc">{row.description}</p>
      </div>
      {rows !== null && rows.length > 0 && (
        <div className="history">
          <p className="history-title">History ({rows.length})</p>
          {rows.map((acquisition) => (
            <p className="history-row" key={acquisition.id}>
              <span className="history-kind">{kind(acquisition)}</span>
              <span className="history-source">{source(acquisition)}</span>
              <span className="history-when">{when(acquisition.acquiredAt)}</span>
            </p>
          ))}
        </div>
      )}
      {share !== null && (
        <Modal
          title={share.step === 'code' ? 'Share code' : `Share ${row.name}`}
          onClose={() => setShare(null)}
        >
          {share.step === 'pick' &&
            (list.length === 0 ? (
              <p className="share-hint">
                No friends yet. Add a friend in the Friends tab.
              </p>
            ) : (
              <div className="share-list">
                {list.map((friend) => (
                  <button
                    type="button"
                    className="share-friend"
                    key={friend.address}
                    onClick={() => void pickFriend(friend)}
                  >
                    <span className="share-name">{friend.nickname}</span>
                    <span className="share-address">{friend.address}</span>
                  </button>
                ))}
              </div>
            ))}
          {share.step === 'failed' && (
            <p className="error">
              Cannot make a code for this friend. Their address looks broken.
            </p>
          )}
          {share.step === 'code' && (
            <>
              <p className="share-hint">Send this code to your friend.</p>
              <p className="share-code">{share.code}</p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="action"
                  onClick={() => void copyCode(share.code)}
                >
                  Copy
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
      <p className={`toast ${copied ? 'show' : ''}`} role="status">
        Code copied
      </p>
    </div>
  );
}
