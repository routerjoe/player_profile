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
 * GET /api/x/history
 * Acceptance:
 * - 401 when unauthenticated
 * - 200 → last 10 by user with { id, status, scheduledFor, postedAt, errorMsg? }
 *   0 results is OK
 */
export async function GET(req: Request) {
  try {
    const s = getSession(req);
    if (!s.userId) return json({ error: "Unauthorized" }, { status: 401 });

    const rows = await prisma.scheduledPost.findMany({
      where: { userId: s.userId, provider: "x" },
      orderBy: [
        // Prefer recently posted first, then latest scheduled/created
        { postedAt: "desc" },
        { scheduledFor: "desc" },
        { createdAt: "desc" },
      ],
      take: 10,
      select: {
        id: true,
        status: true,
        scheduledFor: true,
        postedAt: true,
        errorMsg: true,
        tweetId: true,
        tweetUrl: true,
      },
    });

    const items = rows.map((r) => ({
      id: r.id,
      status: r.status,
      scheduledFor: r.scheduledFor ? r.scheduledFor.toISOString() : null,
      postedAt: r.postedAt ? r.postedAt.toISOString() : null,
      errorMsg: r.errorMsg ?? null,
      tweetId: (r as any).tweetId ?? null,
      tweetUrl: (r as any).tweetUrl ?? null,
    }));

    return json({ items }, { status: 200 });
  } catch (err: any) {
    return json({ error: err?.message ?? "History failed" }, { status: 500 });
  }
}