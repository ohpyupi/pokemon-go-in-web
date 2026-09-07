/**
 * CRUD for the pokemon table: the species catalog (all 151 rows, seeded).
 * The catalog is immutable at runtime — writes only happen through schema
 * migrations — so this repository is read-only.
 */

import type { Table } from 'dexie';
import { db, type Pokemon } from './db';

/** One repository per table; everything outside the model goes through
 *  `pokemon` below and never touches Dexie directly. */
export class PokemonRepository {
  constructor(private readonly table: Table<Pokemon, number>) {}

  /** Every species, in dex order (rows iterate key-ascending). */
  getAll(): Promise<Pokemon[]> {
    return this.table.toArray();
  }

  get(dexId: number): Promise<Pokemon | undefined> {
    return this.table.get(dexId);
  }
}

export const pokemon = new PokemonRepository(db.pokemon);
