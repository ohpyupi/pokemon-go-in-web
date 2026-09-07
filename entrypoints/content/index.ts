import { isBlockedHost } from '@/utils/encounter';
import { isContentMessage, sendRequestToBackground } from '@/utils/messages';
import { PokemonSprite } from './PokemonSprite';
import './style.css';

/** The sprite currently wandering this page, or null between encounters. */
let pokemon: PokemonSprite | null = null;

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    // No encounters on dev/internal hosts (localhost, private IPs…) — skip
    // the round-trip entirely. The background double-checks anyway.
    if (isBlockedHost(location.hostname)) return;

    // The background service worker owns the encounter logic: it derives the
    // dexId from the trainer's seed × this page's domain. The content script
    // only renders the result — once at page load, and again on demand when
    // the background broadcasts that the trainer profile (the seed) changed.
    browser.runtime.onMessage.addListener((message: unknown) => {
      if (!isContentMessage(message)) return;
      switch (message.type) {
        case 'destroy':
          // Trainer erased ("New game"): the world goes quiet here too.
          pokemon?.destroy();
          pokemon = null;
          break;
        case 'spawn':
          // Trainer (re)created: re-resolve this page against the new seed.
          void spawn();
          break;
      }
    });

    await spawn(); // the page's own load-time encounter
  },
});

/** Resolve this page's encounter with the background and render the sprite,
 *  replacing any sprite already present. When the background is unreachable
 *  or has no encounter for this page, the page simply stays quiet. */
async function spawn(): Promise<void> {
  pokemon?.destroy();
  pokemon = null;
  try {
    const { dexId } = await sendRequestToBackground({
      type: 'get-encounter',
      hostname: location.hostname,
    });
    if (!dexId) return;
    pokemon = new PokemonSprite(dexId); // builds + appends its DOM
    pokemon.start(); // wander loop runs until destroy()
  } catch {
    // no answer (service worker asleep, race…) — this page stays quiet
  }
}
