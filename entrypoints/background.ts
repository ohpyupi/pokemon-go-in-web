import type { Encounter } from '@/model/db';
import { pokedex } from '@/model/pokedex';
import { encounters } from '@/model/encounters';
import { loadProfile, TRAINER_KEY } from '@/model/trainer';
import { dexIdFrom, isBlockedHost, registrableDomain } from '@/utils/encounter';
import {
  isBackgroundMessage,
  type ContentMessage,
  type PopupMessage,
} from '@/utils/messages';

export default defineBackground(() => {
  // The controller: every model read/write from the views lands here.
  browser.runtime.onMessage.addListener(async (message: unknown) => {
    if (!isBackgroundMessage(message)) return;
    switch (message.type) {
      case 'get-encounter': {
        // dexId = f(trainer seed, hostname): deterministic per trainer ×
        // page. No trainer profile yet, or a blacklisted (dev/internal)
        // host → no encounter (register in the popup first).
        const profile = await loadProfile();
        if (!profile || isBlockedHost(message.hostname)) return { dexId: null };
        // Subdomains don't matter: chat.deepseek.com and platform.deepseek.com
        // are one place in the wild — one domain, one Pokémon.
        const domain = registrableDomain(message.hostname);
        const dexId = dexIdFrom(profile, domain);
        const entry = await encounters.markSeen(dexId, domain);
        if (entry) notifyPokedexEntryAdded(entry);
        return { dexId };
      }
      case 'get-pokedex-data':
        // The popup (the Pokédex view) reads the model through here —
        // Dexie never leaves the background.
        return { rows: await pokedex.getAll() };
    }
  });

  // The trainer profile is the world's seed. When it is cleared ("New
  // game") every page's sprite must die — and the index with it, since
  // both belong to the trainer. When it is (re)created (registration)
  // every page re-resolves its encounter against the new seed. The popup
  // only writes storage — the background reacts, so no extra hops.
  browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName !== 'local') return;
    const change = changes[TRAINER_KEY];
    if (!change) return;
    const message: ContentMessage = change.newValue
      ? { type: 'spawn' }
      : { type: 'destroy' };
    await broadcast(message);
    if (!change.newValue) {
      await encounters.removeAll(); // no trainer → no adventure → no index
    }
  });
});

/** Send a command to every tab that has a content script listening. Tabs
 *  without one (chrome://, the Web Store, …) reject the send — there is
 *  nothing to command there, and each page's own load-time spawn keeps the
 *  world consistent anyway. */
async function broadcast(message: ContentMessage): Promise<void> {
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    if (tab.id === undefined) continue;
    browser.tabs.sendMessage(tab.id, message).catch(() => undefined);
  }
}

/** Send the popup — when it is open — the new dex row, so it can merge it
 *  into the home grid without a refetch. Sent via runtime, not tabs: only
 *  extension pages hear it, never content scripts. A closed popup has no
 *  listener and rejects the send; that's fine (its next open loads fresh). */
function notifyPokedexEntryAdded(encounter: Encounter): void {
  const message: PopupMessage = { type: 'pokedex-entry-added', encounter };
  browser.runtime.sendMessage(message).catch(() => undefined);
}