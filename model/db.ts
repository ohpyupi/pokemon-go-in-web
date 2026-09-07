/**
 * The app's single database — the Model's data store.
 *
 * One Dexie class over one IndexedDB database ('dex'), holding every table:
 *
 *   pokemon    — the species catalog: all 151 Gen-1 rows, seeded once when
 *                the database is first created (see populate below). Pure
 *                static data; never changes after seed.
 *   encounters — the trainer's index: one row per met species, holding
 *                when and where the meeting happened. Wiped on "New game".
 *
 * Schema grows in the constructor: each `version()` adds a migration.
 * Background-only: Dexie must never be bundled into the popup or content
 * views. They read model data through the message protocol (the controller)
 * instead. One module instance per JS context means exactly one database
 * object exists in practice.
 */

import Dexie, { type Table } from 'dexie';
import { SPECIES } from './seed/species';

/** A species-catalog row. The description comes with the seed (fetched
 *  from PokeAPI, first English flavor text); future static data (types,
 *  …) joins here and in the seed too. */
export interface Pokemon {
  dexId: number;
  name: string;
  description: string;
}

/** An index row: this species was met at `seenOn` on `seenAt`. One row per
 *  species (dexId is the key), so "when it was met" is the first meeting. */
export interface Encounter {
  dexId: number;
  seenAt: number;
  seenOn: string;
}

class DexDB extends Dexie {
  pokemon!: Table<Pokemon, number>;
  encounters!: Table<Encounter, number>;

  constructor() {
    super('dex');
    this.version(1).stores({
      pokemon: 'dexId',
      encounters: 'dexId',
    });
    // Runs exactly once, inside the transaction that creates the database:
    // pour the catalog in. (A version bump later re-runs nothing here.)
    this.on('populate', (tx) => {
      tx.table<Pokemon, number>('pokemon').bulkAdd([...SPECIES]);
    });
  }
}

/** The singleton instance. Import this, never `new DexDB()`. */
export const db = new DexDB();
