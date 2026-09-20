import type { Table } from 'dexie';
import { db } from './db';
import type { Friend } from './types';

export class FriendsRepository {
  constructor(private readonly table: Table<Friend, string>) {}

  getAll(): Promise<Friend[]> {
    return this.table.orderBy('addedAt').toArray();
  }

  async add(address: string, nickname: string): Promise<Friend> {
    const friend: Friend = { address, nickname, addedAt: Date.now() };
    await this.table.put(friend);
    return friend;
  }

  remove(address: string): Promise<void> {
    return this.table.delete(address);
  }
}

export const friends = new FriendsRepository(db.friends);
