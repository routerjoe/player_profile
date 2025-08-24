/**
 * Auth guards for API routes.
 * Prefers cookie session (signed token) and falls back to dev headers:
 *   x-user-id, x-user-role
 */
import { getSessionFromRequest } from '@/lib/users/session';

export type Role = 'player' | 'coach' | 'admin' | 'unknown';

export interface Session {
  userId: string | null;
  role: Role;
}

/**
 * Extract the session from Request cookies (preferred) with dev header fallback.
 */
export function getSession(req: Request): Session {
  // 1) Cookie-based session (preferred)
  const cookieSess = getSessionFromRequest(req);
  if (cookieSess) {
    return { userId: cookieSess.sub, role: (cookieSess.role as Role) ?? 'player' };
  }

  // 2) Dev fallback via headers
  const userId = req.headers.get('x-user-id');
  const roleRaw = (req.headers.get('x-user-role') || '').toLowerCase();
  let role: Role = 'unknown';
  if (roleRaw === 'coach' || roleRaw === 'admin' || roleRaw === 'player') {
    role = roleRaw as Role;
  } else if (userId) {
    role = 'player';
  }
  return { userId: userId || null, role };
}

/**
 * Convenience to get just the userId (null if unauthenticated).
 */
export function getSessionUserId(req: Request): string | null {
  return getSession(req).userId;
}

/**
 * Assert the current request user can manage the specified playerId.
 * Allows if:
 *   - Same user: session.userId === playerId
 *   - Elevated role: role in ['coach','admin']
 *
 * Throws an error object with .status = 401/403 on failure.
 */
export function assertCanManagePlayer(req: Request, playerId: string): void {
  const { userId, role } = getSession(req);
  if (!userId) {
    const err: any = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  if (userId !== playerId && role !== 'coach' && role !== 'admin') {
    const err: any = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
}