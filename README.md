# <img src="public/poke-ball.png" alt="Poké Ball" width="32"> Pokémon GO in Web

Are you bored of just navigating the web? Imagine encountering a wild Pokémon whenever you visit a new domain — the web becomes your Pokémon safari. Join the exploration!

Wild **Gen-1 Pokémon** show up at the bottom of the pages you visit and wander around. Which Pokémon meets you on which site is **deterministic** — it depends on *you* (your trainer seed) and the *domain*.

## How it works

**Registration (popup).** Click the Poké Ball toolbar icon to open the popup. First run asks for your trainer name, boy/girl, and captures the current time — the three fields form your **seed**, stored in `chrome.storage.local`. "New game" erases the trainer and lets you re-register.

**Encounters (background service worker).** Every page load, the content script asks the background for an encounter:

```
dexId = hash(name | gender | startedAt | hostname) % 151 + 1   →  1..151 (Gen 1)
```

So the same trainer visiting the same domain always meets the same Pokémon (hostname is the full host — subdomains count separately). No registered trainer → no encounters; register in the popup first.

**No dev territory.** `localhost` and IP addresses never host a Pokémon — dev and internal hosts stay safari-free. Browser-internal pages (`chrome://`, the Web Store…) can't be visited by the Pokémon at all, by platform design.

**The sprite.** The Pokémon wanders along the bottom of the page — pausing now and then, strolling left or right at its own pace. Sprites are the classic animated Gen-1 icons, which naturally face left; they turn around when they walk right.

## Project structure

```
entrypoints/
  background.ts        encounter decision: reads profile, dexId = f(seed, hostname)
  content/
    index.ts           content-script entry: host blacklist, ask background, spawn
    PokemonSprite.ts   the wandering sprite: DOM, phase machine, rAF loop
    style.css          pkmgw-*-prefixed styles (host pages can't collide)
  popup/
    index.html, main.tsx, App.tsx, App.css, style.css
                       registration + trainer card (pokéball red/white theme)
public/
  pokemon-icons/       1.png–151.png: Gen-1 animated sprites (PokéAPI)
  poke-ball.png        Poké Ball — popup brand mark and toolbar/extension icon
utils/
  trainer.ts           TrainerProfile type + chrome.storage helpers
  encounter.ts         dexIdFrom() and isBlockedHost()
scripts/
  download-icons.ts    one-shot sprite downloader (see below)
```

## Development

Requires Node ≥ 22 (the repo script uses Node's native TypeScript type-stripping; 24 works best).

```bash
npm install
npm run dev        # watch & build — then load .output/chrome-mv3-dev as an unpacked extension
```

Open `chrome://extensions`, enable developer mode, and load `.output/chrome-mv3-dev`. After **manifest changes** (new permissions, version bumps, icons…), reload the extension there. Note: your trainer profile lives in the browser's local storage — no account, no cloud. Registering on another machine gives you a different trainer.

Try it: register a trainer in the popup, then visit a few different sites — each hosts its own deterministic Gen-1 visitor.

## Refreshing the sprites

`scripts/download-icons.ts` fetches all 151 Gen-1 icons from PokéAPI into `public/pokemon-icons/` (existing files are skipped, so re-runs are safe):

```bash
node scripts/download-icons.ts
```

## Roadmap

- Real Pokédex in the popup — every encounter registers the Pokémon (a sighting is a dex entry, no catching for now)
- Walk cycles / encounter states beyond idle-move
- Trainer profile export/import, if moving between machines ever matters (a portable file — still no server)

## Disclaimer

Unofficial fan project — not affiliated with Nintendo, Game Freak, or The Pokémon Company. Pokémon sprites are fetched from the [PokéAPI](https://pokeapi.co/) sprite repository; all Pokémon content belongs to its respective owners.