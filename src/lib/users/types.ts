// User model (local auth)

/**
 * Unique identity for an account. Use id as the canonical playerId.
 * A user can also have elevated roles (coach/admin).
 */
export type UserRole = 'player' | 'coach' | 'admin';

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  website?: string;
}

export interface ThemePrefs {
  heroFrame?: string;              // outline/frame color (hex or css color)
  heroFill?: string;               // hero card fill color
  heroOverlayOpacity?: number;     // 0..1 overlay strength
  heroOverlayEnabled?: boolean;    // enable/disable overlay
  heroFrom?: string;               // optional gradient start (future)
  heroTo?: string;                 // optional gradient end (future)
}

export interface UserRecord {
  id: string;                 // crypto.randomUUID()
  username: string;           // unique (case-insensitive)
  email: string;              // unique (case-insensitive)
  role: UserRole;             // default: 'player'
  playerId: string;           // equals id for players
  passwordHash: string;       // scrypt: "scrypt$N$r$p$base64(salt)$base64(hash)"
  socials?: SocialLinks;
  theme?: ThemePrefs;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<UserRecord, 'passwordHash'>;

export interface AuthSession {
  sub: string;        // userId
  playerId: string;   // same as user.playerId
  role: UserRole;
  iat: number;        // issued at (unix seconds)
  exp: number;        // expires at (unix seconds)
}

// API payloads
export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  usernameOrEmail: string;
  password: string;
}

export interface UpdateMePayload {
  username?: string;
  email?: string;
  socials?: SocialLinks;
  theme?: ThemePrefs;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}