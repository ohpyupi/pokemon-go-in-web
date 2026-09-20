/** A share code: the payload sealed to one friend's address, unsigned. */
import {
  fromBase64Url,
  importPrivateKey,
  importPublicKey,
  type KeyPair,
  parseAddress,
  toBase64Url,
} from './keys';

export interface SharePayload {
  dexId: number;
  name: string;
}

const CODE_PREFIX = 'pgos1';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

/** Seal a payload to one friend's address: `null` when the address is broken. */
export async function createShareCode(
  address: string,
  payload: SharePayload,
): Promise<string | null> {
  const raw = await parseAddress(address);
  if (raw === null) return null;
  const pair = (await crypto.subtle.generateKey({ name: 'X25519' }, true, [
    'deriveKey',
    'deriveBits',
  ])) as CryptoKeyPair;
  const key = await deriveKey(pair.privateKey, raw, 'encrypt');
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext),
  );
  const publicRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', pair.publicKey),
  );
  const body = new Uint8Array([...publicRaw, ...iv, ...ciphertext]);
  return `${CODE_PREFIX}${toBase64Url(body)}`;
}

/** Open a code made for my address: `null` when it is broken, or made for
 *  someone else. */
export async function openShareCode(
  code: string,
  keys: KeyPair,
): Promise<SharePayload | null> {
  const text = code.trim();
  if (!text.startsWith(CODE_PREFIX)) return null;
  const body = fromBase64Url(text.slice(CODE_PREFIX.length));
  if (body === null || body.length <= KEY_LENGTH + IV_LENGTH) return null;
  const iv = body.subarray(KEY_LENGTH, KEY_LENGTH + IV_LENGTH);
  try {
    const key = await deriveKey(
      await importPrivateKey(keys),
      body.subarray(0, KEY_LENGTH),
      'decrypt',
    );
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      body.subarray(KEY_LENGTH + IV_LENGTH),
    );
    return toPayload(new TextDecoder().decode(plaintext));
  } catch {
    return null;
  }
}

async function deriveKey(
  privateKey: CryptoKey,
  publicRaw: Uint8Array<ArrayBuffer>,
  usage: 'encrypt' | 'decrypt',
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: 'X25519', public: await importPublicKey(publicRaw) },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage],
  );
}

function toPayload(text: string): SharePayload | null {
  const { dexId, name } = JSON.parse(text) as Partial<SharePayload>;
  if (typeof dexId !== 'number' || typeof name !== 'string') return null;
  return { dexId, name };
}
