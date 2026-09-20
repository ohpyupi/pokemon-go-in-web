export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

function toBase64Url(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

export async function createKeys(): Promise<KeyPair> {
  // X25519 always generates a pair; the DOM lib types the result loosely.
  const pair = (await crypto.subtle.generateKey(
    { name: 'X25519' },
    true,
    ['deriveKey', 'deriveBits'],
  )) as CryptoKeyPair;
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

export async function addressOf(publicKey: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(publicKey)),
  );
  // 3 bytes of digest = exactly 4 base64url characters, no padding.
  return `pgo1${publicKey}${toBase64Url(digest.subarray(0, 3))}`;
}
