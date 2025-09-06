import { URLSearchParams } from "url";

/**
 * X (Twitter) OAuth 2.0 PKCE + simple API helpers.
 * Notes:
 * - Authorization URL: https://twitter.com/i/oauth2/authorize
 * - Token URL: https://api.twitter.com/2/oauth2/token
 * - Users: https://api.twitter.com/2/users/me
 * - Tweets: https://api.twitter.com/2/tweets
 * - Media (historical v1.1 endpoint): https://upload.twitter.com/1.1/media/upload.json
 *
 * This module implements:
 * - buildAuthUrl(): construct the user authorization URL with PKCE
 * - exchangeCodeForToken(): code -> token
 * - refreshAccessToken(): refresh -> new access token
 * - getMe(): fetch authenticated user info
 * - postTweet(): post a tweet (text + optional media ids)
 * - fetchWithRetry(): 429/5xx exponential backoff (2 attempts)
 *
 * Media upload is provided as a placeholder. Depending on current X support,
 * OAuth 2.0 + v1.1 upload may have limitations. You may need to adjust to
 * X's latest media upload API if/when fully available via OAuth 2.0 client.
 */

export const X_AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize";
export const X_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
export const X_USERS_ME_URL = "https://api.twitter.com/2/users/me";
export const X_TWEETS_URL = "https://api.twitter.com/2/tweets";
// Historical upload endpoint (v1.1). Validate against current X requirements:
export const X_MEDIA_UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";

// Default scopes per spec
export const X_REQUIRED_SCOPES = "tweet.read users.read tweet.write offline.access media.write";

export interface BuildAuthUrlParams {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  scope?: string;
}

export interface TokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  scope?: string;
  refresh_token?: string;
}

export interface RefreshResponse extends TokenResponse {}

export interface MeResponse {
  data: {
    id: string;
    name: string;
    username: string;
  };
}

export interface PostTweetParams {
  text: string;
  mediaIds?: string[]; // when provided, server must upload beforehand to obtain media_ids
}

export interface PostTweetResponse {
  data: {
    id: string;
    text: string;
  };
}

/**
 * Build the user authorization URL for OAuth 2.0 PKCE.
 */
