/**
 * The app's single database — the Model's data store.
 *
 * One Dexie class over one IndexedDB database ('dex'), holding every table:
 *
 *   pokemon      — the species catalog: all 151 Gen-1 rows, seeded once when
 *                  the database is first created (see populate below). Pure
 *                  static data; never changes after seed.
 *   acquisitions — the log of how each entry was gained: found in the wild,
 *                  or shared by a friend. One row per Pokémon × source;
 *                  wiped on "New game".
 *   discoveries  — TODO: drop in v3. Read only by the v2 migration.
 *
 * Schema grows in the constructor: each `version()` adds a migration.
 * Background-only: Dexie must never be bundled into the popup or content
 * views. They read model data through the message protocol (the controller)
 * instead. One module instance per JS context means exactly one database
 * object exists in practice.
 */

import Dexie, { type Table } from 'dexie';
import { SPECIES } from './seed/species';
import type { Acquisition, Discovery, Pokemon } from './types';

class DexDB extends Dexie {
  pokemon!: Table<Pokemon, number>;
  acquisitions!: Table<Acquisition, string>;
  /** @deprecated TODO: drop in v3 — read `acquisitions` instead. */
  discoveries!: Table<Discovery, [number, string]>;

  constructor() {
    super('dex');
    this.version(1).stores({
      pokemon: 'dexId',
      // Compound key = one row per species × domain; the plain dexId
      // index counts a species' rows (the cap) and says which species
      // are met. A species' ≤10 rows are read off it and sorted in
      // memory — no timeline index needed.
      discoveries: '[dexId+foundOn], dexId',
    });
    // v2 — the acquisition log, replacing the wild-only log.
    //
    // A table left out of a version's stores keeps its earlier schema (only
    // `null` drops one) — but an index you do not restate IS dropped, so a
    // later version of `acquisitions` must repeat both &[...] below.
    //
    // Those two unique indexes are the dedup rule: one row per Pokémon ×
    // source. A 'found' row has no `sharedBy`, and IndexedDB skips a row
    // whose indexed value is missing, so each index constrains only its own
    // kind — a site name may equal a friend's name. Verified in Chrome.
    //
    // TODO: drop `discoveries` in v3 — v2 only copies from it.
    this.version(2)
      .stores({
        acquisitions:
          'id, dexId, kind, foundOn, sharedBy, &[dexId+foundOn], &[dexId+sharedBy]',
      })
      .upgrade(async (tx) => {
        // Every old row is a wild find, so the copy is a straight rename.
        const old = await tx
          .table<Discovery, [number, string]>('discoveries')
          .toArray();
        await Promise.all(
          old.map((row) =>
            tx.table<Acquisition, string>('acquisitions').add({
              id: crypto.randomUUID(),
              dexId: row.dexId,
              kind: 'found',
              foundOn: row.foundOn,
              acquiredAt: row.foundAt,
            }),
          ),
        );
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
