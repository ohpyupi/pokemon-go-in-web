import type { PokemonType } from '@/model/pokedex';
import './PokemonTypeChip.css';

/** One type badge — a species' type as a colored pill. The type name comes
 *  lowercase from the dex data; the chip capitalizes it for display. */
export function PokemonTypeChip({ type }: { type: PokemonType }) {
  return (
    <span className={`pokemon-type-chip type-${type}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}
