/**
 * The trainer profile: what the user picks during registration in the popup.
 * The three fields together form the trainer's seed: the background derives
 * every encounter from them (dexId = f(seed, hostname)) and watches this
 * key's (dis)appearance to keep the wandering world in sync.
 */

export type Gender = 'boy' | 'girl';

export interface TrainerProfile {
  name: string;
  gender: Gender;
  /** Epoch ms captured when the adventure began (registration time). */
  startedAt: number;
}

/** Storage key for the profile (exported for the background's watcher). */
export const TRAINER_KEY = 'trainer';

export async function loadProfile(): Promise<TrainerProfile | null> {
  const stored = await browser.storage.local.get(TRAINER_KEY);
  return (stored[TRAINER_KEY] as TrainerProfile | undefined) ?? null;
}

export async function saveProfile(profile: TrainerProfile): Promise<void> {
  await browser.storage.local.set({ [TRAINER_KEY]: profile });
}

export async function clearProfile(): Promise<void> {
  await browser.storage.local.remove(TRAINER_KEY);
}
