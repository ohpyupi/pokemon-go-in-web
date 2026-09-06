/**
 * The trainer profile: what the user picks during registration in the popup.
 * The three fields together form the trainer's seed — later the background
 * service worker will derive encounters from them (dexId = f(seed, hostname)).
 */

export type Gender = 'boy' | 'girl';

export interface TrainerProfile {
  name: string;
  gender: Gender;
  /** Epoch ms captured when the adventure began (registration time). */
  startedAt: number;
}

const TRAINER_KEY = 'trainer';

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