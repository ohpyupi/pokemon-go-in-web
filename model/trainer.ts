import { createAddress, createKeys, type KeyPair } from '@/utils/keys';

export type Gender = 'boy' | 'girl';

export interface TrainerData {
  name: string;
  gender: Gender;
  startedAt: number;
  address?: string;
}

type StoredTrainer = TrainerData & { keys?: KeyPair };

const TRAINER_KEY = 'trainer';

export class TrainerRepository {
  async get(): Promise<TrainerData | null> {
    const stored = await this.read();
    return stored === null ? null : publicPart(stored);
  }

  async create(data: TrainerData): Promise<void> {
    const entry: StoredTrainer = {
      name: data.name,
      gender: data.gender,
      startedAt: data.startedAt,
    };
    await browser.storage.local.set({ [TRAINER_KEY]: entry });
  }

  remove(): Promise<void> {
    return browser.storage.local.remove(TRAINER_KEY);
  }

  async generateKeys(): Promise<TrainerData | null> {
    const stored = await this.read();
    if (stored === null) return null;
    if (stored.keys === undefined) {
      const keys = await createKeys();
      stored.keys = keys;
      stored.address = await createAddress(keys.publicKey);
      await browser.storage.local.set({ [TRAINER_KEY]: stored });
    }
    return publicPart(stored);
  }

  /** The stored pair. Background only — it must never ride a message. */
  async getKeys(): Promise<KeyPair | null> {
    const stored = await this.read();
    return stored?.keys ?? null;
  }

  async removeKeys(): Promise<TrainerData | null> {
    const stored = await this.read();
    if (stored === null) return null;
    delete stored.keys;
    delete stored.address;
    await browser.storage.local.set({ [TRAINER_KEY]: stored });
    return publicPart(stored);
  }

  private async read(): Promise<StoredTrainer | null> {
    const stored = await browser.storage.local.get(TRAINER_KEY);
    return (stored[TRAINER_KEY] as StoredTrainer | undefined) ?? null;
  }
}

export const trainer = new TrainerRepository();

/** The half that may travel: everything but the key pair. */
function publicPart(stored: StoredTrainer): TrainerData {
  const { name, gender, startedAt, address } = stored;
  return { name, gender, startedAt, address };
}
