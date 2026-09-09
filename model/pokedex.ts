/**
 * The Pokédex read model: `pokemon` left-joined with `encounters` into one
 * ready-to-render row per species. The controller relays these rows to the
 * popup, so the view never joins anything itself.
 */

import type { PokemonType } from './db';
import { encounters } from './encounters';
import { pokemon } from './pokemon';

/** The popup-facing alias of the type slugs (see db.ts). */
export type { PokemonType };

/** One Pokédex row: the species (name, description, modern types, size)
 *  plus its meeting state (null = not met). */
export interface PokedexRow {
  dexId: number;
  name: string;
  description: string;
  /** Modern type slugs, primary first. */
  types: PokemonType[];
  /** Height in decimeters (PokeAPI raw unit). */
  height: number;
  /** Weight in hectograms (PokeAPI raw unit). */
  weight: number;
  seenAt: number | null;
  seenOn: string | null;
}

/** The read model over the two tables — read-only, no writes. Everything
 *  outside the model goes through `pokedex` below and never touches Dexie
 *  directly. */
export class PokedexRepository {
  /** All 151 species in dex order with their encounter state. */
  async getAll(): Promise<PokedexRow[]> {
    const [species, met] = await Promise.all([
      pokemon.getAll(),
      encounters.getAll(),
    ]);
    const byDexId = new Map(
      met.map((encounter) => [encounter.dexId, encounter]),
    );
    return species.map(
      ({ dexId, name, description, types, height, weight }) => {
        const encounter = byDexId.get(dexId);
        return {
          dexId,
          name,
          description,
          types,
          height,
          weight,
          seenAt: encounter?.seenAt ?? null,
          seenOn: encounter?.seenOn ?? null,
        };
      },
    );
  }
}

export const pokedex = new PokedexRepository();
