import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(_scrypt);

export interface ScryptParams {
  N: number;
  r: number;
  p: number;
  keylen: number;
}

const DEFAULT_SCRYPT: ScryptParams = {
  N: 16384,
  r: 8,
  p: 1,
  keylen: 64,
};

/**
 * Hash a password using Node's scrypt.
 * Output format:
 *   scrypt$N$r$p$base64(salt)$base64(hash)
 */
export async function hashPassword(
  password: string,
  params: ScryptParams = DEFAULT_SCRYPT,
): Promise<string> {
  const salt = randomBytes(16);
  const { N, r, p, keylen } = params;
  const buf = (await scryptAsync(password, salt, keylen, { N, r, p })) as Buffer;
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${buf.toString('base64')}`;
}

/**
 * Verify a password against a stored scrypt hash.
 */
export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  try {
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
    const N = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    const salt = Buffer.from(parts[4], 'base64');
    const hash = Buffer.from(parts[5], 'base64');
    const keylen = hash.length;
    const calc = (await scryptAsync(password, salt, keylen, { N, r, p })) as Buffer;
    // Constant-time compare
    return timingSafeEqual(calc, hash);
  } catch {
    return false;
  }
}