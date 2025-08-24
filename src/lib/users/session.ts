import { createHmac, timingSafeEqual } from 'crypto';
import type { AuthSession, UserRecord, UserRole } from '@/lib/users/types';

const COOKIE_NAME = 'pp_session';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  return process.env.AUTH_SECRET || 'dev-secret-change-me';
}

function base64url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function unbase64url(s: string): Buffer {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  return Buffer.from(s + '='.repeat(pad), 'base64');
}

/**
 * Sign a compact token: v1.base64url(JSON).base64url(hmac)
 */
export function signSession(session: Omit<AuthSession, 'iat' | 'exp'>, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthSession = { ...session, iat: now, exp: now + ttlSeconds };
  const data = Buffer.from(JSON.stringify(payload));
  const hmac = createHmac('sha256', getSecret()).update(data).digest();
  return `v1.${base64url(data)}.${base64url(hmac)}`;
}

export function verifySessionToken(token: string): AuthSession | null {
  try {
    const [v, payloadB64, macB64] = token.split('.');
    if (v !== 'v1' || !payloadB64 || !macB64) return null;
    const data = unbase64url(payloadB64);
    const mac = unbase64url(macB64);
    const calc = createHmac('sha256', getSecret()).update(data).digest();
    if (calc.length !== mac.length || !timingSafeEqual(calc, mac)) return null;
    const payload = JSON.parse(data.toString('utf8')) as AuthSession;
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Low-level cookie helpers
 */
export function buildSessionCookie(token: string, maxAgeSeconds = DEFAULT_TTL_SECONDS): string {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

export function buildClearSessionCookie(): string {
  const parts = [
    `${COOKIE_NAME}=;`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=0`,
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

export function readCookie(name: string, req: Request): string | null {
  const raw = req.headers.get('cookie') || '';
  const cookies = raw.split(/;\s*/).filter(Boolean);
  for (const c of cookies) {
    const i = c.indexOf('=');
    if (i <= 0) continue;
    const k = c.slice(0, i).trim();
    const v = c.slice(i + 1).trim();
    if (k === name) return v;
  }
  return null;
}

/**
 * Convenience for guards: extract session info from Request cookies.
 */
export function getSessionFromRequest(req: Request): AuthSession | null {
  const token = readCookie(COOKIE_NAME, req);
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Build a new session from a user record
 */
export function sessionFromUser(u: UserRecord): Omit<AuthSession, 'iat' | 'exp'> {
  return {
    sub: u.id,
    playerId: u.playerId,
    role: (u.role as UserRole) || 'player',
  };
}