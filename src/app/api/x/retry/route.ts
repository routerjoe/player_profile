import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/guards";
import { requireCsrf } from "@/lib/security/csrf";
import { XRetryBodySchema } from "@/lib/validation/x";
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

type RetryBody = {
  id?: string; // ScheduledPost id
};

/**
 * POST /api/x/retry
 * Body: { id: string }
 * - Marks a failed ScheduledPost as scheduled again (scheduledFor = now, status = "scheduled")
 * - Only allows retrying records owned by the current user
 */
export async function POST(req: Request) {
  try {
    const s = getSession(req);
    if (!s.userId) return json({ error: "Unauthorized" }, { status: 401 });

    // CSRF protection
    try { requireCsrf(req); } catch (e: any) { return json({ error: e?.message ?? "Forbidden" }, { status: e?.status || 403 }); }

    // Feature flag
    const { xEnabled } = getEnv();
    if (!xEnabled) return json({ error: "X integration disabled" }, { status: 503 });
    
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("application/json")) {
      return json({ error: "content-type must be application/json" }, { status: 415 });
    }

    const raw = (await req.json()) as RetryBody;
    const parsed = XRetryBodySchema.safeParse(raw);
    if (!parsed.success) return json({ error: "Invalid payload" }, { status: 400 });
    const id = String(parsed.data.id || "").trim();
    if (!id) return json({ error: "id is required" }, { status: 400 });

    const existing = await prisma.scheduledPost.findUnique({ where: { id } });
    if (!existing || existing.userId !== s.userId || existing.provider !== "x") {
      return json({ error: "Not found" }, { status: 404 });
    }

    if (existing.status !== "failed" && existing.status !== "scheduled") {
      // Only allow retrying failed or re-queueing scheduled
      return json({ error: `Cannot retry from status: ${existing.status}` }, { status: 400 });
    }

    const updated = await prisma.scheduledPost.update({
      where: { id },
      data: {
        status: "scheduled",
        errorMsg: null,
        postedAt: null,
        scheduledFor: new Date(),
      },
    });

    return json({ ok: true, id: updated.id, status: updated.status, scheduledFor: updated.scheduledFor });
  } catch (err: any) {
    return json({ error: err?.message ?? "Retry failed" }, { status: 500 });
  }
}