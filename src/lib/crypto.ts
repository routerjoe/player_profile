import sodium from "libsodium-wrappers";

/**
 * libsodium secretbox helpers for encrypting/decrypting tokens at rest.
 * - Keys are derived from APP_SECRET using crypto_pwhash with a random salt (stored with ciphertext).
 * - Output format (Bytes): [salt(16) | nonce(24) | cipher(...)]
 * - Never expose APP_SECRET to the client.
 */

const SALT_BYTES = 16;   // crypto_pwhash_SALTBYTES
const NONCE_BYTES = 24;  // crypto_secretbox_NONCEBYTES
const KEY_BYTES = 32;    // crypto_secretbox_KEYBYTES

let _sodiumReady: Promise<typeof sodium> | null = null;
async function getSodium(): Promise<typeof sodium> {
  if (!_sodiumReady) {
    _sodiumReady = sodium.ready.then(() => sodium);
  }
  return _sodiumReady;
}

function ensureAppSecret(secret?: string): string {
  const s = secret || process.env.APP_SECRET;
  if (!s || s.length < 16) {
    throw new Error("APP_SECRET is not set or too short. Set a strong random value in your .env.local.");
  }
  return s;
}

/**
 * Derive a 32-byte key from APP_SECRET using crypto_pwhash with the provided salt.
 */
async function deriveKey(appSecret: string, salt: Uint8Array): Promise<Uint8Array> {
  const s = await getSodium();
  return s.crypto_pwhash(
    KEY_BYTES,
    appSecret,
    salt,
    s.crypto_pwhash_OPSLIMIT_MODERATE,
    s.crypto_pwhash_MEMLIMIT_MODERATE,
    s.crypto_pwhash_ALG_DEFAULT
  );
}

/**
 * Encrypt a UTF-8 string using secretbox.
 * Returns bytes in the layout: [salt(16) | nonce(24) | cipher(..)]
 */
export async function encryptTokenToBytes(plainText: string, appSecret?: string): Promise<Uint8Array> {
  const s = await getSodium();
  const secret = ensureAppSecret(appSecret);

  const salt = s.randombytes_buf(SALT_BYTES);
  const key = await deriveKey(secret, salt);
  const nonce = s.randombytes_buf(NONCE_BYTES);

  const cipher = s.crypto_secretbox_easy(s.from_string(plainText), nonce, key);

  const out = new Uint8Array(SALT_BYTES + NONCE_BYTES + cipher.length);
  out.set(salt, 0);
  out.set(nonce, SALT_BYTES);
  out.set(cipher, SALT_BYTES + NONCE_BYTES);
  return out;
}

/**
 * Decrypt bytes produced by encryptTokenToBytes().
 */
export async function decryptTokenFromBytes(data: Uint8Array, appSecret?: string): Promise<string> {
  const s = await getSodium();
  const secret = ensureAppSecret(appSecret);

  if (data.length < SALT_BYTES + NONCE_BYTES + s.crypto_secretbox_MACBYTES) {
    throw new Error("Ciphertext is too short");
  }

  const salt = data.slice(0, SALT_BYTES);
  const nonce = data.slice(SALT_BYTES, SALT_BYTES + NONCE_BYTES);
  const cipher = data.slice(SALT_BYTES + NONCE_BYTES);

  const key = await deriveKey(secret, salt);
  const msg = s.crypto_secretbox_open_easy(cipher, nonce, key);
  if (!msg) throw new Error("Decryption failed");

  return s.to_string(msg);
}

/**
 * Node Buffer convenience wrappers.
 */
export async function encryptTokenToBuffer(plainText: string, appSecret?: string): Promise<Buffer> {
  const bytes = await encryptTokenToBytes(plainText, appSecret);
  return Buffer.from(bytes);
}

export async function decryptTokenFromBuffer(buf: Buffer, appSecret?: string): Promise<string> {
  return decryptTokenFromBytes(new Uint8Array(buf), appSecret);
}

/**
 * Encoding helpers
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
  return new Uint8Array(Buffer.from(hex, "hex"));
}

export function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

export function base64ToBytes(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, "base64"));
}

/**
 * Convenience: encrypt/decrypt and return hex/base64 strings for storage.
 */
export async function encryptTokenToHex(plainText: string, appSecret?: string): Promise<string> {
  const bytes = await encryptTokenToBytes(plainText, appSecret);
  return bytesToHex(bytes);
}

export async function decryptTokenFromHex(hex: string, appSecret?: string): Promise<string> {
  const bytes = hexToBytes(hex);
  return decryptTokenFromBytes(bytes, appSecret);
}

export async function encryptTokenToBase64(plainText: string, appSecret?: string): Promise<string> {
  const bytes = await encryptTokenToBytes(plainText, appSecret);
  return bytesToBase64(bytes);
}

export async function decryptTokenFromBase64(b64: string, appSecret?: string): Promise<string> {
  const bytes = base64ToBytes(b64);
  return decryptTokenFromBytes(bytes, appSecret);
}

/**
 * Types
 */
export type TokenCipherBytes = Uint8Array;

// End of module