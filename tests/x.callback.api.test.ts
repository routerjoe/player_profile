import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function req(url: string, init?: RequestInit) {
  return new Request(url, init as any);
}

describe("GET /api/x/callback", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    process.env = {
      ...OLD_ENV,
      X_CLIENT_ID: "CLIENT_ID",
      X_REDIRECT_URI: "http://localhost:3000/api/x/callback",
    } as any;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("completes OAuth (happy path) and redirects to /dashboard/settings", async () => {
    // Iron-session app session with expected oauth state and verifier
    const save = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@/lib/session", () => ({
      getSession: async () => ({
        userId: "u1",
        oauth: { state: "STATE123", verifier: "VERIFIER" },
        save,
      }),
    }));

    // exchange + getMe
    vi.doMock("@/lib/x-oauth", () => ({
      exchangeCodeForToken: async (_args: any) => ({
        token_type: "bearer",
        expires_in: 3600,
        access_token: "ACCESS",
        refresh_token: "REFRESH",
        scope: "tweet.read users.read tweet.write offline.access media.write",
      }),
      getMe: async (_access: string) => ({
        data: { id: "x_1", name: "X User", username: "xuser" },
      }),
    }));

    // crypto wrappers are used by the route; keep as thin pass-through
    vi.doMock("@/lib/crypto", () => ({
      encryptTokenToBuffer: async (s: string) => Buffer.from(s),
    }));

    // prisma upsert
    const upsert = vi.fn().mockResolvedValue({});
    const prismaMock = { socialAccount: { upsert } };
    vi.doMock("@/lib/prisma", () => ({ __esModule: true, default: prismaMock, prisma: prismaMock }));

    const { GET } = await import("@/app/api/x/callback/route");

    // Provide matching state and a dummy code
    const res = await GET(
      req("http://test/api/x/callback?code=CODE123&state=STATE123", { method: "GET" })
    );
    // Should redirect to dashboard settings
    expect(res.status).toBe(303);
    const location = res.headers.get("location") || res.headers.get("Location");
    expect(location).toBeTruthy();
    expect(String(location)).toMatch(/\/dashboard\/settings$/);

    // Session save called and oauth cleared in impl; we at least verify save called
    expect(save).toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it("returns 400 when state is missing or mismatched", async () => {
    vi.doMock("@/lib/session", () => ({
      getSession: async () => ({
        userId: "u1",
        oauth: { state: "STATE123", verifier: "VERIFIER" },
        save: vi.fn(),
      }),
    }));
    const { GET } = await import("@/app/api/x/callback/route");

    const mismatched = await GET(
      req("http://test/api/x/callback?code=CODE123&state=OTHER", { method: "GET" })
    );
    expect(mismatched.status).toBe(400);

    const missing = await GET(req("http://test/api/x/callback", { method: "GET" }));
    expect(missing.status).toBe(400);
  });

  it("returns 401 when user session is missing", async () => {
    const save = vi.fn();
    vi.doMock("@/lib/session", () => ({
      getSession: async () => ({
        userId: undefined,
        oauth: { state: "STATE123", verifier: "VERIFIER" },
        save,
      }),
    }));
    const { GET } = await import("@/app/api/x/callback/route");
    const res = await GET(
      req("http://test/api/x/callback?code=CODE123&state=STATE123", { method: "GET" })
    );
    expect(res.status).toBe(401);
  });
});