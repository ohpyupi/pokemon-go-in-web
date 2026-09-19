/**
 * CRUD for the acquisitions table: one row per Pokémon × source, so meeting
 * the same Pokémon on the same site again — or being given it twice by the
 * same friend — changes nothing. Rows belong to the current trainer only
 * ("New game" erases them), so no trainer reference is stored.
 */

import Dexie, { type Table } from 'dexie';
import { db } from './db';
import type { Acquisition } from './types';

/** Where a row came from — the rest is the repository's to add. */
type AcquisitionSource =
  | { kind: 'found'; foundOn: string }
  | { kind: 'shared'; sharedBy: string };

/** One repository per table; everything outside the model goes through
 *  `acquisitions` below and never touches Dexie directly. */
export class AcquisitionsRepository {
  constructor(private readonly table: Table<Acquisition, string>) {}

  /** Write one row — a Pokémon met in the wild, or one a friend shared.
   *  Resolves null when nothing was written: you already had this exact
   *  source for this Pokémon. `newEntry` says whether this was the
   *  species' very first row. */
  add(
    dexId: number,
    source: AcquisitionSource,
  ): Promise<{ newEntry: boolean } | null> {
    const row: Acquisition = {
      id: crypto.randomUUID(),
      dexId,
      acquiredAt: Date.now(),
      ...source,
    };
    return db.transaction('rw', this.table, async () => {
      // Look, then write, in one transaction — so the "new entry" answer
      // holds when two tabs gain something at the same moment, and a
      // duplicate still hits the unique indexes.
      const known = await this.table.where('dexId').equals(dexId).first();
      try {
        await this.table.add(row);
      } catch (error) {
        if (error instanceof Dexie.ConstraintError) return null;
        throw error;
      }
      return { newEntry: known === undefined };
    });
  }

  /** Every row for one Pokémon, oldest first — the entry page renders it. */
  getAllByDexId(dexId: number): Promise<Acquisition[]> {
    return this.table.where('dexId').equals(dexId).sortBy('acquiredAt');
  }

  /** Every Pokémon with at least one row, in dex order — found and shared
   *  alike. */
  async indexedDexIds(): Promise<number[]> {
    const dexIds = await this.table.orderBy('dexId').uniqueKeys();
    return dexIds as number[]; // the index's keys are dex ids by schema
  }

  /** Erase the log ("New game" starts a fresh adventure). */
  removeAll(): Promise<void> {
    return this.table.clear();
  }
}

export const acquisitions = new AcquisitionsRepository(db.acquisitions);