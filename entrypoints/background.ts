import { acquisitions } from '@/model/acquisitions';
import { pokedex } from '@/model/pokedex';
import { trainer } from '@/model/trainer';
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
        const profile = await trainer.get();
        if (!profile || isBlockedHost(message.hostname)) return { dexId: null };
        // Subdomains don't matter: chat.deepseek.com and platform.deepseek.com
        // are one place in the wild — one domain, one Pokémon.
        const domain = registrableDomain(message.hostname);
        const dexId = dexIdFrom(profile, domain);
        const found = await acquisitions.add(dexId, {
          kind: 'found',
          foundOn: domain,
        });
        if (found?.newEntry) {
          // This Pokémon had no rows before this one — light it up in the
          // open popup. An indexed species gaining another row only changes
          // its entry page, which fetches when opened: no broadcast.
          await sendEventToPopup({ type: 'pokedex-entry-added', dexId });
        }
        return { dexId };
      }
      case 'get-pokedex-data':
        // The popup (the Pokédex view) reads the model through here —
        // Dexie never leaves the background.
        return { rows: await pokedex.getAll() };
      case 'get-acquisitions':
        // One species' rows, read only when its entry page opens — the home
        // rows never carry them.
        return { acquisitions: await acquisitions.getAllByDexId(message.dexId) };
      case 'get-profile':
        return { profile: await trainer.get() };
      case 'register-trainer': {
        await trainer.create(message);
        await sendEventToContent({ type: 'spawn' });
        await sendEventToPopup({
          type: 'profile-changed',
          profile: await trainer.get(),
        });
        return {};
      }
      case 'reset-trainer': {
        await trainer.remove();
        await acquisitions.removeAll();
        await sendEventToContent({ type: 'destroy' });
        await sendEventToPopup({ type: 'profile-changed', profile: null });
        return {};
      }
      case 'generate-address': {
        await sendEventToPopup({
          type: 'profile-changed',
          profile: await trainer.generateKeys(),
        });
        return {};
      }
    }
  });
});
