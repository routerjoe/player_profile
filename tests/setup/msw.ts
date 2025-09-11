import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Basic MSW handlers for X endpoints used by x-oauth.ts
export const handlers = [
  // OAuth token exchange / refresh
  http.post("https://api.twitter.com/2/oauth2/token", async () => {
    return HttpResponse.json({
      token_type: "bearer",
      expires_in: 3600,
      access_token: "MSW_ACCESS_TOKEN",
      scope: "tweet.read users.read tweet.write offline.access media.write",
      refresh_token: "MSW_REFRESH_TOKEN",
    });
  }),

  // Authenticated user info
  http.get("https://api.twitter.com/2/users/me", async () => {
    return HttpResponse.json({
      data: { id: "u_msw", name: "MSW User", username: "msw_user" },
    });
  }),

  // Post tweet
  http.post("https://api.twitter.com/2/tweets", async ({ request }: { request: Request }) => {
    // Optional: inspect payload if needed
    try {
      // @ts-ignore - node18 Request
      const body = await request.text();
      // swallow
      void body;
    } catch {}
    return HttpResponse.json({
      data: { id: "tweet_msw_123", text: "hello from msw" },
    });
  }),

  // v1.1 media upload (legacy)
  http.post("https://upload.twitter.com/1.1/media/upload.json", async () => {
    return HttpResponse.json({
      media_id_string: "media_msw_123",
    });
  }),
];

const server = setupServer(...handlers);

// Start/stop MSW around tests
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

export { server };