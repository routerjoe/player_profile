import { randomBytes } from 'crypto';
import { getSession as getAppSession } from '@/lib/session';
import { getSession } from '@/lib/auth/guards';
import { createPKCEPair, toBase64Url } from '@/lib/pkce';
import { buildAuthUrl } from '@/lib/x-oauth';

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

export async function GET(req: Request) {
  try {
    const s = getSession(req);
    if (!s.userId) return json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = process.env.X_CLIENT_ID;
    const redirectUri = process.env.X_REDIRECT_URI;
    if (!clientId || !redirectUri) {
      return json({ error: 'Server not configured for X OAuth' }, { status: 500 });
    }

    const { verifier, challenge } = createPKCEPair(64);
    const state = toBase64Url(randomBytes(16));

    const sess = await getAppSession();
    sess.userId = s.userId;
    sess.oauth = { state, verifier };
    await sess.save();

    const url = buildAuthUrl({
      clientId,
      redirectUri,
      state,
      codeChallenge: challenge,
    });

    return json({ url });
  } catch (err: any) {
    return json({ error: err?.message ?? 'Failed' }, { status: 500 });
  }
}