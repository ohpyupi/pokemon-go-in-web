/**
 * Encounter math: which Pokémon shows up on which page — and which hosts
 * never host one.
 *
 * dexId is deterministic — the same trainer (seed) visiting the same domain
 * always meets the same Pokémon. The seed is what the trainer chose at
 * registration: name, gender, and the moment the adventure started.
 *
 * Browser-internal pages (chrome://, the Web Store, …) can't be injected
 * into at all, so no code needed there. The blacklist below covers dev and
 * internal hosts — every one of them is localhost or a bare IP literal.
 */
import { isIP } from 'is-ip';
import type { TrainerProfile } from '@/model/trainer';

export const GEN1_COUNT = 151;

/** FNV-1a 32-bit string hash — small, fast, stable across platforms. */
function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Gen-1 dex id (1–151) for a trainer × page domain. */
export function dexIdFrom(profile: TrainerProfile, hostname: string): number {
  const seed = `${profile.name}|${profile.gender}|${profile.startedAt}|${hostname}`;
  return (hashString(seed) % GEN1_COUNT) + 1;
}

// ---- host blacklist ----

/** True when the host should never host an encounter. Any IP literal is
 *  blocked — dev and internal hosts are always localhost or an IP, so no
 *  private-range table is needed (public IP-literal pages get blocked too,
 *  which is a fair simplification). */
export function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, ''); // strip IPv6 brackets
  if (host === 'localhost') return true;
  return isIP(host); // valid IPv4 or IPv6 literal
}