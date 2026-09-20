import { useState } from 'react';

/** The Receive page: paste the gift code a friend sent you.
 *  TODO: Open needs the wallet and the redeem message from the background. */
export function Receive() {
  const [code, setCode] = useState('');

  return (
    <div className="view">
      <h1>Receive a gift</h1>
      <input
        className="input"
        value={code}
        placeholder="Paste a gift code"
        aria-label="Gift code"
        onChange={(event) => setCode(event.target.value)}
      />
      <button type="button" className="action" disabled={code.trim() === ''}>
        Open
      </button>
    </div>
  );
}