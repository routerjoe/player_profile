import { promises as fs } from 'fs';
import { getSession } from '@/lib/auth/guards';
import { findUserById, deleteUserById } from '@/lib/users/db';
import { readAllProfiles, writeAllProfiles } from '@/lib/profiles/db';
import { readAll as readPhotos, writeAll as writePhotos } from '@/lib/photos/db';
import { readAll as readTeams, writeAll as writeTeams } from '@/lib/teams/db';
import { uploadsDirForPlayer, absolutePathForUrl, deleteFileIfExists } from '@/lib/photos/fs';

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
 * POST /api/profile/delete
 * Body: { confirm: "delete my profile", deleteUserAccount?: boolean }
 *
 * Deletes ALL data for the current player:
 *  - /public/uploads/{playerId} directory (files)
 *  - data/photos.json records for the player
 *  - data/profiles.json entry for the player
 *  - data/player_teams.json entry for the player
 * Optionally deletes the user account when deleteUserAccount === true.
 */
export async function POST(req: Request) {
  try {
    const sess = getSession(req);
    if (!sess.userId) return json({ error: 'Unauthorized' }, { status: 401 });

    const user = await findUserById(sess.userId);
    const playerId = user?.playerId || sess.userId;
    if (!playerId) return json({ error: 'Unauthorized' }, { status: 401 });

    const ctype = req.headers.get('content-type') || '';
    if (!ctype.includes('application/json')) {
      return json({ error: 'Expected application/json' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as any));
    const confirm = String(body?.confirm || '').trim().toLowerCase();
    const shouldDeleteUser = Boolean(body?.deleteUserAccount);

    if (confirm !== 'delete my profile') {
      return json({ error: 'Confirmation phrase mismatch. Type: delete my profile' }, { status: 400 });
    }

    // 1) Remove uploads directory for this player (ignore errors)
    const uploadsDir = uploadsDirForPlayer(playerId);
    await fs.rm(uploadsDir, { recursive: true, force: true });

    // 2) Photos metadata + best-effort cleanup of any remaining files
    const allPhotos = await readPhotos();
    const removedPhotos = allPhotos.filter((p) => p.playerId === playerId);
    for (const p of removedPhotos) {
      try {
        const abs = absolutePathForUrl(p.url);
        await deleteFileIfExists(abs);
      } catch {
        // ignore
      }
    }
    const keptPhotos = allPhotos.filter((p) => p.playerId !== playerId);
    await writePhotos(keptPhotos);

    // 3) Profiles store
    const allProfiles = await readAllProfiles();
    const hadProfile = allProfiles.some((r) => r.playerId === playerId);
    const keptProfiles = allProfiles.filter((r) => r.playerId !== playerId);
    await writeAllProfiles(keptProfiles);

    // 4) Teams store
    const allTeams = await readTeams();
    const hadTeams = !!allTeams[playerId];
    if (hadTeams) {
      delete allTeams[playerId];
      await writeTeams(allTeams);
    }

    // 5) Optionally delete the user account
    let userDeleted = false;
    if (shouldDeleteUser) {
      await deleteUserById(sess.userId);
      userDeleted = true;
    }

    return json({
      ok: true,
      playerId,
      removed: {
        uploadsDir: true,
        photoRecords: removedPhotos.length,
        profile: hadProfile ? 1 : 0,
        teams: hadTeams ? 1 : 0,
      },
      userDeleted,
      message: 'All player data removed. If account deletion was selected, you will be signed out.',
    });
  } catch (e: any) {
    return json({ error: e?.message ?? 'Delete failed' }, { status: 500 });
  }
}
       