export function buildAuthUrl(params: BuildAuthUrlParams): string {
  const { clientId, redirectUri, state, codeChallenge, scope } = params;
  const q = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: (scope || X_REQUIRED_SCOPES).split(/\s+/).join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${X_AUTHORIZE_URL}?${q.toString()}`;
}

/**
 * Exchange authorization code + verifier for tokens.
 */
export async function exchangeCodeForToken(args: {
  clientId: string;
  clientSecret?: string; // optional, for confidential apps; PKCE public clients might omit
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<TokenResponse> {
  const { clientId, clientSecret, code, redirectUri, codeVerifier } = args;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
    code_verifier: codeVerifier,
  });

  // Some implementations also accept client_secret (if confidential client)
  if (clientSecret) body.set("client_secret", clientSecret);

  const res = await fetchWithRetry(X_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const t = await safeText(res);
    throw new Error(`Token exchange failed (${res.status}): ${t}`);
  }
  return (await res.json()) as TokenResponse;
}

/**
 * Refresh access token using refresh_token.
 */
export async function refreshAccessToken(args: {
  clientId: string;
  clientSecret?: string;
  refreshToken: string;
}): Promise<RefreshResponse> {
  const { clientId, clientSecret, refreshToken } = args;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });
  if (clientSecret) body.set("client_secret", clientSecret);

  const res = await fetchWithRetry(X_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const t = await safeText(res);
    throw new Error(`Token refresh failed (${res.status}): ${t}`);
  }
  return (await res.json()) as RefreshResponse;
}

/**
 * Get the authenticated user's info.
 */
export async function getMe(accessToken: string): Promise<MeResponse> {
  const res = await fetchWithRetry(X_USERS_ME_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const t = await safeText(res);
    throw new Error(`getMe failed (${res.status}): ${t}`);
  }
  return (await res.json()) as MeResponse;
}

/**
 * Post a tweet. Provide text and optionally previously uploaded media IDs.
 */
export async function postTweet(accessToken: string, params: PostTweetParams): Promise<PostTweetResponse> {
  const payload: any = { text: params.text };
  if (params.mediaIds && params.mediaIds.length > 0) {
    payload.media = { media_ids: params.mediaIds };
  }

  const res = await fetchWithRetry(X_TWEETS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await safeText(res);
    throw new Error(`postTweet failed (${res.status}): ${t}`);
  }
  return (await res.json()) as PostTweetResponse;
}

/**
 * Placeholder media upload via historical v1.1 endpoint.
 * Depending on X's current API rules, OAuth 2.0 bearer tokens may not be sufficient.
 * If unsupported, consider alternate documented flow or backend proxy/upload approach.
 */
/**
 * Attempt single-shot media upload for small images using v1.1 media/upload with base64 media_data.
 * Notes:
 * - Historically, X v1.1 media/upload required OAuth 1.0a user context. Some environments may NOT accept OAuth 2.0 Bearer tokens.
 * - Gate via env X_MEDIA_UPLOAD_ENABLED=true. If disabled or rejected by X, this will throw.
 * - For larger files or videos, use INIT/APPEND/FINALIZE chunked upload; this helper only supports small images.
 */
export async function uploadMedia(
  accessToken: string,
  file: Blob | Buffer,
  opts: { mimeType?: string; category?: 'tweet_image' | 'tweet_gif' | 'tweet_video' } = {},
): Promise<{ media_id_string: string }> {
  const enabled = String(process.env.X_MEDIA_UPLOAD_ENABLED || '').toLowerCase();
  if (enabled !== 'true') {
    throw new Error('X media upload disabled. Set X_MEDIA_UPLOAD_ENABLED=true to enable.');
  }

  // Convert to Buffer and base64 encode
  let buf: Buffer;
  if (typeof Buffer !== 'undefined' && (file as any) instanceof Buffer) {
    buf = file as Buffer;
  } else if (file instanceof Blob) {
    buf = Buffer.from(await file.arrayBuffer());
  } else {
    // Fallback attempt (may throw if file is not coercible)
    buf = Buffer.from(file as any);
  }
  const b64 = buf.toString('base64');

  const params = new URLSearchParams();
  params.set('media_data', b64);
  if (opts.category) params.set('media_category', opts.category);

  const res = await fetchWithRetry(X_MEDIA_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!res.ok) {
    const body = await safeText(res);
    throw new Error(`uploadMedia failed (${res.status}): ${body}`);
  }
  const j: any = await res.json().catch(() => ({}));
  const id = j?.media_id_string || j?.media_id;
  if (!id) throw new Error('uploadMedia: missing media_id_string in response');
  return { media_id_string: String(id) };
}

/**
 * Minimal fetch with 2-attempt retry on 429/5xx. Exponential backoff.
 */
export async function fetchWithRetry(input: RequestInfo | URL, init: RequestInit = {}, maxAttempts = 2): Promise<Response> {
  let attempt = 0;
  let lastError: any;
  let res: Response | null = null;

  while (attempt < maxAttempts) {
    try {
      res = await fetch(input, init);
      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        const retryAfter = getRetryAfterMs(res) ?? backoffMs(attempt);
        await delay(retryAfter);
        attempt++;
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      const wait = backoffMs(attempt);
      await delay(wait);
      attempt++;
    }
  }

  if (res) return res;
  throw lastError || new Error("fetchWithRetry failed without a response");
}

/**
 * Helpers
 */
function getRetryAfterMs(res: Response): number | null {
  const ra = res.headers.get("retry-after");
  if (!ra) return null;
  const n = Number(ra);
  if (!Number.isNaN(n)) return n * 1000;
  // HTTP-date not parsed here; fall back to fixed backoff if non-numeric
  return null;
}

function backoffMs(attempt: number): number {
  const base = 500; // ms
  return base * Math.pow(2, attempt); // 500, 1000
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}