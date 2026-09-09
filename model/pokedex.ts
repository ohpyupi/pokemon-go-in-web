/**
 * The Pokédex read model: the species catalog plus which species have been
 * met, joined into one ready-to-render row per species. The controller
 * relays these rows to the popup, so the view never joins anything itself.
 * Discovery history is not part of the home rows — the entry page fetches
 * a species' findings separately when it is opened.
 */

import type { PokemonType } from './db';
import { discoveries } from './discoveries';
import { pokemon } from './pokemon';

/** The popup-facing alias of the type slugs (see db.ts). */
export type { PokemonType };

/** One Pokédex row: the species (name, description, modern types, size)
 *  plus its met state (false = never found anywhere yet). */
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
  /** True once the species was found on at least one domain. */
  met: boolean;
}

/** The read model over the two tables — read-only, no writes. Everything
 *  outside the model goes through `pokedex` below and never touches Dexie
 *  directly. */
export class PokedexRepository {
  /** All 151 species in dex order with their met state. */
  async getAll(): Promise<PokedexRow[]> {
    const [species, met] = await Promise.all([
      pokemon.getAll(),
      discoveries.knownSpecies(),
    ]);
    const metDexIds = new Set(met);
    return species.map(
      ({ dexId, name, description, types, height, weight }) => ({
        dexId,
        name,
        description,
        types,
        height,
        weight,
        met: metDexIds.has(dexId),
      }),
    );
  }
}

export const pokedex = new PokedexRepository();
