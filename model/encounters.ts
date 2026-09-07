/**
 * CRUD for the encounters table: the trainer's index (one row per met
 * species). Rows belong to the current trainer only — "New game" erases
 * them — so no trainer reference is stored.
 */

import Dexie, { type Table } from 'dexie';
import { db, type Encounter } from './db';

/** One repository per table; everything outside the model goes through
 *  `encounters` below and never touches Dexie directly. */
export class EncountersRepository {
  constructor(private readonly table: Table<Encounter, number>) {}

  /** Record a meeting. The first meeting wins: dexId is the table's key,
   *  and `add` rejects when a row already exists — a later sighting of the
   *  same species must not overwrite when/where it first appeared. */
  async markSeen(dexId: number, seenOn: string): Promise<void> {
    try {
      await this.table.add({ dexId, seenAt: Date.now(), seenOn });
    } catch (error) {
      if (!(error instanceof Dexie.ConstraintError)) throw error;
    }
  }

  /** One index row, or undefined when that species was never met. */
  get(dexId: number): Promise<Encounter | undefined> {
    return this.table.get(dexId);
  }

  /** Every met species, in dex order. */
  getAll(): Promise<Encounter[]> {
    return this.table.toArray();
  }

  /** Erase the index ("New game" starts a fresh adventure). */
  removeAll(): Promise<void> {
    return this.table.clear();
  }
}

export const encounters = new EncountersRepository(db.encounters);