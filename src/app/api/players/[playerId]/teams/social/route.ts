import { assertCanManagePlayer } from '@/lib/auth/guards';
import { update } from '@/lib/teams/db';
import { MAX_SOCIALS_PER_TEAM, SOCIAL_PLATFORMS, type SocialPlatform } from '@/lib/teams/types';
import { isHttpUrl } from '@/lib/validate';
import { randomUUID } from 'crypto';

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
 * POST /api/players/[playerId]/teams/social
 * Body: { team: 'school'|'travel', platform: SocialPlatform, url: string, handle?: string }
 * - Validate platform and url
 * - Enforce MAX_SOCIALS_PER_TEAM
 * - Append a SocialLink with id = uuid
 */
export async function POST(req: Request, ctx: { params: { playerId: string } }) {
  try {
    const playerId = ctx.params.playerId;
    assertCanManagePlayer(req, playerId);

    const body = await req.json().catch(() => ({}));
    const teamRaw = (body?.team ?? '').toString().toLowerCase();
    const platform = (body?.platform ?? '').toString().toLowerCase() as SocialPlatform;
    const url = (body?.url ?? '').toString().trim();
    const handleRaw = typeof body?.handle === 'string' ? body.handle.trim() : '';

    if (!(teamRaw === 'school' || teamRaw === 'travel')) {
      return json({ error: 'Invalid team; expected "school" or "travel"' }, { status: 400 });
    }
    const team = teamRaw as 'school' | 'travel';
    if (!SOCIAL_PLATFORMS.includes(platform)) {
      return json({ error: 'Invalid platform' }, { status: 400 });
    }
    if (!isHttpUrl(url)) {
      return json({ error: 'Invalid URL' }, { status: 400 });
    }

    const updated = await update(playerId, (cur) => {
      const currentTeam = cur[team] ?? { teamName: '', coachName: '', coachEmail: '', socials: [], isPublic: true };
      const socials = Array.isArray(currentTeam.socials) ? currentTeam.socials : [];
      if (socials.length >= MAX_SOCIALS_PER_TEAM) {
        const err: any = new Error(`Max ${MAX_SOCIALS_PER_TEAM} social links per team`);
        err.status = 400;
        throw err;
      }
      const nextSocials = [
        ...socials,
        {
          id: randomUUID(),
          platform,
          url,
          handle: handleRaw || undefined,
        },
      ];
      return {
        ...cur,
        [team]: {
          ...currentTeam,
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