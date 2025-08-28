import { promises as fs } from 'fs';
import path from 'path';
import { DATA_DIR } from '@/lib/users/db';
import type { PlayerTeams } from '@/lib/teams/types';
import { zeroTeams } from '@/lib/teams/types';

export const PLAYER_TEAMS_JSON_PATH = path.join(DATA_DIR, 'player_teams.json');

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function ensureTeamsFile(): Promise<void> {
  await ensureDataDir();
  try {
    await fs.access(PLAYER_TEAMS_JSON_PATH);
  } catch {
    await fs.writeFile(PLAYER_TEAMS_JSON_PATH, '{}\n', 'utf8');
  }
}

/**
 * Safe read for the teams store.
 * If the file is missing or corrupted, recreate with {} and return {}.
 */
export async function readAll(): Promise<Record<string, PlayerTeams>> {
  await ensureTeamsFile();
  try {
    const raw = await fs.readFile(PLAYER_TEAMS_JSON_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, PlayerTeams>;
    }
    return {};
  } catch {
    // Backup corrupted file if possible, then reset.
    try {
      const badName = `player_teams-${Date.now()}.bad.json`;
      await fs.rename(PLAYER_TEAMS_JSON_PATH, path.join(DATA_DIR, badName));
    } catch {
      // ignore backup errors
    }
    await fs.writeFile(PLAYER_TEAMS_JSON_PATH, '{}\n', 'utf8');
    return {};
  }
}

/**
 * Atomic write: write to a temp file then rename to target.
 */
export async function writeAll(map: Record<string, PlayerTeams>): Promise<void> {
  await ensureDataDir();
  const tmp = `${PLAYER_TEAMS_JSON_PATH}.tmp`;
  const payload = JSON.stringify(map, null, 2) + '\n';
  await fs.writeFile(tmp, payload, 'utf8');
  await fs.rename(tmp, PLAYER_TEAMS_JSON_PATH);
}

/**
 * Get existing or return a zero-state object (does not write).
 */
export async function getOrInit(playerId: string): Promise<PlayerTeams> {
  const all = await readAll();
  return all[playerId] ?? zeroTeams(playerId);
}

/**
 * Update helper with read-modify-write, returning the updated record.
 */
export async function update(
  playerId: string,
  updater: (cur: PlayerTeams) => PlayerTeams,
): Promise<PlayerTeams> {
  const all = await readAll();
  const cur = all[playerId] ?? zeroTeams(playerId);
  const next = updater(cur);
  const now = new Date().toISOString();
  const row: PlayerTeams = {
    ...next,
    playerId,
    updatedAt: now,
    // Ensure the two team objects at least exist
    school: {
      teamName: next.school?.teamName ?? '',
      coachName: next.school?.coachName ?? '',
      coachEmail: next.school?.coachEmail ?? '',
      socials: Array.isArray(next.school?.socials) ? next.school!.socials : [],
      isPublic: next.school?.isPublic !== false,
    },
    travel: {
      teamName: next.travel?.teamName ?? '',
      coachName: next.travel?.coachName ?? '',
      coachEmail: next.travel?.coachEmail ?? '',
      socials: Array.isArray(next.travel?.socials) ? next.travel!.socials : [],
      isPublic: next.travel?.isPublic !== false,
    },
  };
  all[playerId] = row;
  await writeAll(all);
  return row;
}