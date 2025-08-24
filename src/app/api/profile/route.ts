/**
 * Publish and fetch the player's public profile.
 * - PUT: Validate and persist the latest profile for the signed-in player
 * - GET:  Return the published profile for the signed-in player
 *
 * Storage: data/profiles.json via lib/profiles/db.ts
 */
import { getSession } from '@/lib/auth/guards';
import { findUserById } from '@/lib/users/db';
import { ProfileSchema } from '@/lib/validation/schemas';
import { getProfileForPlayer, upsertProfile } from '@/lib/profiles/db';

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

    const user = await findUserById(s.userId);
    if (!user?.playerId) return json({ error: 'Unauthorized' }, { status: 401 });

    const row = await getProfileForPlayer(user.playerId);
    return json({ profile: row?.profile || null, playerId: user.playerId });
  } catch (e: any) {
    return json({ error: e?.message ?? 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const s = getSession(req);
    if (!s.userId) return json({ error: 'Unauthorized' }, { status: 401 });

    const user = await findUserById(s.userId);
    if (!user?.playerId) return json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues?.map((i) => ({ path: i.path.join('.'), message: i.message })) ?? [];
      return json({ error: 'Invalid profile', issues }, { status: 400 });
    }

    const saved = await upsertProfile(user.playerId, parsed.data);
    return json({ ok: true, profile: saved.profile, playerId: saved.playerId, updatedAt: saved.updatedAt });
  } catch (e: any) {
    return json({ error: e?.message ?? 'Publish failed' }, { status: 500 });
  }
}