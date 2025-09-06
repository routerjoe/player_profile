export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { buildCsrfSetCookie, makeCsrfToken } from '@/lib/security/csrf';

const json = (data: any, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });

/**
 * GET /api/csrf
 * Issues a CSRF token and sets a cookie for double-submit protection.
 * Client should include the returned token in the x-csrf-token header for subsequent POSTs.
 */
export async function GET(_req: Request) {
  try {
    const token = makeCsrfToken();
    const setCookie = buildCsrfSetCookie(token);
    return json({ token }, { status: 200, headers: { 'set-cookie': setCookie } });
  } catch (err: any) {
    return json({ error: err?.message ?? 'Failed to issue CSRF token' }, { status: 500 });
  }
}