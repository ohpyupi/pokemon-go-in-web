/**
 * The inter-context message protocol.
 *
 * Each context type-lists the messages it may receive: the background
 * listens for BackgroundMessage, content scripts for ContentMessage. The
 * string values below are the wire format; the type guards let a listener
 * narrow an arbitrary incoming message to its union before handling it.
 */

import type { Encounter } from '@/model/db';
import type { PokedexRow } from '@/model/pokedex';

/** Messages the background listens for (sent up by content scripts and
 *  the popup — the popup reads model data through the controller). */
export type BackgroundMessage =
  | { type: 'get-encounter'; hostname: string }
  | { type: 'get-pokedex-data' }; // popup: all species + encounter state

/** Messages content scripts listen for (broadcast down by the background). */
export type ContentMessage =
  | { type: 'spawn' } // profile (re)created: re-resolve and spawn the sprite
  | { type: 'destroy' }; // profile erased: remove the sprite

/** Messages the popup listens for (broadcast by the background while the
 *  popup is open — a closed popup has no listener, which is fine). */
export type PopupMessage = {
  type: 'pokedex-entry-added';
  encounter: Encounter;
}; // a first
// meeting: the popup merges the row in place instead of refetching

/** Reply to get-encounter: a dexId, or null when there is no encounter here. */
export type EncounterReply = { dexId: number | null };

/** Reply to get-pokedex-data: the rows (all 151 species + encounter state). */
export type PokedexReply = { rows: PokedexRow[] };

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

function isOneOf(message: unknown, ...types: readonly string[]): boolean {
  if (typeof message !== 'object' || message === null) return false;
  const type = (message as { type?: unknown }).type;
  return typeof type === 'string' && types.includes(type);
}
