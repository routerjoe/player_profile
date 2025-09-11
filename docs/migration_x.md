# Migration Notes — Deprecating /api/twitter/post in favor of /api/x/*

Summary
- The legacy Twitter stub endpoint at /api/twitter/post has been removed and replaced by the new X Integration endpoints under /api/x/*.
- New capabilities: OAuth 2.0 PKCE connect/disconnect, Post Now (text + optional image), scheduling with cron processing, retry, preferences, observability, and CSRF protection.

Impacted Files (reference)
- Deprecated (legacy stub):
  - [src/app/api/twitter/post/route.ts](src/app/api/twitter/post/route.ts)
- New X Integration (server routes):
  - [src/app/api/x/auth-url/route.ts](src/app/api/x/auth-url/route.ts)
  - [src/app/api/x/callback/route.ts](src/app/api/x/callback/route.ts)
  - [src/app/api/x/disconnect/route.ts](src/app/api/x/disconnect/route.ts)
  - [src/app/api/x/post/route.ts](src/app/api/x/post/route.ts)
  - [src/app/api/x/schedule/route.ts](src/app/api/x/schedule/route.ts)
  - [src/app/api/x/retry/route.ts](src/app/api/x/retry/route.ts)
  - [src/app/api/x/history/route.ts](src/app/api/x/history/route.ts)
  - [src/app/api/x/status/route.ts](src/app/api/x/status/route.ts)
  - [src/app/api/cron/run-x-queue/route.ts](src/app/api/cron/run-x-queue/route.ts)
- Client adapter (Dashboard):
  - [src/lib/adapters/dashboard/x.ts](src/lib/adapters/dashboard/x.ts)
- Security/Utilities:
  - CSRF: [src/app/api/csrf/route.ts](src/app/api/csrf/route.ts), [src/lib/security/csrf.ts](src/lib/security/csrf.ts)
  - OAuth/Posting: [src/lib/x-oauth.ts](src/lib/x-oauth.ts)
  - Logger: [src/lib/observability/logger.ts](src/lib/observability/logger.ts)

Timeline
- Effective now: /api/twitter/post is removed.
- Consumers must use /api/x/post and the related /api/x/* endpoints.

Key Differences

1) Endpoint and Auth
- Old: POST /api/twitter/post (stubbed, no real OAuth)
- New: POST /api/x/post (real X OAuth 2.0 with PKCE; user must “Connect X” first via /api/x/auth-url → /api/x/callback)
- Status and connect state available via GET /api/x/status

2) Security and CSRF
- New routes require CSRF for sensitive POSTs:
  - Obtain token: GET /api/csrf → { token } + cookie; send header x-csrf-token with subsequent POSTs
  - References: [src/app/api/csrf/route.ts](src/app/api/csrf/route.ts), [src/lib/security/csrf.ts](src/lib/security/csrf.ts)

3) Request/Response Contract
- Old (legacy stub):
  - Request: JSON { text, slug?, title? }
  - Response: 200 with a stub tweet id and echoes of slug/title
- New (X Integration):
  - Request (text only): JSON { text }
  - Request (text + image): multipart/form-data with fields: text, file (single image; gated by X_MEDIA_UPLOAD_ENABLED)
  - Response: 200 { ok: true, tweet: { id, text } }
  - Errors are standardized (401/403/429/5xx), surfaced with friendly messages in the UI adapter [src/lib/adapters/dashboard/x.ts](src/lib/adapters/dashboard/x.ts)

4) Scheduling and Retry
- New capabilities:
  - Schedule: POST /api/x/schedule { text, scheduledFor? }
  - Retry: POST /api/x/retry { id }
  - Cron queue processor: POST /api/cron/run-x-queue (optional x-cron-secret header if configured)
  - History and status endpoints provide visibility

5) Environment Variables and Deployment
- Required variables (see .env.example and README):
  - X_CLIENT_ID, X_CLIENT_SECRET, X_REDIRECT_URI, APP_URL, APP_SECRET, SESSION_PASSWORD
  - X_ENABLED (feature flag), X_MEDIA_UPLOAD_ENABLED (image gating)
- Persistence: SQLite DB must be on a persistent volume (/data). See deployment notes in README.

Migration Steps (Client Side)

- If you are calling the legacy stub from custom code:
  1) Replace POST /api/twitter/post with POST /api/x/post.
  2) Before POSTs, call GET /api/csrf and include the x-csrf-token header (and cookie).
  3) If attaching an image, send multipart/form-data with fields text and file; ensure X_MEDIA_UPLOAD_ENABLED is true server-side.
  4) Handle standardized errors: 401/403/429/5xx. The adapter [src/lib/adapters/dashboard/x.ts](src/lib/adapters/dashboard/x.ts) maps them to user-friendly messages.
  5) Consider scheduling via /api/x/schedule or using retry on failures.

- If using the Dashboard Settings page UI:
  - No code changes required; the UI already uses the new adapter and endpoints. Use the “Connect X” button, then Post/Schedule/Retry within the page [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx).

Backwards Compatibility

- The legacy /api/twitter/post route remains temporarily for existing tests and example usage:
  - Reference: [src/app/api/twitter/post/route.ts](src/app/api/twitter/post/route.ts)
  - It will be removed after the X integration is fully validated. Plan to stop using it and update any tests to target /api/x/*.

Testing

- Unit tests:
  - [tests/pkce.test.ts](tests/pkce.test.ts)
  - [tests/crypto.test.ts](tests/crypto.test.ts)
  - [tests/x.oauth.retry.test.ts](tests/x.oauth.retry.test.ts)
- Integration/MSW:
  - [tests/x.oauth.msw.test.ts](tests/x.oauth.msw.test.ts)
  - [tests/x.api.routes.test.ts](tests/x.api.routes.test.ts)
  - [tests/x.callback.api.test.ts](tests/x.callback.api.test.ts)
- Leak/Redaction:
  - [tests/leaks.test.ts](tests/leaks.test.ts)

Operational Notes

- Image uploads use the legacy v1.1 media/upload endpoint. OAuth 2.0 bearer acceptance varies by environment/account. If you see 401/403 on media upload, disable X_MEDIA_UPLOAD_ENABLED to allow text-only posts.
- Ensure cron is configured for scheduled posts. See README “Cron Setup for X Queue Processing”.