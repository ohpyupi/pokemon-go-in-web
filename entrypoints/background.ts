import { acquisitions } from '@/model/acquisitions';
import { friends } from '@/model/friends';
import { pokedex } from '@/model/pokedex';
import { pokemon } from '@/model/pokemon';
import { trainer } from '@/model/trainer';
import { dexIdFrom, isBlockedHost, registrableDomain } from '@/utils/encounter';
import {
  isBackgroundMessage,
  sendEventToContent,
  sendEventToPopup,
} from '@/utils/messages';
import { createShareCode, openShareCode } from '@/utils/share';

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
        return {
          acquisitions: await acquisitions.getAllByDexId(message.dexId),
        };
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
      case 'remove-address': {
        await sendEventToPopup({
          type: 'profile-changed',
          profile: await trainer.removeKeys(),
        });
        return {};
      }
      case 'get-friends':
        return { friends: await friends.getAll() };
      case 'add-friend': {
        const friend = await friends.add(message.address, message.nickname);
        await sendEventToPopup({ type: 'friend-changed', op: 'add', friend });
        return {};
      }
      case 'remove-friend': {
        await friends.remove(message.address);
        await sendEventToPopup({
          type: 'friend-changed',
          op: 'remove',
          address: message.address,
        });
        return {};
      }
      case 'create-share-code': {
        const profile = await trainer.get();
        if (profile === null) return { code: null };
        const code = await createShareCode(message.address, {
          dexId: message.dexId,
          name: profile.name,
        });
        return { code };
      }
      case 'open-share-code': {
        const keys = await trainer.getKeys();
        if (keys === null) return { dexId: null };
        const payload = await openShareCode(message.code, keys);
        if (payload === null) return { dexId: null };
        const { dexId, name } = payload;
        // The code is unsigned, so anyone may seal one to my address: the
        // catalog decides whether this species exists.
        if ((await pokemon.get(dexId)) === undefined) return { dexId: null };
        const shared = await acquisitions.add(dexId, {
          kind: 'shared',
          sharedBy: name,
        });
        if (shared?.newEntry) {
          await sendEventToPopup({ type: 'pokedex-entry-added', dexId });
        }
        return { dexId };
      }
    }
  });
});
