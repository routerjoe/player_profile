import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/guards";
import { decryptTokenFromBuffer, encryptTokenToBuffer } from "@/lib/crypto";
import { postTweet, refreshAccessToken, uploadMedia } from "@/lib/x-oauth";
import { XPostBodySchema } from "@/lib/validation/x";
import { requireCsrf } from "@/lib/security/csrf";
import { getEnv } from "@/lib/env";

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

type PostBody = {
  text?: string;
  // When sent as multipart/form-data, include a single image file under field name "file".
};

/**
 * Helper: ensure we have a valid (non-expired) access token.
 * - If tokenExpiresAt is in the past (with 30s leeway) and a refresh token exists, refresh it.
 * - Persist refreshed tokens (encrypted) + new expiry.
 */
async function ensureValidAccessToken(account: {
  userId: string;
  provider: string;
  accessTokenEnc: Buffer;
  refreshTokenEnc: Buffer | null;
  tokenExpiresAt: Date | null;
  scope: string | null;
}): Promise<string> {
  const clientId = process.env.X_CLIENT_ID!;
  // Public PKCE apps can omit client secret; provide if configured
  const clientSecret = process.env.X_CLIENT_SECRET || undefined;

  const now = Date.now();
  const exp = account.tokenExpiresAt?.getTime() ?? 0;
  const aboutToExpire = exp > 0 && exp < now + 30_000; // 30s skew

  let accessToken = await decryptTokenFromBuffer(account.accessTokenEnc);

  if (aboutToExpire && account.refreshTokenEnc) {
    const refreshToken = await decryptTokenFromBuffer(account.refreshTokenEnc);
    const refreshed = await refreshAccessToken({
      clientId,
      clientSecret,
      refreshToken,
    });

    accessToken = refreshed.access_token;
    const newAccessEnc = await encryptTokenToBuffer(accessToken);
    const newRefreshEnc = refreshed.refresh_token
      ? await encryptTokenToBuffer(refreshed.refresh_token)
      : account.refreshTokenEnc;

    const newExpiresAt =
      typeof refreshed.expires_in === "number"
        ? new Date(Date.now() + refreshed.expires_in * 1000)
        : account.tokenExpiresAt;

    await prisma.socialAccount.update({
      where: { userId_provider: { userId: account.userId, provider: account.provider } },
      data: {
        accessTokenEnc: newAccessEnc,
        refreshTokenEnc: newRefreshEnc ?? undefined,
        tokenExpiresAt: newExpiresAt ?? undefined,
        scope: refreshed.scope ?? account.scope ?? undefined,
      },
    });
  }

  return accessToken;
}

export async function POST(req: Request) {
  try {
    const s = getSession(req);
    if (!s.userId) return json({ error: "Unauthorized" }, { status: 401 });

    // CSRF protection (double-submit cookie)
    try { requireCsrf(req); } catch (e: any) { return json({ error: e?.message ?? "Forbidden" }, { status: e?.status || 403 }); }
    
    // Feature flag
    const { xEnabled } = getEnv();
    if (!xEnabled) return json({ error: "X integration disabled" }, { status: 503 });
    
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    let body: PostBody;
    let uploadFile: File | null = null;

    if (ct.includes("application/json")) {
      const raw = (await req.json()) as PostBody;
      const parsed = XPostBodySchema.safeParse(raw);
      if (!parsed.success) return json({ error: "Invalid payload" }, { status: 400 });
      body = parsed.data;
    } else if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const text = String(form.get("text") || "");
      const parsed = XPostBodySchema.safeParse({ text });
      if (!parsed.success) return json({ error: "Invalid payload" }, { status: 400 });
      body = { text: parsed.data.text };
      const maybeFile = form.get("file");
      if (maybeFile && maybeFile instanceof File && (maybeFile as File).size > 0) {
        uploadFile = maybeFile as File;
      }
    } else {
      return json({ error: "Unsupported content-type" }, { status: 415 });
    }

    const text = (body.text || "").trim();
    if (!text) return json({ error: "text is required" }, { status: 400 });
    if (text.length > 280) return json({ error: "text exceeds 280 characters" }, { status: 400 });

    // Ensure connected account exists
    const account = await prisma.socialAccount.findUnique({
      where: { userId_provider: { userId: s.userId, provider: "x" } },
    });

    if (!account) {
      return json({ error: "X is not connected for this user" }, { status: 400 });
    }

    const accessToken = await ensureValidAccessToken(account as any);

    // Post the tweet (optionally with media)
    let mediaIds: string[] | undefined;
    if (uploadFile) {
      const type = (uploadFile.type || "").toLowerCase();
      if (!type.startsWith("image/")) {
        return json({ error: "Only image/* files are supported for X media" }, { status: 400 });
      }
      const buf = Buffer.from(await uploadFile.arrayBuffer());
      const category = type === "image/gif" ? "tweet_gif" : "tweet_image";
      const up = await uploadMedia(accessToken, buf, { mimeType: type, category: category as any });
      mediaIds = [up.media_id_string];
    }

    const posted = await postTweet(accessToken, { text, mediaIds });

    // Record to history for consistency with scheduled posts
    try {
      const tweetId = posted?.data?.id ?? null;
      let tweetUrl: string | null = null;
      // Lookup handle to construct URL
      const accountForUrl = await prisma.socialAccount.findUnique({
        where: { userId_provider: { userId: s.userId, provider: "x" } },
        select: { handle: true },
      });
      if (tweetId) {
        const h = (accountForUrl?.handle || "").replace(/^@/, "");
        tweetUrl = h ? `https://x.com/${h}/status/${tweetId}` : `https://x.com/i/web/status/${tweetId}`;
      }
      await prisma.scheduledPost.create({
        data: {
          userId: s.userId,
          provider: "x",
          text,
          status: "posted",
          postedAt: new Date(),
          errorMsg: null,
          tweetId: tweetId ?? undefined,
          tweetUrl: tweetUrl ?? undefined,
        },
      });
    } catch {
      // Non-fatal: history write failure should not break posting
    }

    return json({ ok: true, tweet: posted.data });
  } catch (err: any) {
    return json({ error: err?.message ?? "Post failed" }, { status: 500 });
  }
}