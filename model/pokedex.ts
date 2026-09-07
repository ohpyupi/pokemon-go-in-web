/**
 * The Pokédex read model: `pokemon` left-joined with `encounters` into one
 * ready-to-render row per species. The controller relays these rows to the
 * popup, so the view never joins anything itself.
 */

import { encounters } from './encounters';
import { pokemon } from './pokemon';

/** One Pokédex row: the species (name + description) plus its meeting
 *  state (null = not met). */
export interface PokedexRow {
  dexId: number;
  name: string;
  description: string;
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
    return species.map(({ dexId, name, description }) => {
      const encounter = byDexId.get(dexId);
      return {
        dexId,
        name,
        description,
        seenAt: encounter?.seenAt ?? null,
        seenOn: encounter?.seenOn ?? null,
      };
    });
  }
}

export const pokedex = new PokedexRepository();
