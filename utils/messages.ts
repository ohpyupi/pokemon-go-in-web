/**
 * The inter-context message protocol.
 *
 * Each context type-lists the messages it may receive: the background
 * listens for BackgroundMessage, content scripts for ContentMessage. The
 * string values below are the wire format; the type guards let a listener
 * narrow an arbitrary incoming message to its union before handling it.
 */

/** Messages the background listens for (sent up by content scripts). */
export type BackgroundMessage = { type: 'get-encounter'; hostname: string };

/** Messages content scripts listen for (broadcast down by the background). */
export type ContentMessage =
  | { type: 'spawn' } // profile (re)created: re-resolve and spawn the sprite
  | { type: 'destroy' }; // profile erased: remove the sprite

/** Reply to get-encounter: a dexId, or null when there is no encounter here. */
export type EncounterReply = { dexId: number | null };

/** True when `message` is one the background must handle. */
export function isBackgroundMessage(message: unknown): message is BackgroundMessage {
  return isOneOf(message, 'get-encounter');
}

/** True when `message` is one a content script must handle. */
export function isContentMessage(message: unknown): message is ContentMessage {
  return isOneOf(message, 'spawn', 'destroy');
}

function isOneOf(message: unknown, ...types: readonly string[]): boolean {
  if (typeof message !== 'object' || message === null) return false;
  const type = (message as { type?: unknown }).type;
  return typeof type === 'string' && types.includes(type);
}