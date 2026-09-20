export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

const ADDRESS_PREFIX = 'pgo1';

export function toBase64Url(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

export function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

export async function createKeys(): Promise<KeyPair> {
  // X25519 always generates a pair; the DOM lib types the result loosely.
  const pair = (await crypto.subtle.generateKey({ name: 'X25519' }, true, [
    'deriveKey',
    'deriveBits',
  ])) as CryptoKeyPair;
  const [publicRaw, privateJwk] = await Promise.all([
    crypto.subtle.exportKey('raw', pair.publicKey),
    crypto.subtle.exportKey('jwk', pair.privateKey),
  ]);
  if (privateJwk.d === undefined) {
    throw new Error('X25519 private key came back without its d field');
  }
  return {
    privateKey: privateJwk.d,
    publicKey: toBase64Url(new Uint8Array(publicRaw)),
  };
}

export function importPrivateKey(pair: KeyPair): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    { kty: 'OKP', crv: 'X25519', d: pair.privateKey, x: pair.publicKey },
    { name: 'X25519' },
    false,
    ['deriveKey', 'deriveBits'],
  );
}

export function importPublicKey(
  raw: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, { name: 'X25519' }, false, []);
}

export async function createAddress(publicKey: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(publicKey)),
  );
  // 3 bytes of digest = exactly 4 base64url characters, no padding.
  return `${ADDRESS_PREFIX}${publicKey}${toBase64Url(digest.subarray(0, 3))}`;
}

export async function parseAddress(
  address: string,
): Promise<Uint8Array<ArrayBuffer> | null> {
  const publicKey = address.slice(ADDRESS_PREFIX.length, -4);
  const raw = fromBase64Url(publicKey);
  if (raw === null || raw.length !== 32) return null;
  return (await createAddress(publicKey)) === address ? raw : null;
}
