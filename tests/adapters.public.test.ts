import { describe, it, expect, vi, afterEach } from "vitest";
import { blog as sampleBlog } from "@/lib/sample/blog";
import { profile as sampleProfile } from "@/lib/sample/profile";

describe("Public adapters", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("getBlogIndex() falls back to sample on fetch failure", async () => {
    const { getBlogIndex } = await import("@/lib/adapters/public/blog");
    const originalFetch = global.fetch;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const result = await getBlogIndex();
    expect(Array.isArray(result.posts)).toBe(true);
    expect(result.posts.length).toBe(sampleBlog.posts.length);

    if (originalFetch) {
      vi.stubGlobal("fetch", originalFetch as any);
    } else {
      vi.unstubAllGlobals();
    }
  });

  it("getPublicProfile() prefers locally published profile when available", async () => {
    // Mock DB to return a published local profile
    vi.doMock("@/lib/profiles/db", () => ({
      getProfileForPlayer: async (_playerId: string) => ({ profile: sampleProfile }),
    }));

    const { getPublicProfile } = await import("@/lib/adapters/public/profile");
    const result = await getPublicProfile("any");
    expect(result).toMatchObject(sampleProfile);
  });
});
