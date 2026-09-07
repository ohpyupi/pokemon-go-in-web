import type { PokedexRow } from '@/model/pokedex';
import PokemonIcon from '../components/PokemonIcon';
import './PokedexEntry.css';

/** One Pokédex entry, opened from the home grid: a species' full record —
 *  name, who/when/where it was indexed, and its description. The trainer
 *  name is read from the profile at view time (encounters carry no ref). */
function PokedexEntry({
  row,
  trainerName,
  onBack,
}: {
  row: PokedexRow;
  trainerName: string;
  onBack: () => void;
}) {
  const seenWhen =
    row.seenAt === null
      ? 'Never seen yet.'
      : new Date(row.seenAt).toLocaleString();
  const seenWhere = row.seenOn ?? '—';

  return (
    <div className="view">
      <button type="button" className="back" onClick={onBack}>
        ← Pokedex
      </button>
      <p className="view-name">{row.name}</p>
      <p className="dex-no">#{String(row.dexId).padStart(3, '0')}</p>
      <div className="sprite">
        <PokemonIcon dexId={row.dexId} alt={row.name} />
      </div>
      <div className="meta">
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

export default PokedexEntry;
