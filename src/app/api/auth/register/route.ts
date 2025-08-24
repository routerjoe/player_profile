import { randomUUID } from 'crypto';
import { hashPassword } from '@/lib/users/crypto';
import { upsertUser, isEmailTaken, isUsernameTaken } from '@/lib/users/db';
import type { RegisterPayload, UserRecord } from '@/lib/users/types';
import { buildSessionCookie, sessionFromUser, signSession } from '@/lib/users/session';

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
    const body = (await req.json()) as RegisterPayload;
    const username = (body.username || '').trim();
    const email = (body.email || '').trim();
    const password = (body.password || '').trim();

    if (!username || !email || !password) {
      return json({ error: 'username, email, and password are required' }, { status: 400 });
    }
    if (await isUsernameTaken(username)) {
      return json({ error: 'Username already taken' }, { status: 409 });
    }
    if (await isEmailTaken(email)) {
      return json({ error: 'Email already taken' }, { status: 409 });
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);

    const user: UserRecord = {
      id,
      username,
      email,
      role: 'player',
      playerId: id,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    await upsertUser(user);

    const sess = sessionFromUser(user);
    const token = signSession(sess);
    const headers = new Headers();
    headers.append('set-cookie', buildSessionCookie(token));

    const { passwordHash: _, ...publicUser } = user;
    return json({ user: publicUser, session: sess }, { status: 201, headers });
  } catch (err: any) {
    return json({ error: err?.message ?? 'Registration failed' }, { status: 500 });
  }
}