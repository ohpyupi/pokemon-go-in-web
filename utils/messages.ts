/**
 * The inter-context message protocol.
 *
 * Two shapes, both grouped by audience — which context receives them:
 *  - RequestProtocol: two-way. Whoever receives it answers with a typed
 *    reply — today the background answers, but a content script could too
 *    (see the `content` group below).
 *  - EventProtocol: one-way. Nobody answers.
 * The exported unions below are derived from the two tables, so each
 * message's request, reply (when it has one) and listeners live — and
 * change — together.
 */

import type { Encounter } from '@/model/db';
import type { PokedexRow } from '@/model/pokedex';

/** One answered message: what the sender sends, and the typed reply. */
type RequestRow<Request, Reply> = { request: Request; reply: Reply };

/** Answered requests, grouped by who receives and answers them. */
type RequestProtocol = {
  background: {
    // popup: the whole index — all 151 species + encounter state
    'get-pokedex-data': RequestRow<{}, { rows: PokedexRow[] }>;
    // content script: which page is the player on right now?
    'get-encounter': RequestRow<
      { hostname: string },
      { dexId: number | null } // or null when there is no encounter on that page
    >;
  };
  content: {
    // future: the background asks a content script, the content answers
  };
};

/** One-way events the background broadcasts, grouped by who hears them. */
type EventProtocol = {
  content: {
    spawn: {}; // profile (re)created: re-resolve and spawn the sprite
    destroy: {}; // profile erased: remove the sprite
  };
  popup: {
    // a first meeting: the popup merges the row in place instead of refetching
    'pokedex-entry-added': { encounter: Encounter };
  };
};

/** One audience group of RequestProtocol, as a discriminated union. */
type RequestsTo<Rows extends Record<string, RequestRow<unknown, unknown>>> = {
  [K in keyof Rows]: { type: K } & Rows[K]['request'];
}[keyof Rows];

/** One audience group of EventProtocol, as a discriminated union. */
type EventsTo<A extends keyof EventProtocol> = {
  [K in keyof EventProtocol[A]]: { type: K } & EventProtocol[A][K];
}[keyof EventProtocol[A]];

/** Messages the background listens for (sent up by content scripts and the
 *  popup — the popup reads model data through the controller). */
export type BackgroundMessage = RequestsTo<RequestProtocol['background']>;

/** Messages content scripts listen for (broadcast down by the background). */
export type ContentMessage = EventsTo<'content'>;

/** Messages the popup listens for (broadcast by the background while the
 *  popup is open — a closed popup has no listener, which is fine). */
export type PopupMessage = EventsTo<'popup'>;

/** True when `message` is one the background must handle. */
export function isBackgroundMessage(
  message: unknown,
): message is BackgroundMessage {
  return isOneOf(message, 'get-encounter', 'get-pokedex-data');
}

/** True when `message` is one a content script must handle. */
export function isContentMessage(message: unknown): message is ContentMessage {
  return isOneOf(message, 'spawn', 'destroy');
}

/** True when `message` is one the popup must handle. */
export function isPopupMessage(message: unknown): message is PopupMessage {
  return isOneOf(message, 'pokedex-entry-added');
}

/** Send a request to the background, get its typed reply. The one cast in
 *  the codebase lives here, at the boundary where the untrusted wire meets
 *  the types. */
export async function sendRequestToBackground<
  K extends keyof RequestProtocol['background'],
>(
  message: { type: K } & RequestProtocol['background'][K]['request'],
): Promise<RequestProtocol['background'][K]['reply']> {
  return (await browser.runtime.sendMessage(
    message,
  )) as RequestProtocol['background'][K]['reply'];
}

/** Send a one-way event to every content script — i.e. every tab. Tabs
 *  without a content script (chrome://, the Web Store, …) reject the send;
 *  there is nothing to command there, and each page's own load-time spawn
 *  keeps the world consistent anyway. Background only. */
export async function sendEventToContent(
  message: ContentMessage,
): Promise<void> {
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    if (tab.id === undefined) continue;
    browser.tabs.sendMessage(tab.id, message).catch(() => undefined);
  }
}

/** Send a one-way event to the popup — when it is open. Sent via runtime,
 *  not tabs: only extension pages hear it, never content scripts. A closed
 *  popup has no listener and rejects the send; that's fine (its next open
 *  loads fresh). Background only. */
export async function sendEventToPopup(message: PopupMessage): Promise<void> {
  await browser.runtime.sendMessage(message).catch(() => undefined);
}

function isOneOf(message: unknown, ...types: readonly string[]): boolean {
  if (typeof message !== 'object' || message === null) return false;
  const type = (message as { type?: unknown }).type;
  return typeof type === 'string' && types.includes(type);
}
