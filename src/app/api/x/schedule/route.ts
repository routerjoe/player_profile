import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/guards";
import { requireCsrf } from "@/lib/security/csrf";
import { XScheduleBodySchema } from "@/lib/validation/x";
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

type ScheduleBody = {
  text?: string;
  scheduledFor?: string; // ISO datetime string
};

/**
 * POST /api/x/schedule
 * Body (JSON):
 * {
 *   "text": "hello world",
 *   "scheduledFor": "2025-09-06T01:00:00.000Z" // ISO; if omitted or invalid, schedule immediately
 * }
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

    const raw = (await req.json()) as ScheduleBody;
    const parsed = XScheduleBodySchema.safeParse(raw);
    if (!parsed.success) return json({ error: "Invalid payload" }, { status: 400 });
    const body = parsed.data as ScheduleBody;

    const text = (body.text || "").trim();
    if (!text) return json({ error: "text is required" }, { status: 400 });
    if (text.length > 280) return json({ error: "text exceeds 280 characters" }, { status: 400 });

    // Parse scheduledFor; if invalid or missing, schedule immediately (now)
    let when: Date | null = null;
    if (typeof body.scheduledFor === "string" && body.scheduledFor.trim()) {
      const d = new Date(body.scheduledFor);
      if (!Number.isNaN(d.getTime())) {
        when = d;
      }
    }
    if (!when) when = new Date();

    const rec = await prisma.scheduledPost.create({
      data: {
        userId: s.userId,
        provider: "x",
        text,
        scheduledFor: when,
        status: "scheduled",
      },
    });
    logger.info("x.schedule.created", { userId: s.userId, id: rec.id, scheduledFor: rec.scheduledFor });

    return json({ ok: true, id: rec.id, scheduledFor: rec.scheduledFor, status: rec.status }, { status: 201 });
  } catch (err: any) {
    return json({ error: err?.message ?? "Schedule failed" }, { status: 500 });
  }
}