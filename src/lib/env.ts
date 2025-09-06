// Centralized environment invariant checks for server-side code.
// Use getEnv() to assert and access required env vars. This caches values after first call.

export type AppEnv = {
  appUrl?: string;
  xClientId: string;
  xRedirectUri: string;
  appSecret: string;
  sessionPassword: string;
  cronSecret?: string;
  xEnabled: boolean;
  xMediaUploadEnabled: boolean;
};

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) return cached;

  const appUrl = sanitize(process.env.APP_URL);
  const xClientId = requireEnv('X_CLIENT_ID');
  const xRedirectUri = requireEnv('X_REDIRECT_URI');
  const appSecret = requireEnv('APP_SECRET');
  const sessionPassword = requireEnv('SESSION_PASSWORD');
  const cronSecret = sanitize(process.env.CRON_SECRET);
  const xEnabled = (process.env.X_ENABLED || 'true').toLowerCase() !== 'false';
  const xMediaUploadEnabled = (process.env.X_MEDIA_UPLOAD_ENABLED || '').toLowerCase() === 'true';

  cached = {
    appUrl,
    xClientId,
    xRedirectUri,
    appSecret,
    sessionPassword,
    cronSecret,
    xEnabled,
    xMediaUploadEnabled,
  };
  return cached;
}

export function isFeatureEnabled(name: 'X_ENABLED'): boolean {
  if (name === 'X_ENABLED') return getEnv().xEnabled;
  return false;
}

function requireEnv(name: string): string {
  const v = typeof process !== 'undefined' ? process.env[name] : undefined;
  if (!v || String(v).trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(v);
}

function sanitize(v?: string): string | undefined {
  if (!v) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}