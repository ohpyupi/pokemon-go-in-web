/**
 * The Pokédex read model: the species catalog plus which species are
 * indexed, joined into one ready-to-render row per species. The controller
 * relays these rows to the popup, so the view never joins anything itself.
 * Acquisition rows are not part of the home rows — the entry page fetches
 * a species' rows separately when it is opened.
 */

import { acquisitions } from './acquisitions';
import { pokemon } from './pokemon';
import type { PokemonType } from './types';

/** The popup-facing alias of the type slugs (see types.ts). */
export type { PokemonType };

/** One Pokédex row: the species (name, description, modern types, size)
 *  plus its indexed state (false = nothing gained yet). */
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
  /** True once any row exists for the species — found or shared. */
  indexed: boolean;
}

/** The read model over the two tables — read-only, no writes. Everything
 *  outside the model goes through `pokedex` below and never touches Dexie
 *  directly. */
export class PokedexRepository {
  /** All 151 species in dex order with their indexed state. */
  async getAll(): Promise<PokedexRow[]> {
    const [species, indexedIds] = await Promise.all([
      pokemon.getAll(),
      acquisitions.indexedDexIds(),
    ]);
    const indexed = new Set(indexedIds);
    return species.map(
      ({ dexId, name, description, types, height, weight }) => ({
        dexId,
        name,
        description,
        types,
        height,
        weight,
        indexed: indexed.has(dexId),
      }),
    );
  }
}

export const pokedex = new PokedexRepository();
