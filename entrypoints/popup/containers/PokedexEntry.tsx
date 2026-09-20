import { useEffect, useState } from 'react';
import type { Acquisition } from '@/model/types';
import type { PokedexRow } from '@/model/pokedex';
import { sendRequestToBackground } from '@/utils/messages';
import { PokemonIcon } from '../components/PokemonIcon';
import { PokemonTypeChip } from '../components/PokemonTypeChip';
import './PokedexEntry.css';

export function PokedexEntry({ row }: { row: PokedexRow }) {
  /** null = not read yet — the section stays hidden until the read lands. */
  const [rows, setRows] = useState<Acquisition[] | null>(null);

  useEffect(() => {
    // The history is a nice-to-have: a failed read simply leaves the
    // section hidden — no loading or error UI on this page.
    void sendRequestToBackground({ type: 'get-acquisitions', dexId: row.dexId })
      .then((reply) => setRows(reply.acquisitions))
      .catch(() => {});
  }, [row.dexId]);

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
      <p className="view-name">{row.name}</p>
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
    </div>
  );
}
