import prisma from "@/lib/prisma";
import { getSession as getAppSession } from "@/lib/session";
import { encryptTokenToBuffer } from "@/lib/crypto";
import { exchangeCodeForToken, getMe } from "@/lib/x-oauth";
import { logger } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (data: any, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });

function inferBaseUrl(req: Request): string {
  const fromEnv = process.env.APP_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  const proto = (req.headers.get("x-forwarded-proto") || "http").split(",")[0].trim();
  const host = (req.headers.get("host") || "localhost:3000").trim();
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return json({ error: `OAuth error: ${error}` }, { status: 400 });
    }
    if (!code || !state) {
      return json({ error: "Missing code or state" }, { status: 400 });
    }

    const sess = await getAppSession();
    if (!sess.oauth || !sess.oauth.verifier || !sess.oauth.state) {
      return json({ error: "Missing/expired OAuth session" }, { status: 400 });
    }
    if (state !== sess.oauth.state) {
      // Clear potentially stale oauth data
      delete sess.oauth;
      await sess.save();
      return json({ error: "State mismatch" }, { status: 400 });
    }
    const userId = sess.userId;
    if (!userId) {
      delete sess.oauth;
      await sess.save();
      return json({ error: "Missing user session" }, { status: 401 });
    }

    const clientId = process.env.X_CLIENT_ID!;
    const configuredRedirect = process.env.X_REDIRECT_URI!;
    // Use the same redirectUri we used when creating the auth URL (persisted in session)
    const redirectUri = (sess.oauth && (sess.oauth as any).redirectUri) || configuredRedirect;
    if (!clientId || !redirectUri) {
      return json({ error: "Server not configured for X OAuth" }, { status: 500 });
    }

    const token = await exchangeCodeForToken({
      clientId,
      clientSecret: process.env.X_CLIENT_SECRET || undefined,
      code,
      redirectUri,
      codeVerifier: sess.oauth.verifier,
    });

    // Optional: fetch user handle/id from X
    let handle: string | null = null;
    let xUserId: string | null = null;
    try {
      const me = await getMe(token.access_token);
      xUserId = me?.data?.id ?? null;
      const uname = me?.data?.username ?? null;
      handle = uname ? `@${uname}` : null;
    } catch {
      // Proceed without handle if not permitted by scopes
    }

    // Encrypt tokens at rest
    const accessTokenEnc = await encryptTokenToBuffer(token.access_token);
    const refreshTokenEnc = token.refresh_token
      ? await encryptTokenToBuffer(token.refresh_token)
      : null;

    const tokenExpiresAt =
      typeof token.expires_in === "number" ? new Date(Date.now() + token.expires_in * 1000) : null;

    // Upsert social account
    await prisma.socialAccount.upsert({
      where: {
        userId_provider: { userId, provider: "x" },
      },
      update: {
        handle: handle ?? undefined,
        xUserId: xUserId ?? undefined,
        accessTokenEnc,
        refreshTokenEnc: refreshTokenEnc ?? undefined,
        tokenExpiresAt: tokenExpiresAt ?? undefined,
        scope: token.scope ?? undefined,
      },
      create: {
        userId,
        provider: "x",
        handle,
        xUserId,
        accessTokenEnc,
        refreshTokenEnc: refreshTokenEnc ?? undefined,
        tokenExpiresAt: tokenExpiresAt ?? undefined,
        scope: token.scope ?? undefined,
      },
    });

    // Clear one-time oauth state/verifier
    delete sess.oauth;
    await sess.save();

    // Redirect back to dashboard settings
    logger.info('x.callback.connected', { userId, handle, scope: token.scope ?? undefined });
    const base = inferBaseUrl(req);
    return Response.redirect(`${base}/dashboard/settings?x_connected=1`, 303);
  } catch (err: any) {
    logger.error('x.callback.error', { message: err?.message || "Callback failed" });
    return json({ error: err?.message ?? "Callback failed" }, { status: 500 });
  }
}