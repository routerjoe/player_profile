import { describe, it, expect, vi } from "vitest";

// Mock FS helpers to avoid disk writes
vi.mock("@/lib/photos/fs", () => {
  return {
    urlForUpload: (playerId: string, id: string, ext: string) => `/uploads/${playerId}/${id}.${ext}`,
    absolutePathForUrl: (url: string) => `/tmp/${url.split("/").pop()}`,
    saveFileFromBuffer: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock session to force header-based fallback (x-user-id)
vi.mock("@/lib/users/session", () => {
  return {
    getSessionFromRequest: () => undefined,
  };
});

import { POST } from "@/app/api/media/upload/route";

describe("POST /api/media/upload (local)", () => {
  it("returns 400 when missing file field", async () => {
    const form = new FormData();
    form.set("alt", "sample alt");
    const req = new Request("http://test/api/media/upload", {
      method: "POST",
      body: form,
      headers: { "x-user-id": "demo" },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/missing file field/i);
  });

  it("accepts a small mp4 upload and returns URL metadata", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const file = new File([bytes], "clip.mp4", { type: "video/mp4" });

    const form = new FormData();
    form.set("file", file);
    form.set("alt", "test video");

    const req = new Request("http://test/api/media/upload", {
      method: "POST",
      body: form,
      headers: { "x-user-id": "test-player" },
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      provider: "local",
      type: "video/mp4",
      alt: "test video",
    });
    expect(typeof data.url).toBe("string");
    expect(data.url).toContain("/uploads/test-player/");
    expect(data.url.endsWith(".mp4")).toBe(true);
  });
});
