import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  exchangeCodeForToken,
  refreshAccessToken,
  getMe,
  postTweet,
  uploadMedia,
} from "@/lib/x-oauth";

// MSW is initialized via tests/setup/msw.ts from vitest.config.ts

describe("x-oauth + MSW integration", () => {
  const OLD_ENV = process.env;
  beforeAll(() => {
    process.env = { ...OLD_ENV, X_MEDIA_UPLOAD_ENABLED: "true" };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("exchangeCodeForToken returns MSW token payload", async () => {
    const token = await exchangeCodeForToken({
      clientId: "CLIENT_ID",
      clientSecret: "CLIENT_SECRET",
      code: "AUTH_CODE",
      redirectUri: "http://localhost:3000/callback",
      codeVerifier: "verifier",
    });
    expect(token.access_token).toBe("MSW_ACCESS_TOKEN");
    expect(token.refresh_token).toBe("MSW_REFRESH_TOKEN");
    expect(typeof token.expires_in).toBe("number");
  });

  it("refreshAccessToken returns refreshed token", async () => {
    const token = await refreshAccessToken({
      clientId: "CLIENT_ID",
      clientSecret: "CLIENT_SECRET",
      refreshToken: "MSW_REFRESH_TOKEN",
    });
    expect(token.access_token).toBe("MSW_ACCESS_TOKEN");
  });

  it("getMe returns mocked user", async () => {
    const me = await getMe("MSW_ACCESS_TOKEN");
    expect(me.data.username).toBe("msw_user");
  });

  it("postTweet returns mocked tweet id", async () => {
    const res = await postTweet("MSW_ACCESS_TOKEN", { text: "hello" });
    expect(res.data.id).toBe("tweet_msw_123");
  });

  it("uploadMedia returns mocked media id when enabled", async () => {
    const buf = Buffer.from([1, 2, 3, 4, 5]);
    const res = await uploadMedia("MSW_ACCESS_TOKEN", buf, { category: "tweet_image" });
    expect(res.media_id_string).toBe("media_msw_123");
  });
});