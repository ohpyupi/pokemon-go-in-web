import { useState } from 'react';
import { sendRequestToBackground } from '@/utils/messages';
import './Receive.css';

type OpenResult = { kind: 'ok'; dexId: number } | { kind: 'failed' };

export function Receive({ address }: { address: string | null }) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<OpenResult | null>(null);
  const [copied, setCopied] = useState(false);

  const generateAddress = (): void => {
    void sendRequestToBackground({ type: 'generate-address' });
  };

  const copyAddress = async (): Promise<void> => {
    if (address === null) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const removeAddress = (): void => {
    void sendRequestToBackground({ type: 'remove-address' });
  };

  const open = async (): Promise<void> => {
    const { dexId } = await sendRequestToBackground({
      type: 'open-share-code',
      code: code.trim(),
    });
    setResult(dexId === null ? { kind: 'failed' } : { kind: 'ok', dexId });
    if (dexId !== null) setCode('');
  };

  return (
    <div className="view receive-view">
      <h1 className="title">Receive a Pokémon</h1>
      <div className="my-address">
        <p className="receive-title">My address</p>
        {address === null ? (
          <>
            <p className="receive-hint">
              Generate a new address, and share it with your friends to receive
              their Pokémon.
            </p>
            <button type="button" className="cta" onClick={generateAddress}>
              Generate address
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="copy-address"
              onClick={() => void copyAddress()}
            >
              {address}
            </button>
            <p className="address-actions">
              <button
                type="button"
                className="friends-link"
                onClick={removeAddress}
              >
                Remove
              </button>
            </p>
          </>
        )}
      </div>
      {address !== null && (
        <>
          <input
            className="input"
            value={code}
            placeholder="Paste a share code"
            aria-label="Share code"
            onChange={(event) => {
              setCode(event.target.value);
              setResult(null);
            }}
          />
          <button
            type="button"
            className="action"
            disabled={code.trim() === ''}
            onClick={() => void open()}
          >
            Open
          </button>
          {result?.kind === 'ok' && (
            <p className="receive-ok">
              #{String(result.dexId).padStart(3, '0')} is in your Pokédex.
            </p>
          )}
          {result?.kind === 'failed' && (
            <p className="error">Cannot open this code.</p>
          )}
        </>
      )}
      <p className={`toast ${copied ? 'show' : ''}`} role="status">
        Address copied
      </p>
    </div>
  );
}
