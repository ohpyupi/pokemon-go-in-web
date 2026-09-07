import type { PublicPath } from 'wxt/browser';

/** The species sprite from the shared icon set — the same files the content
 *  script wanders the page with. WXT's getURL only accepts typed
 *  `PublicPath` literals, hence the cast. */
function PokemonIcon({ dexId, alt }: { dexId: number; alt: string }) {
  const src = browser.runtime.getURL(
    `pokemon-icons/${dexId}.png` as PublicPath,
  );
  return <img src={src} alt={alt} />;
}

export default PokemonIcon;
