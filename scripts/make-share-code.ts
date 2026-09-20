import {
  createCipheriv,
  createHash,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  randomBytes,
} from 'node:crypto';

const CODE_PREFIX = 'pgos1';
const ADDRESS_PREFIX = 'pgo1';
const CHECKSUM_LENGTH = 4;
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SPKI_PREFIX = Buffer.from('302a300506032b656e032100', 'hex');

const [address, dexIdText] = process.argv.slice(2);
if (address === undefined || dexIdText === undefined) {
  console.error(
    'usage: node scripts/make-share-code.ts <address> <dexId>',
  );
  process.exit(1);
}

const dexId = Number(dexIdText);
if (!Number.isInteger(dexId)) {
  console.error(`not a dex id: ${dexIdText}`);
  process.exit(1);
}

const friendKey = parseAddress(address);
if (friendKey === null) {
  console.error(`not a valid address: ${address}`);
  process.exit(1);
}

const pair = generateKeyPairSync('x25519');
const friend = createPublicKey({
  key: Buffer.concat([SPKI_PREFIX, friendKey]),
  format: 'der',
  type: 'spki',
});
const secret = diffieHellman({
  privateKey: pair.privateKey,
  publicKey: friend,
});
const iv = randomBytes(IV_LENGTH);
const cipher = createCipheriv('aes-256-gcm', secret, iv);
const payload = JSON.stringify({ dexId, name: "Sudoer" });
const sealed = Buffer.concat([
  cipher.update(payload, 'utf8'),
  cipher.final(),
  cipher.getAuthTag(),
]);
const ephemeral = pair.publicKey.export({ format: 'der', type: 'spki' });
const body = Buffer.concat([ephemeral.subarray(SPKI_PREFIX.length), iv, sealed]);

console.log(`${CODE_PREFIX}${body.toString('base64url')}`);

function parseAddress(text: string): Buffer | null {
  if (!text.startsWith(ADDRESS_PREFIX)) return null;
  const key = text.slice(ADDRESS_PREFIX.length, -CHECKSUM_LENGTH);
  const raw = Buffer.from(key, 'base64url');
  if (raw.length !== KEY_LENGTH) return null;
  const checksum = createHash('sha256')
    .update(key)
    .digest()
    .subarray(0, 3)
    .toString('base64url');
  return text.slice(-CHECKSUM_LENGTH) === checksum ? raw : null;
}
