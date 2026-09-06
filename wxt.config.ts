import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    // Display name for chrome://extensions; the npm package name is the
    // lowercase slug and can't carry the accents.
    name: 'Pokémon GO in Web',
    // Trainer profile (name, gender, start time) lives in chrome.storage.
    permissions: ['storage'],
    // Poké Ball toolbar/extension icon (30×30 source — Chrome scales it).
    icons: {
      16: 'poke-ball.png',
      32: 'poke-ball.png',
      48: 'poke-ball.png',
      128: 'poke-ball.png',
    },
    // Page DOMs (where the content script injects the sprite) must be
    // explicitly allowed to load extension assets.
    web_accessible_resources: [
      { resources: ['pokemon-icons/*'], matches: ['<all_urls>'] },
    ],
  },
});
