/**
 * CRUD for the discoveries table: every domain a species was found on.
 * One row per species × domain — finding the same Pokémon on the same site
 * again changes nothing — kept to the first 10 domains per species, so the
 * table stays bounded (151 species × 10 domains at most). Rows belong to
 * the current trainer only — "New game" erases them — so no trainer
 * reference is stored.
 */

import Dexie, { type Table } from 'dexie';
import { type Discovery, db } from './db';

/** A species' timeline never grows past this many domains. Once it is
 *  full, later finds are not recorded — the first ones stay. */
const MAX_DOMAINS_PER_SPECIES = 10;

/** One repository per table; everything outside the model goes through
 *  `discoveries` below and never touches Dexie directly. */
export class DiscoveriesRepository {
  constructor(private readonly table: Table<Discovery, [number, string]>) {}

  /** Record a find. The first find on a domain wins: [dexId + foundOn] is
   *  the table's key, and `add` rejects when the pair already exists — a
   *  later visit to the same site must not rewrite when it first happened.
   *  Resolves null when nothing was recorded — the domain was already
   *  known, or the species' timeline is full. Otherwise the stored row
   *  plus whether it was the species' very first find (the popup only
   *  needs to hear about that one). */
  async discover(
    dexId: number,
    foundOn: string,
  ): Promise<{ discovery: Discovery; newSpecies: boolean } | null> {
    const row: Discovery = { dexId, foundOn, foundAt: Date.now() };
    return db.transaction('rw', this.table, async () => {
      // The cap, checked before the add — once a species has 10 domains
      // the timeline is final. The transaction makes the check and the
      // add one atomic step: two tabs finding two new domains of the same
      // species at once run one after another, so the cap can never be
      // overrun. No rows are read, nothing is evicted.
      const known = await this.table.where('dexId').equals(dexId).count();
      if (known >= MAX_DOMAINS_PER_SPECIES) return null;
      try {
        await this.table.add(row);
      } catch (error) {
        if (error instanceof Dexie.ConstraintError) return null;
        throw error;
      }
      return { discovery: row, newSpecies: known === 0 };
    });
  }

  /** Every domain the species was found on, oldest find first (≤ 10). */
  getAllByDexId(dexId: number): Promise<Discovery[]> {
    // At most 10 rows — just read them all from the dexId index and sort.
    return this.table.where('dexId').equals(dexId).sortBy('foundAt');
  }

  /** Every species found at least once, in dex order. */
  async knownSpecies(): Promise<number[]> {
    const dexIds = await this.table.orderBy('dexId').uniqueKeys();
    return dexIds as number[]; // the index's keys are dex ids by schema
  }

  /** Erase the log ("New game" starts a fresh adventure). */
  removeAll(): Promise<void> {
    return this.table.clear();
  }
}

export const discoveries = new DiscoveriesRepository(db.discoveries);
