import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/guards";

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
 * GET /api/x/prefs
 * Returns user's social prefs for X.
 * 401 when unauthenticated
 * 200 { autoShareBlogToX: boolean }
 */
export async function GET(req: Request) {
  try {
    const s = getSession(req);
    if (!s.userId) return json({ error: "Unauthorized" }, { status: 401 });

    const rec = await prisma.userSocialPrefs.findUnique({
      where: { userId: s.userId },
    });

    return json({
      autoShareBlogToX: !!rec?.autoShareBlogToX,
    });
  } catch (err: any) {
    return json({ error: err?.message ?? "Failed" }, { status: 500 });
  }
}

/**
 * PATCH /api/x/prefs
 * Body: { autoShareBlogToX?: boolean }
 * 401 when unauthenticated
 * 200 with updated value(s)
 */
export async function PATCH(req: Request) {
  try {
    const s = getSession(req);
    if (!s.userId) return json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const patch: any = {};

    if (typeof body.autoShareBlogToX === "boolean") {
      patch.autoShareBlogToX = body.autoShareBlogToX;
    }

    if (Object.keys(patch).length === 0) {
      return json({ error: "No valid fields" }, { status: 400 });
    }

    const updated = await prisma.userSocialPrefs.upsert({
      where: { userId: s.userId },
      create: { userId: s.userId, autoShareBlogToX: !!patch.autoShareBlogToX },
      update: { ...patch },
    });

    return json({
      autoShareBlogToX: !!updated.autoShareBlogToX,
    });
  } catch (err: any) {
    return json({ error: err?.message ?? "Update failed" }, { status: 500 });
  }
}