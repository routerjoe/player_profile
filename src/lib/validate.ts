import { z } from 'zod';

/**
 * Validate RFC-compliant email using zod's .email()
 */
export function isEmail(str: string | undefined | null): boolean {
  if (!str) return false;
  const s = String(str).trim();
  return z.string().email().safeParse(s).success;
}

/**
 * Validate absolute HTTP/HTTPS URL.
 * - Must parse with URL()
 * - Must be http or https
 * - Must have hostname
 */
export function isHttpUrl(str: string | undefined | null): boolean {
  if (!str) return false;
  try {
    const url = new URL(String(str).trim());
    if (!url.hostname) return false;
    const p = url.protocol.toLowerCase();
    return p === 'http:' || p === 'https:';
  } catch {
    return false;
  }
}