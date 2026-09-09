import { useEffect, useState } from 'react';
import type { Discovery } from '@/model/db';
import type { PokedexRow } from '@/model/pokedex';
import { sendRequestToBackground } from '@/utils/messages';
import { PokemonIcon } from '../components/PokemonIcon';
import { PokemonTypeChip } from '../components/PokemonTypeChip';
import './PokedexEntry.css';

/** One Pokédex entry, opened from the home grid: a species' full record —
 *  name, modern types, size, and where it has been found. The static
 *  fields ride along with the home row; the discovery history is fetched
 *  lazily per species (the home rows never carry it). */
export function PokedexEntry({ row }: { row: PokedexRow }) {
  /** null = not read yet — the section stays hidden until the read lands. */
  const [foundOn, setFoundOn] = useState<Discovery[] | null>(null);

  useEffect(() => {
    // The history is a nice-to-have: a failed read simply leaves the
    // section hidden — no loading or error UI on this page.
    void sendRequestToBackground({ type: 'get-discoveries', dexId: row.dexId })
      .then((reply) => setFoundOn(reply.discoveries))
      .catch(() => {});
  }, [row.dexId]);

  /** PokeAPI raw units (dm/hg) → meters/kilograms with one decimal,
   *  the way the GO dex shows size. */
  const size = (raw: number | undefined, unit: 'm' | 'kg'): string =>
    raw === undefined ? '—' : `${(raw / 10).toFixed(1)} ${unit}`;

  const chips = row.types.map((type) => (
    <PokemonTypeChip key={type} type={type} />
  ));

  /** The list is oldest first, so the first row is the origin story: it
   *  keeps the full date and time; later finds show the date only. */
  const foundWhen = (found: Discovery, index: number): string =>
    index === 0
      ? new Date(found.foundAt).toLocaleString()
      : new Date(found.foundAt).toLocaleDateString();

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
      {foundOn !== null && foundOn.length > 0 && (
        <div className="found">
          <p className="found-title">Found on ({foundOn.length})</p>
          {foundOn.map((found, index) => (
            <p className="found-row" key={found.foundOn}>
              <span className="found-domain">{found.foundOn}</span>
              <span className="found-when">{foundWhen(found, index)}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
