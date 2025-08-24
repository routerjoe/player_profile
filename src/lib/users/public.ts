import type { ThemePrefs } from '@/lib/users/types';
import { readAllUsers } from '@/lib/users/db';

/**
 * Public helper: fetch theme preferences for a given player.
 * Returns undefined when not found.
 */
export async function getThemeForPlayer(playerId: string): Promise<ThemePrefs | undefined> {
  try {
    const users = await readAllUsers();
    const u = users.find((x) => x.playerId === playerId || x.id === playerId);
    return u?.theme;
  } catch {
    return undefined;
  }
}