/** The shapes stored in the database. Kept out of db.ts so that file holds
 *  only the schema and its migrations. */

/** The modern type set — the 18 slugs PokeAPI / Pokémon GO use today,
 *  lowercase (e.g. 'grass', 'fire'). */
export type PokemonType =
  | 'normal'
  | 'fire'
  | 'water'
  | 'electric'
  | 'grass'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'
  | 'fairy';

/** A species-catalog row. All static data comes with the seed (fetched
 *  from PokeAPI): the first English flavor text as the description, the
 *  modern type set (current games / Pokémon GO, not Gen-1 originals) and
 *  the size in PokeAPI raw units. */
export interface Pokemon {
  dexId: number;
  name: string;
  description: string;
  /** Modern type slugs, primary first (e.g. ['grass', 'poison']). */
  types: PokemonType[];
  /** Height in decimeters. */
  height: number;
  /** Weight in hectograms. */
  weight: number;
}

/** TODO: remove in v3 — read only by the v2 migration. */
export interface Discovery {
  dexId: number;
  foundOn: string;
  foundAt: number;
}

interface AcquisitionBase {
  /** Random, not derived from the row's data, so it survives an
   *  export/import round trip unchanged. */
  id: string;
  dexId: number;
  /** When *you* got it, on your clock. For a shared row that is when you
   *  opened the gift, not when the gift was made. */
  acquiredAt: number;
}

export interface FoundAcquisition extends AcquisitionBase {
  kind: 'found';
  foundOn: string;
}

export interface SharedAcquisition extends AcquisitionBase {
  kind: 'shared';
  sharedBy: string;
}

export type Acquisition = FoundAcquisition | SharedAcquisition;