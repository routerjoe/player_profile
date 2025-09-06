import prisma from "@/lib/prisma";
import { getSession as getAppSession } from "@/lib/session";
import { getSession } from "@/lib/auth/guards";
import { requireCsrf } from "@/lib/security/csrf";

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
 * POST /api/x/disconnect
 * - Requires authentication (cookie session via guards)
 * - Deletes the X SocialAccount for the current user
 * - Clears any temporary OAuth state in the iron-session
 */
export async function POST(req: Request) {
  try {
    const s = getSession(req);
    if (!s.userId) return json({ error: "Unauthorized" }, { status: 401 });

    // CSRF protection
    try {
      requireCsrf(req);
    } catch (e: any) {
      return json({ error: e?.message ?? "Forbidden" }, { status: e?.status || 403 });
    }

    // CSRF protection
    try { requireCsrf(req); } catch (e: any) { return json({ error: e?.message ?? "Forbidden" }, { status: e?.status || 403 }); }

    // Remove any stored connection
    await prisma.socialAccount.deleteMany({
      where: { userId: s.userId, provider: "x" },
    });

    // Clear transient OAuth state if present
    const sess = await getAppSession();
    if (sess.oauth) {
      delete sess.oauth;
      await sess.save();
    }

    return json({ ok: true });
  } catch (err: any) {
    return json({ error: err?.message ?? "Disconnect failed" }, { status: 500 });
  }
}