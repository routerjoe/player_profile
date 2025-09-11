import { randomBytes } from 'crypto';
import { getSession as getAppSession } from '@/lib/session';
import { getSession } from '@/lib/auth/guards';
import { createPKCEPair, toBase64Url } from '@/lib/pkce';
import { buildAuthUrl } from '@/lib/x-oauth';
import { logger } from '@/lib/observability/logger';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (data: any, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });

function inferBaseUrl(req: Request): string {
  const fromEnv = process.env.APP_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const proto = (req.headers.get('x-forwarded-proto') || 'http').split(',')[0].trim();
  const host = (req.headers.get('host') || 'localhost:3000').trim();
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  try {
    const s = getSession(req);
    if (!s.userId) return json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = process.env.X_CLIENT_ID || '';
    const configuredRedirect = process.env.X_REDIRECT_URI || '';

    // Allow using the current origin's callback to keep cookies on the same port in dev
    const reqUrl = new URL(req.url);
    const useOrigin = /^(1|true|origin)$/i.test((reqUrl.searchParams.get('use_origin') || '').toString());
    const redirectUri = useOrigin ? `${inferBaseUrl(req)}/api/x/callback` : configuredRedirect;

    if (!clientId || !redirectUri) {
      return json({ error: 'Server not configured for X OAuth' }, { status: 500 });
    }

    const { verifier, challenge } = createPKCEPair(64);
    const state = toBase64Url(randomBytes(16));

    const sess = await getAppSession();
    sess.userId = s.userId;
    // Persist redirectUri to ensure token exchange uses the exact same value
    sess.oauth = { state, verifier, redirectUri };
    await sess.save();

    const url = buildAuthUrl({
      clientId,
      redirectUri,
      state,
      codeChallenge: challenge,
    });

    logger.info('x.auth_url.issued', { userId: s.userId });

    // Optional: redirect flow for opening in a new tab/window directly
    // Usage: GET /api/x/auth-url?redirect=1  or  ?format=redirect
    const reqUrl2 = new URL(req.url);
    const redirect = reqUrl2.searchParams.get('redirect') || reqUrl2.searchParams.get('format');
    if (redirect && /^(1|true|redirect)$/i.test(redirect)) {
      return Response.redirect(url, 303);
    }

    return json({ url });
  } catch (err: any) {
    logger.error('x.auth_url.error', { message: err?.message || 'Failed' });
    return json({ error: err?.message ?? 'Failed' }, { status: 500 });
  }
}