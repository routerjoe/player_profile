import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { logger, logSink } from "@/lib/observability/logger";

// route imports for response shape checks
import { GET as XStatusGET } from "@/app/api/x/status/route";
import { GET as XHistoryGET } from "@/app/api/x/history/route";

function req(url: string, init?: RequestInit) {
  return new Request(url, init as any);
}

describe("leak tests — logs and responses do not expose secrets", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, NODE_ENV: "test" };
    // Clear sink
    logSink.splice(0, logSink.length);
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("logger redacts secrets by key and bearer tokens in strings", () => {
    logger.info("test.event", {
      access_token: "SHOULD_NOT_APPEAR",
      refresh_token: "SHOULD_NOT_APPEAR",
      Authorization: "Bearer secret-abc",
      nested: {
        Authorization: "Bearer xyz",
        some: "with Bearer abcdef",
      },
      note: "Authorization: Bearer ZZZ",
    });

    expect(logSink.length).toBe(1);
    const meta: any = logSink[0].meta;
    // redact by key
    expect(meta.access_token).toBe("[REDACTED]");
    expect(meta.refresh_token).toBe("[REDACTED]");
    expect(meta.Authorization).toBe("[REDACTED]");

    // nested key redaction
    expect(meta.nested.Authorization).toBe("[REDACTED]");
    // bearer pattern redaction in string values
    expect(meta.nested.some).toContain("Bearer [REDACTED]");
    expect(meta.note).toContain("Bearer [REDACTED]");
  });

  it("status/history responses do not include access_token/refresh_token/Authorization fields", async () => {
    // Mock session authorized and prisma to avoid real DB
    const guards = await import("@/lib/auth/guards");
    const guardsSpy = vi.spyOn(guards, "getSession").mockReturnValue({ userId: "u1", role: "player" } as any);

    const prismaMock = {
      socialAccount: {
        findUnique: vi.fn().mockResolvedValue({
          handle: "@demo",
          tokenExpiresAt: new Date("2030-01-01T00:00:00.000Z"),
          scope: "tweet.read users.read tweet.write offline.access media.write",
        }),
      },
      scheduledPost: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as any;

    vi.doMock("@/lib/prisma", () => ({ __esModule: true, default: prismaMock, prisma: prismaMock }));

    const res1 = await XStatusGET(req("http://test/api/x/status"));
    const body1 = await res1.text();
    expect(/access_token/i.test(body1)).toBe(false);
    expect(/refresh_token/i.test(body1)).toBe(false);
    expect(/authorization/i.test(body1)).toBe(false);

    const res2 = await XHistoryGET(req("http://test/api/x/history"));
    const body2 = await res2.text();
    expect(/access_token/i.test(body2)).toBe(false);
    expect(/refresh_token/i.test(body2)).toBe(false);
    expect(/authorization/i.test(body2)).toBe(false);

    guardsSpy.mockRestore();
  });
});