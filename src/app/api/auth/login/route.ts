import { verifyPassword } from '@/lib/users/crypto';
import { findUserByUsernameOrEmail } from '@/lib/users/db';
import { buildSessionCookie, sessionFromUser, signSession } from '@/lib/users/session';
import type { LoginPayload } from '@/lib/users/types';

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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginPayload;
    const usernameOrEmail = (body.usernameOrEmail || '').trim();
    const password = (body.password || '').trim();

    if (!usernameOrEmail || !password) {
      return json({ error: 'usernameOrEmail and password are required' }, { status: 400 });
    }

    const user = await findUserByUsernameOrEmail(usernameOrEmail);
    if (!user) {
      return json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) {
      return json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const sess = sessionFromUser(user);
    const token = signSession(sess);
    const headers = new Headers();
    headers.append('set-cookie', buildSessionCookie(token));

    const { passwordHash: _, ...publicUser } = user;
    return json({ user: publicUser, session: sess }, { status: 200, headers });
  } catch (err: any) {
    return json({ error: err?.message ?? 'Login failed' }, { status: 500 });
  }
}