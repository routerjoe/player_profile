import { randomBytes } from 'crypto';

export const CSRF_COOKIE = 'pp_csrf';

export function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  const parts = header.split(';');
  for (const p of parts) {
    const i = p.indexOf('=');
    if (i === -1) continue;
    const k = decodeURIComponent(p.slice(0, i).trim());
    const v = decodeURIComponent(p.slice(i + 1).trim());
    if (!k) continue;
    out[k] = v;
  }
  return out;
}

export function makeCsrfToken(): string {
  // URL-safe string
  // Node 18+ supports 'base64url'. Fallback to hex if unavailable.
  try {
    // @ts-ignore
    return randomBytes(32).toString('base64url');
  } catch {
    return randomBytes(32).toString('hex');
  }
}

export function buildCsrfSetCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  // 90 days
  const maxAge = 60 * 60 * 24 * 90;
  return `${CSRF_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

/**
 * Extract csrf token from cookies on this request.
 */
export function getCsrfFromCookies(req: Request): string | null {
  const raw = req.headers.get('cookie') || '';
  const cookies = parseCookies(raw);
  return cookies[CSRF_COOKIE] || null;
}

/**
 * Require and validate CSRF header vs cookie (double-submit cookie).
 * Throws {status:403} on failure.
 */
export function requireCsrf(req: Request): void {
  const cookieToken = getCsrfFromCookies(req);
  const headerToken = (req.headers.get('x-csrf-token') || '').trim();
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    const err: any = new Error('Invalid CSRF token');
    err.status = 403;
    throw err;
  }
}