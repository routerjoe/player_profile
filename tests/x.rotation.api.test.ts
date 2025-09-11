import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks
vi.mock("@/lib/crypto", () => {
  return {
    __esModule: true,
    decryptTokenFromBuffer: vi.fn().mockRejectedValue(new Error("decrypt_failed")),
    encryptTokenToBuffer: vi.fn(),
  };
});
vi.mock("@/lib/env", () => ({ __esModule: true, getEnv: () => ({ xEnabled: true }) }));
vi.mock("@/lib/security/csrf", () => ({ __esModule: true, requireCsrf: () => {} }));
vi.mock("@/lib/auth/guards", () => ({ __esModule: true, getSession: () => ({ userId: "u_test" }) }));

const mockPrisma = {
  socialAccount: {
    findUnique: vi.fn().mockResolvedValue({
      userId: "u_test",
      provider: "x",
      accessTokenEnc: Buffer.from("aa", "utf8"),
      refreshTokenEnc: null,
      tokenExpiresAt: null,
      scope: null,
    }),
  },
  scheduledPost: {
    update: vi.fn(),
  },
};
vi.mock("@/lib/prisma", () => ({ __esModule: true, default: mockPrisma }));

// Route under test
import { POST as postRoute } from "@/app/api/x/post/route";

describe("APP_SECRET rotation handling (token decrypt failure requires reconnect)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/x/post → returns 401 with reconnect message when token decrypt fails", async () => {
    const req = new Request("http://localhost/api/x/post", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "hello rotation" }),
    });

    const res = await postRoute(req);
    expect(res.status).toBe(401);
    const j = await res.json();
    expect(j.error).toMatch(/reconnect/i);
  });
});