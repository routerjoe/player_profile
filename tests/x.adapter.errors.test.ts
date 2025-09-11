import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getStatus, ApiError } from "@/lib/adapters/dashboard/x";

function fakeRes(status: number, body: any = { error: "test" }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("Dashboard X adapter error mapping", () => {
  const origFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = origFetch!;
  });

  it("maps 401 to UNAUTH", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(fakeRes(401));
    await expect(getStatus()).rejects.toBeInstanceOf(ApiError);
    try {
      await getStatus();
    } catch (e: any) {
      expect(e).toBeInstanceOf(ApiError);
      expect(e.code).toBe("UNAUTH");
      expect(e.status).toBe(401);
    }
  });

  it("maps 403 to FORBIDDEN", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(fakeRes(403));
    try {
      await getStatus();
    } catch (e: any) {
      expect(e).toBeInstanceOf(ApiError);
      expect(e.code).toBe("FORBIDDEN");
      expect(e.status).toBe(403);
    }
  });

  it("maps 429 to RATE_LIMIT", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(fakeRes(429, { error: "Too Many Requests" }));
    try {
      await getStatus();
    } catch (e: any) {
      expect(e).toBeInstanceOf(ApiError);
      expect(e.code).toBe("RATE_LIMIT");
      expect(e.status).toBe(429);
    }
  });

  it("maps 503 to DISABLED", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(fakeRes(503, { error: "X integration disabled" }));
    try {
      await getStatus();
    } catch (e: any) {
      expect(e).toBeInstanceOf(ApiError);
      expect(e.code).toBe("DISABLED");
      expect(e.status).toBe(503);
    }
  });

  it("maps other 4xx to BAD_REQUEST", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(fakeRes(400, { error: "Invalid payload" }));
    try {
      await getStatus();
    } catch (e: any) {
      expect(e).toBeInstanceOf(ApiError);
      expect(e.code).toBe("BAD_REQUEST");
      expect(e.status).toBe(400);
    }
  });

  it("maps 5xx to SERVER", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(fakeRes(500, { error: "Server error" }));
    try {
      await getStatus();
    } catch (e: any) {
      expect(e).toBeInstanceOf(ApiError);
      expect(e.code).toBe("SERVER");
      expect(e.status).toBe(500);
    }
  });

  it("maps thrown fetch to NETWORK", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("network down"));
    try {
      await getStatus();
    } catch (e: any) {
      expect(e).toBeInstanceOf(ApiError);
      expect(e.code).toBe("NETWORK");
      expect(e.status).toBeUndefined();
    }
  });
});