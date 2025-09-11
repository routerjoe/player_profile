import prisma from "@/lib/prisma";
import { decryptTokenFromBuffer, encryptTokenToBuffer } from "@/lib/crypto";
import { postTweet, refreshAccessToken } from "@/lib/x-oauth";
import { getEnv } from "@/lib/env";
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

type Account = {
  userId: string;
  provider: string;
  accessTokenEnc: Buffer;
  refreshTokenEnc: Buffer | null;
  tokenExpiresAt: Date | null;
  scope: string | null;
};

async function ensureValidAccessToken(account: Account): Promise<string> {
  const clientId = process.env.X_CLIENT_ID!;
  const clientSecret = process.env.X_CLIENT_SECRET || undefined;

  let accessToken: string;
  try {
    accessToken = await decryptTokenFromBuffer(account.accessTokenEnc);
  } catch {
    throw new Error("TOKEN_DECRYPT_FAILED");
  }

  const exp = account.tokenExpiresAt?.getTime() ?? 0;
  const now = Date.now();
  const aboutToExpire = exp > 0 && exp < now + 30_000; // 30s skew

  if (aboutToExpire && account.refreshTokenEnc) {
    let refreshToken: string;
    try {
      refreshToken = await decryptTokenFromBuffer(account.refreshTokenEnc);
    } catch {
      throw new Error("TOKEN_DECRYPT_FAILED");
    }
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

function validateCronSecret(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // no secret configured: allow
  const got = req.headers.get("x-cron-secret");
  return !!got && got === expected;
}

async function processOne(sp: { id: string; userId: string; text: string | null; mediaIdsJson: string | null }) {
  // Ensure connected account
  const account = await prisma.socialAccount.findUnique({
    where: { userId_provider: { userId: sp.userId, provider: "x" } },
  });
  if (!account) {
    await prisma.scheduledPost.update({
      where: { id: sp.id },
      data: { status: "failed", errorMsg: "No connected X account", postedAt: null },
    });
    return { id: sp.id, status: "failed", error: "No connected X account" };
  }

  try {
    const accessToken = await ensureValidAccessToken(account as any);

    const text = (sp.text || "").slice(0, 280);
    let mediaIds: string[] | undefined;
    if (sp.mediaIdsJson) {
      try {
        const parsed = JSON.parse(sp.mediaIdsJson);
        if (Array.isArray(parsed)) {
          mediaIds = parsed.filter((x) => typeof x === "string");
        }
      } catch {
        // ignore malformed mediaIdsJson and proceed without media
      }
    }

    const res = await postTweet(accessToken, { text, mediaIds });
    const tweetId = res?.data?.id ?? null;
    let tweetUrl: string | null = null;
    if (tweetId) {
      const handle = (account as any)?.handle as string | null;
      const h = handle ? handle.replace(/^@/, "") : null;
      tweetUrl = h ? `https://x.com/${h}/status/${tweetId}` : `https://x.com/i/web/status/${tweetId}`;
    }
    await prisma.scheduledPost.update({
      where: { id: sp.id },
      data: {
        status: "posted",
        postedAt: new Date(),
        errorMsg: null,
        tweetId: tweetId ?? undefined,
        tweetUrl: tweetUrl ?? undefined,
      },
    });
    return { id: sp.id, status: "posted", tweetId, tweetUrl };
  } catch (err: any) {
    if (err && err.message === "TOKEN_DECRYPT_FAILED") {
      try {
        await prisma.scheduledPost.update({
          where: { id: sp.id },
          data: { status: "failed", errorMsg: "Reconnection required", postedAt: null },
        });
      } catch {}
      logger.warn("x.cron.reconnect_required", { id: sp.id, userId: sp.userId });
      return { id: sp.id, status: "failed", error: "Reconnection required" };
    }
    const msg = err?.message ?? "Post failed";
    await prisma.scheduledPost.update({
      where: { id: sp.id },
      data: { status: "failed", errorMsg: msg, postedAt: null },
    });
    return { id: sp.id, status: "failed", error: msg };
  }
}

async function revertStuckProcessing(maxAgeMs = 10 * 60 * 1000) {
  const cutoff = new Date(Date.now() - maxAgeMs);
  try {
    await prisma.scheduledPost.updateMany({
      where: {
        provider: "x",
        status: "processing",
        createdAt: { lt: cutoff },
      },
      data: { status: "scheduled" },
    });
  } catch {
    // ignore revert errors
  }
}

async function runOnce(limit = 10) {
  await revertStuckProcessing(); // crash-safe revert for stuck processing items

  const now = new Date();
  const candidates = await prisma.scheduledPost.findMany({
    where: {
      provider: "x",
      status: "scheduled",
      OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, userId: true, text: true, mediaIdsJson: true },
  });

  const results: any[] = [];
  for (const sp of candidates) {
    // Attempt atomic claim: only transition if still scheduled
    const claimed = await prisma.scheduledPost.updateMany({
      where: { id: sp.id, status: "scheduled" },
      data: { status: "processing" },
    });
    if (claimed.count === 0) continue; // lost the race

    const r = await processOne(sp);
    results.push(r);
  }
  return { processed: results.length, results };
}

async function cleanupOldRecords(retentionDays = 90) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  try {
    await prisma.scheduledPost.deleteMany({
      where: { provider: "x", createdAt: { lt: cutoff } },
    });
  } catch {
    // ignore cleanup errors
  }
}

export async function POST(req: Request) {
  try {
    if (!validateCronSecret(req)) return json({ error: "Unauthorized" }, { status: 401 });
    const { xEnabled } = getEnv();
    if (!xEnabled) return json({ error: "X integration disabled" }, { status: 503 });

    logger.info("x.cron.run.start", {});
    const out = await runOnce(10);
    await cleanupOldRecords(90);
    logger.info("x.cron.run.done", { processed: out.processed });
    return json({ ok: true, ...out });
  } catch (err: any) {
    return json({ error: err?.message ?? "Cron failed" }, { status: 500 });
  }
}

// Allow GET for easy local/manual triggering
export async function GET(req: Request) {
  return POST(req);
}