import { verifyPassword, hashPassword } from '@/lib/users/crypto';
import { findUserById, upsertUser } from '@/lib/users/db';
import { getSessionFromRequest, sessionFromUser, signSession, buildSessionCookie } from '@/lib/users/session';
import type { ChangePasswordPayload } from '@/lib/users/types';

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
    const sess = getSessionFromRequest(req);
    if (!sess) return json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json()) as ChangePasswordPayload;
    const currentPassword = (body.currentPassword || '').trim();
    const newPassword = (body.newPassword || '').trim();

    if (!currentPassword || !newPassword) {
      return json({ error: 'currentPassword and newPassword are required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    const user = await findUserById(sess.sub);
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

    const ok = await verifyPassword(user.passwordHash, currentPassword);
    if (!ok) return json({ error: 'Current password is incorrect' }, { status: 400 });

    const passwordHash = await hashPassword(newPassword);
    const updated = { ...user, passwordHash, updatedAt: new Date().toISOString() };
    await upsertUser(updated);

    // refresh session cookie
    const token = signSession(sessionFromUser(updated));
    const headers = new Headers();
    headers.append('set-cookie', buildSessionCookie(token));

    return json({ ok: true }, { headers });
  } catch (err: any) {
    return json({ error: err?.message ?? 'Password change failed' }, { status: 500 });
  }
}