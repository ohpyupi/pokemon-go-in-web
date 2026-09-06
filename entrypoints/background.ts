import { dexIdFrom, isBlockedHost } from '../utils/encounter';
import { loadProfile } from '../utils/trainer';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(async (message) => {
    if (message?.type === 'get-encounter') {
      // dexId = f(trainer seed, hostname): deterministic per trainer × page.
      // No trainer profile yet, or a blacklisted (dev/internal) host →
      // no encounter (register in the popup first).
      const profile = await loadProfile();
      const hostname = String(message.hostname ?? '');
      if (!profile || isBlockedHost(hostname)) return { dexId: null };
      return { dexId: dexIdFrom(profile, hostname) };
    }
  });
});