import { isBlockedHost } from '../../utils/encounter';
import { PokemonSprite } from './PokemonSprite';
import './style.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    // No encounters on dev/internal hosts (localhost, private IPs…) — skip
    // the round-trip entirely. The background double-checks anyway.
    if (isBlockedHost(location.hostname)) return;

    // The background service worker owns the encounter logic: it derives the
    // dexId from the trainer's seed × this page's domain. The content script
    // only renders the result.
    const dexId = await getEncounter();
    if (dexId) {
      const pokemon = new PokemonSprite(dexId); // builds + appends its DOM
      pokemon.start(); // wander loop runs until destroy()
    }
  },
});

async function getEncounter(): Promise<number | null> {
  try {
    const res = (await browser.runtime.sendMessage({
      type: 'get-encounter',
      hostname: location.hostname,
    })) as { dexId?: number } | undefined;
    return res?.dexId ? res.dexId : null;
  } catch {
    return null;
  }
}