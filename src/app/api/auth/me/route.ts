import { upsertUser, isEmailTaken, isUsernameTaken, findUserById } from '@/lib/users/db';
import type { UpdateMePayload } from '@/lib/users/types';
import { sessionFromUser, signSession, buildSessionCookie } from '@/lib/users/session';
import { getSession } from '@/lib/auth/guards';

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

/**
 * GET /api/auth/me — returns the current user (sans passwordHash)
 * Uses cookie session (with dev header fallback handled in guards).
 */
export async function GET(req: Request) {
  try {
    const s = getSession(req);
    if (!s.userId) return json({ error: 'Unauthorized' }, { status: 401 });

    const u = await findUserById(s.userId);
    if (!u) return json({ error: 'Unauthorized' }, { status: 401 });

    const { passwordHash: _ph, ...publicUser } = u;
    return json({ user: publicUser });
  } catch (err: any) {
    return json({ error: err?.message ?? 'Failed' }, { status: 500 });
  }
}

/**
 * PATCH /api/auth/me — update username/email/socials
 */
export async function PATCH(req: Request) {
  try {
    const s = getSession(req);
    if (!s.userId) return json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json()) as UpdateMePayload;
    const user = await findUserById(s.userId);
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

    const patch: any = {};
    if (typeof body.username === 'string' && body.username.trim()) {
      const name = body.username.trim();
      if (await isUsernameTaken(name, user.id)) {
        return json({ error: 'Username already taken' }, { status: 409 });
      }
      patch.username = name;
    }
    if (typeof body.email === 'string' && body.email.trim()) {
      const email = body.email.trim();
      if (await isEmailTaken(email, user.id)) {
        return json({ error: 'Email already taken' }, { status: 409 });
      }
      patch.email = email;
    }
    if (typeof body.socials === 'object' && body.socials) {
      patch.socials = { ...(user.socials ?? {}), ...body.socials };
    }
    if (typeof body.theme === 'object' && body.theme) {
      patch.theme = { ...(user.theme ?? {}), ...body.theme };
    }

    const updated = { ...user, ...patch, updatedAt: new Date().toISOString() };
    await upsertUser(updated);

    // Issue fresh session cookie (in case role/playerId/etc ever change)
    const token = signSession(sessionFromUser(updated));
    const headers = new Headers();
    headers.append('set-cookie', buildSessionCookie(token));

    const { passwordHash: _ph, ...publicUser } = updated;
    return json({ user: publicUser }, { headers });
  } catch (err: any) {
    return json({ error: err?.message ?? 'Update failed' }, { status: 500 });
  }
}