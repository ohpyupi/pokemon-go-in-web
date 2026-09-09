import { discoveries } from '@/model/discoveries';
import { pokedex } from '@/model/pokedex';
import { loadProfile, TRAINER_KEY } from '@/model/trainer';
import { dexIdFrom, isBlockedHost, registrableDomain } from '@/utils/encounter';
import {
  isBackgroundMessage,
  sendEventToContent,
  sendEventToPopup,
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
        const found = await discoveries.discover(dexId, domain);
        if (found?.newSpecies) {
          // A species entered the dex for the first time — light it up in
          // the open popup. A known species found on a new domain only
          // changes its entry page, which fetches when opened: no broadcast.
          await sendEventToPopup({ type: 'pokedex-entry-added', dexId });
        }
        return { dexId };
      }
      case 'get-pokedex-data':
        // The popup (the Pokédex view) reads the model through here —
        // Dexie never leaves the background.
        return { rows: await pokedex.getAll() };
      case 'get-discoveries':
        // One species' findings, read only when its entry page opens — the
        // home rows never carry discovery data.
        return { discoveries: await discoveries.getAllByDexId(message.dexId) };
    }
  });

  // The trainer profile is the world's seed. When it is cleared ("New
  // game") every page's sprite must die — and the wild log with it, since
  // both belong to the trainer. When it is (re)created (registration)
  // every page re-resolves its encounter against the new seed. The popup
  // only writes storage — the background reacts, so no extra hops.
  browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName !== 'local') return;
    const change = changes[TRAINER_KEY];
    if (!change) return;
    await sendEventToContent(
      change.newValue ? { type: 'spawn' } : { type: 'destroy' },
    );
    if (!change.newValue) {
      await discoveries.removeAll(); // no trainer → no adventure → no finds
    }
  });
});
