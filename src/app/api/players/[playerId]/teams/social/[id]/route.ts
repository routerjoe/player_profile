import { assertCanManagePlayer } from '@/lib/auth/guards';
import { update } from '@/lib/teams/db';

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
 * DELETE /api/players/[playerId]/teams/social/[id]?team=school|travel
 * Remove a social link by id from the specified team.
 */
export async function DELETE(req: Request, ctx: { params: { playerId: string; id: string } }) {
  try {
    const playerId = ctx.params.playerId;
    const socialId = ctx.params.id;
    assertCanManagePlayer(req, playerId);

    const url = new URL(req.url);
    const team = (url.searchParams.get('team') || '').toLowerCase();
    if (!(team === 'school' || team === 'travel')) {
      return json({ error: 'Missing or invalid team. Use ?team=school|travel' }, { status: 400 });
    }

    const updated = await update(playerId, (cur) => {
      const t = cur[team] ?? { teamName: '', coachName: '', coachEmail: '', socials: [], isPublic: true };
      const socials = Array.isArray(t.socials) ? t.socials : [];
      const nextSocials = socials.filter((s) => s.id !== socialId);
      return {
        ...cur,
        [team]: {
          ...t,
          socials: nextSocials,
        },
      };
    });

    return json(updated);
  } catch (err: any) {
    const status = Number(err?.status) || 500;
    return json({ error: err?.message ?? 'Failed' }, { status });
  }
}