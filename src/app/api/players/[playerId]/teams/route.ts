import { assertCanManagePlayer } from '@/lib/auth/guards';
import { getOrInit, update } from '@/lib/teams/db';
import type { PlayerTeams, TeamInfo } from '@/lib/teams/types';
import { isEmail } from '@/lib/validate';

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

// Zero-state (server authority)
function zeroTeam(): TeamInfo {
  return {
    teamName: '',
    coachName: '',
    coachEmail: '',
    socials: [],
    isPublic: true,
  };
}

function validateCoachEmailOrThrow(email: unknown, path: string) {
  if (typeof email === 'undefined') return;
  if (email === null) return;
  const s = String(email);
  if (s.trim() === '') return; // allow clearing
  if (!isEmail(s)) {
    const err: any = new Error(`Invalid email for ${path}`);
    err.status = 400;
    throw err;
  }
}

function sanitizeTeamPatch(patch: any, current: TeamInfo): TeamInfo {
  const next: TeamInfo = {
    teamName: typeof patch?.teamName === 'string' ? patch.teamName : current.teamName,
    coachName: typeof patch?.coachName === 'string' ? patch.coachName : current.coachName,
    coachEmail:
      typeof patch?.coachEmail === 'string' ? patch.coachEmail : current.coachEmail,
    // IMPORTANT: PUT endpoint does not manage socials; use POST/DELETE endpoints.
    // If a client sends socials here, ignore to keep the contract consistent.
    socials: Array.isArray(current.socials) ? current.socials : [],
    isPublic:
      typeof patch?.isPublic === 'boolean' ? patch.isPublic : (current.isPublic !== false),
  };

  // Validate coachEmail when provided
  if (typeof patch?.coachEmail !== 'undefined') {
    validateCoachEmailOrThrow(patch.coachEmail, 'coachEmail');
  }

  return next;
}

export async function GET(req: Request, ctx: { params: { playerId: string } }) {
  try {
    const playerId = ctx.params.playerId;
    assertCanManagePlayer(req, playerId);

    const teams = await getOrInit(playerId);
    // Ensure shape (defensive)
    const out: PlayerTeams = {
      playerId,
      school: teams?.school ?? zeroTeam(),
      travel: teams?.travel ?? zeroTeam(),
      updatedAt: teams?.updatedAt ?? new Date().toISOString(),
    };
    return json(out);
  } catch (err: any) {
    const status = Number(err?.status) || 500;
    return json({ error: err?.message ?? 'Failed' }, { status });
  }
}

/**
 * PUT /api/players/[playerId]/teams
 * Body: { school?: Partial<TeamInfo>; travel?: Partial<TeamInfo> }
 * - Merge partials into stored object (socials are managed via POST/DELETE endpoints)
 * - Validate coachEmail if provided
 */
export async function PUT(req: Request, ctx: { params: { playerId: string } }) {
  try {
    const playerId = ctx.params.playerId;
    assertCanManagePlayer(req, playerId);

    const body = await req.json().catch(() => ({}));
    const patchSchool = body?.school;
    const patchTravel = body?.travel;

    // Pre-validate known fields
    if (patchSchool && typeof patchSchool === 'object') {
      validateCoachEmailOrThrow(patchSchool.coachEmail, 'school.coachEmail');
      // Ignore socials in PUT to keep contract consistent; use POST/DELETE routes
    }
    if (patchTravel && typeof patchTravel === 'object') {
      validateCoachEmailOrThrow(patchTravel.coachEmail, 'travel.coachEmail');
    }

    const updated = await update(playerId, (cur) => {
      const baseSchool = cur?.school ?? zeroTeam();
      const baseTravel = cur?.travel ?? zeroTeam();
      return {
        ...cur,
        playerId,
        school:
          patchSchool && typeof patchSchool === 'object'
            ? sanitizeTeamPatch(patchSchool, baseSchool)
            : baseSchool,
        travel:
          patchTravel && typeof patchTravel === 'object'
            ? sanitizeTeamPatch(patchTravel, baseTravel)
            : baseTravel,
      };
    });

    return json(updated);
  } catch (err: any) {
    const status = Number(err?.status) || 500;
    return json({ error: err?.message ?? 'Update failed' }, { status });
  }
}