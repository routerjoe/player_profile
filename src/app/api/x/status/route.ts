import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/guards";
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

/**
 * GET /api/x/status
 * Acceptance:
 * - 401 when unauthenticated
 * - 200 with shape { connected: boolean, handle?: string, tokenExpiresAt?: string }
 *   when authenticated
 */
export async function GET(req: Request) {
  try {
    const s = getSession(req);
    if (!s.userId) return json({ error: "Unauthorized" }, { status: 401 });

    const xEnabled = (process.env.X_ENABLED || "true").toLowerCase() !== "false";
    if (!xEnabled) {
      logger.info("x.status.disabled", {});
      return json({ error: "X integration disabled" }, { status: 503 });
    }

    const account = await prisma.socialAccount.findUnique({
      where: { userId_provider: { userId: s.userId, provider: "x" } },
      select: {
        handle: true,
        tokenExpiresAt: true,
        scope: true,
      },
    });

    if (!account) {
      logger.info("x.status.unconnected", { userId: s.userId });
      return json({ connected: false });
    }

    const required = ["tweet.read", "users.read", "tweet.write", "offline.access", "media.write"];
    const got = (account.scope || "").split(/\s+/).filter(Boolean);
    const missing = required.filter((r) => !got.includes(r));
    const scopeWarning = missing.length ? `Missing scopes: ${missing.join(", ")}` : undefined;

    logger.info("x.status.ok", {
      userId: s.userId,
      hasHandle: !!account.handle,
      hasScopeWarning: !!scopeWarning
    });
    return json({
      connected: true,
      handle: account.handle ?? undefined,
      tokenExpiresAt: account.tokenExpiresAt ? account.tokenExpiresAt.toISOString() : undefined,
      scopeWarning,
    });
  } catch (err: any) {
    logger.error("x.status.error", { message: err?.message ?? "Status failed" });
    return json({ error: err?.message ?? "Status failed" }, { status: 500 });
  }
}