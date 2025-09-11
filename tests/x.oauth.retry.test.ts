import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { fetchWithRetry } from "@/lib/x-oauth";

describe("x-oauth fetchWithRetry()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("retries once on 429 using Retry-After header, then succeeds", async () => {
    const first = new Response("slow down", { status: 429, headers: { "retry-after": "1" } });
    const second = new Response("ok", { status: 200 });
    const mockFetch = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    vi.stubGlobal("fetch", mockFetch as any);

    const p = fetchWithRetry("http://example.com", {}, 2);

    // Advance 1s for Retry-After
    await vi.advanceTimersByTimeAsync(1000);

    const res = await p;
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("backs off exponentially on 5xx and returns final response after max attempts", async () => {
    const r1 = new Response("server err", { status: 500 });
    const r2 = new Response("still bad", { status: 502 });
    const mockFetch = vi.fn().mockResolvedValueOnce(r1).mockResolvedValueOnce(r2);
    vi.stubGlobal("fetch", mockFetch as any);

    const p = fetchWithRetry("http://example.com", {}, 2);

    // backoff 500ms for attempt 0
    await vi.advanceTimersByTimeAsync(500);
    // backoff 1000ms for attempt 1
    await vi.advanceTimersByTimeAsync(1000);

    const res = await p;
    // With no success, function returns last Response
    expect(res.status).toBe(502);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("retries after network error and succeeds", async () => {
    const netErr = new Error("network down");
    const ok = new Response("ok", { status: 200 });
    const mockFetch = vi.fn().mockRejectedValueOnce(netErr).mockResolvedValueOnce(ok);
    vi.stubGlobal("fetch", mockFetch as any);

    const p = fetchWithRetry("http://example.com", {}, 2);

    // backoff 500ms for network error
    await vi.advanceTimersByTimeAsync(500);

    const res = await p;
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});