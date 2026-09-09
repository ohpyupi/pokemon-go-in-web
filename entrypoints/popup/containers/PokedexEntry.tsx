import type { PokedexRow } from '@/model/pokedex';
import { PokemonIcon } from '../components/PokemonIcon';
import { PokemonTypeChip } from '../components/PokemonTypeChip';
import './PokedexEntry.css';

/** One Pokédex entry, opened from the home grid: a species' full record —
 *  name, modern types, size, who/when/where it was indexed, and its
 *  description. The trainer name is read from the profile at view time
 *  (encounters carry no ref). */
export function PokedexEntry({
  row,
  trainerName,
}: {
  row: PokedexRow;
  trainerName: string;
}) {
  const seenWhen =
    row.seenAt === null
      ? 'Never seen yet.'
      : new Date(row.seenAt).toLocaleString();
  const seenWhere = row.seenOn ?? '—';

  /** PokeAPI raw units (dm/hg) → meters/kilograms with one decimal,
   *  the way the GO dex shows size. */
  const size = (raw: number | undefined, unit: 'm' | 'kg'): string =>
    raw === undefined ? '—' : `${(raw / 10).toFixed(1)} ${unit}`;

  const chips = row.types.map((type) => (
    <PokemonTypeChip key={type} type={type} />
  ));

  return (
    <div className="view view--center">
      <p className="view-name">{row.name}</p>
      <p className="dex-no">#{String(row.dexId).padStart(3, '0')}</p>
      <div className="types">{chips}</div>
      <div className="sprite">
        <PokemonIcon dexId={row.dexId} alt={row.name} />
      </div>
      <div className="meta">
        <div className="meta-row">
          <span className="meta-label">Height</span>
          <span className="meta-value">{size(row.height, 'm')}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Weight</span>
          <span className="meta-value">{size(row.weight, 'kg')}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Indexed by</span>
          <span className="meta-value">{trainerName}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Indexed when</span>
          <span className="meta-value">{seenWhen}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Indexed where</span>
          <span className="meta-value">{seenWhere}</span>
        </div>
        <p className="meta-desc">{row.description}</p>
      </div>
    </div>
  );
}
