import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Helpers to construct Request easily
function req(url: string, init?: RequestInit) {
  return new Request(url, init as any);
}

describe("API routes — X integration", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    process.env = { ...OLD_ENV, NODE_ENV: "test" };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("GET /api/x/status → 200 connected, 503 when disabled, 401 when unauth", async () => {
    // Mock session (authenticated)
    let session = { userId: "u1", role: "player" };
    vi.doMock("@/lib/auth/guards", () => ({
      getSession: () => session,
    }));

    // Mock prisma account present
    const prismaMock = {
      socialAccount: {
        findUnique: vi.fn().mockResolvedValue({
          handle: "@msw_user",
          tokenExpiresAt: new Date("2030-01-01T00:00:00.000Z"),
          scope: "tweet.read users.read tweet.write offline.access media.write",
        }),
      },
    };
    vi.doMock("@/lib/prisma", () => ({ __esModule: true, default: prismaMock, prisma: prismaMock }));

    // Enabled
    process.env.X_ENABLED = "true";
    const { GET } = await import("@/app/api/x/status/route");
    let res = await GET(req("http://test/api/x/status"));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.connected).toBe(true);
    expect(j.handle).toBe("@msw_user");

    // Disabled
    process.env.X_ENABLED = "false";
    res = await GET(req("http://test/api/x/status"));
    expect(res.status).toBe(503);

    // Unauth
    session = { userId: null, role: "unknown" } as any;
    process.env.X_ENABLED = "true";
    res = await GET(req("http://test/api/x/status"));
    expect(res.status).toBe(401);
  });

  it("GET /api/x/auth-url → returns authorize URL, 401 when unauth", async () => {
    // Auth ok
    vi.doMock("@/lib/auth/guards", () => ({
      getSession: () => ({ userId: "u1", role: "player" }),
    }));
    // Iron-session mock
    vi.doMock("@/lib/session", () => ({
      getSession: async () => ({ userId: "u1", oauth: {}, save: vi.fn() }),
    }));
    // Env
    process.env.X_CLIENT_ID = "CLIENT_ID";
    process.env.X_REDIRECT_URI = "http://localhost:3000/api/x/callback";

    const { GET } = await import("@/app/api/x/auth-url/route");
    let res = await GET(req("http://test/api/x/auth-url"));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(typeof j.url).toBe("string");
    expect(j.url).toContain("response_type=code");
    expect(j.url).toContain("code_challenge_method=S256");

    // Unauth
    vi.doMock("@/lib/auth/guards", () => ({
      getSession: () => ({ userId: null, role: "unknown" }),
    }));
    const { GET: GET2 } = await import("@/app/api/x/auth-url/route");
    res = await GET2(req("http://test/api/x/auth-url"));
    expect(res.status).toBe(401);
  });

  it("PATCH/GET /api/x/prefs → toggles autoShareBlogToX", async () => {
    vi.doMock("@/lib/auth/guards", () => ({
      getSession: () => ({ userId: "u1", role: "player" }),
    }));

    const upsert = vi.fn().mockResolvedValue({ userId: "u1", autoShareBlogToX: true });
    const find = vi.fn().mockResolvedValue({ userId: "u1", autoShareBlogToX: true });
    const prismaMock = {
      userSocialPrefs: {
        upsert,
        findUnique: find,
      },
    };
    vi.doMock("@/lib/prisma", () => ({ __esModule: true, default: prismaMock, prisma: prismaMock }));

    const { GET, PATCH } = await import("@/app/api/x/prefs/route");

    let res = await PATCH(
      req("http://test/api/x/prefs", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ autoShareBlogToX: true }),
      })
    );
    expect(res.status).toBe(200);
    const j1 = await res.json();
    expect(j1.autoShareBlogToX).toBe(true);

    res = await GET(req("http://test/api/x/prefs"));
    expect(res.status).toBe(200);
    const j2 = await res.json();
    expect(j2.autoShareBlogToX).toBe(true);
  });

  it("POST /api/x/schedule → 201 scheduled (CSRF bypassed), 415 on wrong content-type", async () => {
    vi.doMock("@/lib/auth/guards", () => ({
      getSession: () => ({ userId: "u1", role: "player" }),
    }));
    // Bypass CSRF
    vi.doMock("@/lib/security/csrf", () => ({ requireCsrf: () => {} }));
    // Feature flag via getEnv()
    vi.doMock("@/lib/env", () => ({ getEnv: () => ({ xEnabled: true }) }));

    const create = vi.fn().mockResolvedValue({
      id: "sp1",
      scheduledFor: new Date("2030-01-01T00:00:00.000Z"),
      status: "scheduled",
    });
    const prismaMock = { scheduledPost: { create } };
    vi.doMock("@/lib/prisma", () => ({ __esModule: true, default: prismaMock, prisma: prismaMock }));

    const { POST } = await import("@/app/api/x/schedule/route");
    const res = await POST(
      req("http://test/api/x/schedule", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "hello", scheduledFor: "2030-01-01T00:00:00.000Z" }),
      })
    );
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.id).toBe("sp1");

    const bad = await POST(req("http://test/api/x/schedule", { method: "POST" } as any));
    expect(bad.status).toBe(415);
  });

  it("POST /api/x/retry → 200 on eligible item (CSRF bypassed), 404 when not found", async () => {
    vi.doMock("@/lib/auth/guards", () => ({
      getSession: () => ({ userId: "u1", role: "player" }),
    }));
    vi.doMock("@/lib/security/csrf", () => ({ requireCsrf: () => {} }));
    vi.doMock("@/lib/env", () => ({ getEnv: () => ({ xEnabled: true }) }));

    const findUnique = vi.fn()
      .mockResolvedValueOnce({ id: "a", userId: "u1", provider: "x", status: "failed" })
      .mockResolvedValueOnce(null);
    const update = vi.fn().mockResolvedValue({ id: "a", status: "scheduled", scheduledFor: new Date() });

    const prismaMock = {
      scheduledPost: { findUnique, update },
    };
    vi.doMock("@/lib/prisma", () => ({ __esModule: true, default: prismaMock, prisma: prismaMock }));

    const { POST } = await import("@/app/api/x/retry/route");
    const ok = await POST(
      req("http://test/api/x/retry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: "a" }),
      })
    );
    expect(ok.status).toBe(200);
    const j = await ok.json();
    expect(j.ok).toBe(true);

    const notFound = await POST(
      req("http://test/api/x/retry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: "missing" }),
      })
    );
    expect(notFound.status).toBe(404);
  });

  it("POST /api/x/post → 200 on success (JSON), 400 when text missing", async () => {
    vi.doMock("@/lib/auth/guards", () => ({
      getSession: () => ({ userId: "u1", role: "player" }),
    }));
    vi.doMock("@/lib/security/csrf", () => ({ requireCsrf: () => {} }));
    vi.doMock("@/lib/env", () => ({ getEnv: () => ({ xEnabled: true }) }));

    // Mock crypto and oauth helpers
    vi.doMock("@/lib/crypto", () => ({
      decryptTokenFromBuffer: async (_buf: Buffer) => "ACCESS",
      encryptTokenToBuffer: async (s: string) => Buffer.from(s),
    }));
    vi.doMock("@/lib/x-oauth", () => ({
      postTweet: async (_access: string, params: any) => ({ data: { id: "t1", text: params.text } }),
      refreshAccessToken: vi.fn(),
      uploadMedia: vi.fn(),
    }));

    const prismaMock = {
      socialAccount: {
        findUnique: vi.fn().mockResolvedValue({
          userId: "u1",
          provider: "x",
          accessTokenEnc: Buffer.from("enc"),
          refreshTokenEnc: null,
          tokenExpiresAt: new Date(Date.now() + 3600_000),
          scope: "tweet.write",
        }),
      },
      scheduledPost: {
        create: vi.fn(), // history write (non-fatal)
      },
    };
    vi.doMock("@/lib/prisma", () => ({ __esModule: true, default: prismaMock, prisma: prismaMock }));

    const { POST } = await import("@/app/api/x/post/route");

    const ok = await POST(
      req("http://test/api/x/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "hello" }),
      })
    );
    expect(ok.status).toBe(200);
    const j = await ok.json();
    expect(j.ok).toBe(true);
    expect(j.tweet.id).toBe("t1");

    const bad = await POST(
      req("http://test/api/x/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "" }),
      })
    );
    expect(bad.status).toBe(400);
  });

  it("Cron run processes one scheduled item and marks posted", async () => {
    process.env.CRON_SECRET = "S";
    vi.doMock("@/lib/env", () => ({ getEnv: () => ({ xEnabled: true }) }));
    vi.doMock("@/lib/x-oauth", () => ({
      postTweet: async (_access: string, _params: any) => ({ data: { id: "t_cron", text: "hello" } }),
      refreshAccessToken: vi.fn(),
    }));
    vi.doMock("@/lib/crypto", () => ({
      decryptTokenFromBuffer: async (_buf: Buffer) => "ACCESS",
      encryptTokenToBuffer: async (s: string) => Buffer.from(s),
    }));

    const prismaMock = {
      socialAccount: {
        findUnique: vi.fn().mockResolvedValue({
          userId: "u1",
          provider: "x",
          handle: "@user",
          accessTokenEnc: Buffer.from("enc"),
          refreshTokenEnc: null,
          tokenExpiresAt: new Date(Date.now() + 3600_000),
          scope: "tweet.write",
        }),
      },
      scheduledPost: {
        findMany: vi.fn().mockResolvedValue([{ id: "sp1", userId: "u1", text: "hello", mediaIdsJson: null }]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }), // claim
        update: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };
    vi.doMock("@/lib/prisma", () => ({ __esModule: true, default: prismaMock, prisma: prismaMock }));

    const { POST } = await import("@/app/api/cron/run-x-queue/route");
    const res = await POST(
      req("http://test/api/cron/run-x-queue", { method: "POST", headers: { "x-cron-secret": "S" } })
    );
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.processed).toBe(1);
  });
});