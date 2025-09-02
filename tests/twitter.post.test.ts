import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/twitter/post/route";

describe("POST /api/twitter/post", () => {
  it("returns 400 when missing text", async () => {
    const req = new Request("http://test/api/twitter/post", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/missing or invalid text/i);
  });

  it("returns 400 when text is too short", async () => {
    const req = new Request("http://test/api/twitter/post", {
      method: "POST",
      body: JSON.stringify({ text: "hi" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/missing or invalid text/i);
  });

  it("accepts valid text and returns tweet id", async () => {
    const text = "This is a test tweet for the player profile.";
    const req = new Request("http://test/api/twitter/post", {
      method: "POST",
      body: JSON.stringify({ text }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      ok: true,
      text,
      meta: {
        provider: "stub",
      },
    });
    expect(typeof data.id).toBe("string");
    expect(data.id.startsWith("tweet_")).toBe(true);
    expect(data.meta.postedAt).toBeDefined();
  });

  it("handles optional slug and title", async () => {
    const text = "Another test tweet.";
    const slug = "test-slug";
    const title = "Test Title";
    const req = new Request("http://test/api/twitter/post", {
      method: "POST",
      body: JSON.stringify({ text, slug, title }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.meta.slug).toBe(slug);
    expect(data.meta.title).toBe(title);
  });

  it("returns 400 on invalid JSON (falls back to empty object)", async () => {
    const req = new Request("http://test/api/twitter/post", {
      method: "POST",
      body: "invalid json",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/missing or invalid text/i);
  });
});