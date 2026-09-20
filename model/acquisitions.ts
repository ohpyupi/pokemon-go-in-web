import Dexie, { type Table } from 'dexie';
import { db } from './db';
import type { Acquisition } from './types';

type AcquisitionSource =
  | { kind: 'found'; foundOn: string }
  | { kind: 'shared'; sharedBy: string };

export class AcquisitionsRepository {
  constructor(private readonly table: Table<Acquisition, string>) {}

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
      const existing = await this.table.where('dexId').equals(dexId).count();
      if (source.kind === 'shared' && existing > 0) return null;
      try {
        await this.table.add(row);
      } catch (error) {
        if (error instanceof Dexie.ConstraintError) return null;
        throw error;
      }
      return { newEntry: existing === 0 };
    });
  }

  getAllByDexId(dexId: number): Promise<Acquisition[]> {
    return this.table.where('dexId').equals(dexId).sortBy('acquiredAt');
  }

  async indexedDexIds(): Promise<number[]> {
    const dexIds = await this.table.orderBy('dexId').uniqueKeys();
    return dexIds as number[]; // the index's keys are dex ids by schema
  }

  removeAll(): Promise<void> {
    return this.table.clear();
  }
}

export const acquisitions = new AcquisitionsRepository(db.acquisitions);
