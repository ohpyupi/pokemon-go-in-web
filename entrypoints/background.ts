import { dexIdFrom, isBlockedHost } from '@/utils/encounter';
import { isBackgroundMessage, type ContentMessage } from '@/utils/messages';
import { loadProfile, TRAINER_KEY } from '@/utils/trainer';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(async (message: unknown) => {
    if (!isBackgroundMessage(message)) return;
    // dexId = f(trainer seed, hostname): deterministic per trainer × page.
    // No trainer profile yet, or a blacklisted (dev/internal) host →
    // no encounter (register in the popup first).
    const profile = await loadProfile();
    if (!profile || isBlockedHost(message.hostname)) return { dexId: null };
    return { dexId: dexIdFrom(profile, message.hostname) };
  });

  // The trainer profile is the world's seed. When it is cleared ("New game")
  // every page's sprite must die; when it is (re)created (registration) every
  // page must re-resolve its encounter against the new seed. The popup only
  // writes storage — the background reacts, so no extra hops are needed.
  browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName !== 'local') return;
    const change = changes[TRAINER_KEY];
    if (!change) return;
    const message: ContentMessage = change.newValue
      ? { type: 'spawn' }
      : { type: 'destroy' };
    await broadcast(message);
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