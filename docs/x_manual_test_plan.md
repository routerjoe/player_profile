# X Integration — Manual Test Plan

Scope
- Validate end-to-end X (Twitter) integration flows in Dashboard → Settings:
  - Connect (OAuth 2.0 PKCE), Disconnect
  - Post Now (text +/- single image when enabled)
  - Schedule and retry (with cron)
  - Preferences (auto-share)
  - Observability (structured logs with redaction)
  - Security: CSRF, feature flags, secret redaction, tokens encrypted at rest
- Source references:
  - Setup guide: [docs/connect_x.md](docs/connect_x.md)
  - Routes: [src/app/api/x/status/route.ts](src/app/api/x/status/route.ts), [src/app/api/x/auth-url/route.ts](src/app/api/x/auth-url/route.ts), [src/app/api/x/callback/route.ts](src/app/api/x/callback/route.ts), [src/app/api/x/disconnect/route.ts](src/app/api/x/disconnect/route.ts), [src/app/api/x/post/route.ts](src/app/api/x/post/route.ts), [src/app/api/x/schedule/route.ts](src/app/api/x/schedule/route.ts), [src/app/api/x/retry/route.ts](src/app/api/x/retry/route.ts), [src/app/api/x/history/route.ts](src/app/api/x/history/route.ts), [src/app/api/cron/run-x-queue/route.ts](src/app/api/cron/run-x-queue/route.ts)
  - Observability: [src/lib/observability/logger.ts](src/lib/observability/logger.ts)
  - Validation schemas: [src/lib/validation/x.ts](src/lib/validation/x.ts)
  - CSRF: [src/app/api/csrf/route.ts](src/app/api/csrf/route.ts), [src/lib/security/csrf.ts](src/lib/security/csrf.ts)
  - OAuth/Posting lib: [src/lib/x-oauth.ts](src/lib/x-oauth.ts)
  - UI surface: [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx)

Prerequisites
- Local dev server running:
  - Copy .env.example → .env.local and set variables (see [README.md](README.md) and [docs/connect_x.md](docs/connect_x.md))
  - Required:
    - X_CLIENT_ID, X_CLIENT_SECRET, X_REDIRECT_URI, APP_URL, APP_SECRET, SESSION_PASSWORD
    - X_ENABLED=true (default)
  - Optional:
    - X_MEDIA_UPLOAD_ENABLED=true (enables single-image upload in Post Now; see caveats in [docs/connect_x.md](docs/connect_x.md))
    - CRON_SECRET=your-value (recommended if testing cron endpoint with protection)
- DB and schema:
  - prisma migrate has been applied; local SQLite file under data/ or prisma/data/
- Test account:
  - Ability to authorize an X Developer App for OAuth 2.0 scopes:
    tweet.read users.read tweet.write offline.access media.write

Test Matrix (environment switches)
- X_ENABLED
  - true: routes enabled
  - false: status returns 503 and client should surface “disabled”
- X_MEDIA_UPLOAD_ENABLED
  - false (default): image attachments are rejected; text-only posts allowed
  - true: image attachment path enabled; note v1.1 media upload may not accept OAuth 2.0 bearer in all environments (see behavior notes)

Conventions used below
- “Dashboard Settings” refers to /dashboard/settings page in the running app
- Use your browser dev tools to observe network calls and responses
- For manual curl tests, substitute localhost URL or your deployed URL; include x-cron-secret if configured

1) Authentication and Status
- Unauthenticated status
  - Step:
    - curl -i http://localhost:3000/api/x/status
  - Expect:
    - HTTP 401 with JSON: { "error": "Unauthorized" }
  - References: [src/app/api/x/status/route.ts](src/app/api/x/status/route.ts)

- Authenticated status (connected=false)
  - Step:
    - Register/login locally and navigate to /dashboard/settings
    - Observe “Social Connections — X” card
  - Expect:
    - “Connect X” button visible
    - GET /api/x/status returns { connected: false }
    - If X_ENABLED=false, expect HTTP 503 instead with clear message

2) Connect (OAuth 2.0 PKCE)
- Happy path
  - Steps:
    - On Dashboard Settings, click “Connect X”
    - You should be redirected to X OAuth
    - Approve with the requested scopes
    - You are redirected back to /dashboard/settings
  - Expect:
    - After redirect, GET /api/x/status returns { connected: true, handle?, tokenExpiresAt? }
    - UI shows “Connected as @handle” if permitted by scopes
  - References: [src/app/api/x/auth-url/route.ts](src/app/api/x/auth-url/route.ts), [src/app/api/x/callback/route.ts](src/app/api/x/callback/route.ts)

- Error path (server mis-config)
  - Steps:
    - Temporarily remove X_CLIENT_ID or X_REDIRECT_URI
    - Click “Connect X”
  - Expect:
    - 500 “Server not configured for X OAuth” on /api/x/auth-url
    - UI shows standardized error toast/message

- State mismatch (edge case)
  - Steps:
    - Initiate auth
    - Before approving, clear site cookies, then approve
  - Expect:
    - Callback returns 400 with { error: "State mismatch" }
    - UI remains unconnected
  - References: [src/app/api/x/callback/route.ts](src/app/api/x/callback/route.ts)

3) Disconnect
- Steps:
  - While connected, click “Disconnect” and confirm in the custom modal
- Expect:
  - POST /api/x/disconnect returns 200
  - GET /api/x/status returns { connected: false }
  - History still displays previous items
- References: [src/app/api/x/disconnect/route.ts](src/app/api/x/disconnect/route.ts)

4) Post Now — Text only (X_MEDIA_UPLOAD_ENABLED=false)
- Steps:
  - Ensure connected and X_MEDIA_UPLOAD_ENABLED is unset or false
  - In the Composer, enter text ≤ 280 chars
  - Click “Post to X”
- Expect:
  - POST /api/x/post returns { ok: true, tweet: { id, text } }
  - UI shows success toast and clears composer
  - History table includes a “posted” row with Tweet link
- Validation/UX:
  - Empty text blocked client-side
  - >280 chars blocked client-side with visible warning
  - Throttle: button disabled if last post was <15s ago
- References: [src/app/api/x/post/route.ts](src/app/api/x/post/route.ts)

5) Post Now — With image (X_MEDIA_UPLOAD_ENABLED=true)
- Steps:
  - Set X_MEDIA_UPLOAD_ENABLED=true and restart dev server
  - Attach an image file and post
- Expect:
  - If media upload accepted in your environment:
    - 200 with ok:true and posted tweet; history includes tweet link
  - If media upload not accepted by X v1.1 for OAuth2 bearer in your env:
    - 4xx from media upload path; UI shows user-friendly error (consider disabling feature in production)
- References: [src/app/api/x/post/route.ts](src/app/api/x/post/route.ts), [docs/connect_x.md](docs/connect_x.md)

6) Schedule
- Schedule “now”
  - Steps:
    - Leave “Schedule time” blank, click “Schedule”
  - Expect:
    - POST /api/x/schedule returns { ok:true, status:"scheduled", scheduledFor:null or near-now }
    - History shows “scheduled” item

- Schedule in the future (e.g., +5 minutes)
  - Steps:
    - Pick a future datetime in the scheduler
    - Click “Schedule”
  - Expect:
    - History shows “scheduled” with a future time

- Cron processing (manual)
  - Steps:
    - Trigger the cron endpoint:
      - If CRON_SECRET set: curl -H "x-cron-secret: YOUR_CRON_SECRET" http://localhost:3000/api/cron/run-x-queue
      - Or run: npm run cron:x (reads CRON_SECRET)
  - Expect:
    - Items eligible for posting are claimed → posted or failed with errorMsg
    - History rows update; posted rows include Tweet link
  - References: [src/app/api/cron/run-x-queue/route.ts](src/app/api/cron/run-x-queue/route.ts)

7) Retry
- Steps:
  - Create a failing item (e.g., temporarily break credentials or schedule when X_ENABLED=false, then re-enable)
  - Click “Retry” on a failed or scheduled item
- Expect:
  - POST /api/x/retry returns { ok:true }
  - Next cron run should attempt and update status accordingly
- References: [src/app/api/x/retry/route.ts](src/app/api/x/retry/route.ts)

8) Preferences — Auto-share blog to X
- Steps:
  - Toggle the “Auto-share new blog posts to X” preference
  - Note: current system stores boolean; future blog publish hook may read it
- Expect:
  - PATCH /api/x/prefs echoes updated value
  - UI shows success toast; toggle persists on refresh
- References: [src/app/api/x/prefs/route.ts](src/app/api/x/prefs/route.ts)

9) CSRF Protection
- Negative test (no token)
  - Steps:
    - Attempt POST to /api/x/post without x-csrf-token and without first fetching /api/csrf
      - curl -i -X POST http://localhost:3000/api/x/post -H "content-type: application/json" -d '{"text":"hi"}'
  - Expect:
    - 403 Forbidden with clear error message
- Positive test
  - Steps:
    - GET /api/csrf to receive cookie and token
    - Send POST with header x-csrf-token and include cookie
  - Expect:
    - 200 OK (assuming other preconditions met)
- References: [src/app/api/csrf/route.ts](src/app/api/csrf/route.ts), [src/lib/security/csrf.ts](src/lib/security/csrf.ts)

10) Feature Flags
- X_ENABLED=false
  - Steps:
    - Set X_ENABLED=false and restart server
    - Visit Dashboard Settings and/or call GET /api/x/status
  - Expect:
    - 503 from status route with “X integration disabled”
    - UI surfaces disabled state and hides composer actions
- References: [src/app/api/x/status/route.ts](src/app/api/x/status/route.ts)

11) Logging and Secret Redaction
- Steps:
  - Tail the server logs while performing Connect, Post, Schedule, Cron
- Expect:
  - Structured single-line JSON log entries with events like:
    - x.auth_url.issued, x.callback.connected, x.post.request, x.post.posted, x.status.ok, cron start/done
  - No secrets (access_token, refresh_token, Authorization headers) present
  - “Bearer …” tokens are redacted in string values
- References: [src/lib/observability/logger.ts](src/lib/observability/logger.ts)

12) Tokens Encrypted at Rest
- Steps:
  - Inspect SocialAccount table rows in the SQLite DB
  - Fields accessTokenEnc, refreshTokenEnc should contain binary/bytes; no plaintext tokens stored
- References: [prisma/schema.prisma](prisma/schema.prisma)

13) Error Mapping UX
- Scenarios:
  - 401/403/429/5xx from API routes (simulate by toggling flags or temporarily breaking config)
- Expect:
  - UI displays standardized, user-friendly error messages and non-blocking toasts
- References: [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx), [src/app/api/x/post/route.ts](src/app/api/x/post/route.ts)

14) Accessibility
- Checks:
  - Disconnect modal is keyboard accessible; focus trap; ESC closes; backdrop click closes
  - Composer controls have visible focus states; char counter announces limits
  - Toasts announced via aria-live region
- References: [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx)

15) Definition of Done Verification
- Connect/Disconnect works; tokens are encrypted at rest; Post Now + Schedule work (with cron); UI error mapping and accessibility verified; no Supabase or external DB used
- Tests:
  - Run npm run ci to ensure lint, typecheck, tests pass
  - Files for test coverage (reference):
    - Unit: [tests/pkce.test.ts](tests/pkce.test.ts), [tests/crypto.test.ts](tests/crypto.test.ts), [tests/x.oauth.retry.test.ts](tests/x.oauth.retry.test.ts)
    - Integration/MSW: [tests/x.oauth.msw.test.ts](tests/x.oauth.msw.test.ts), [tests/x.api.routes.test.ts](tests/x.api.routes.test.ts), [tests/x.callback.api.test.ts](tests/x.callback.api.test.ts)
    - Leak redaction: [tests/leaks.test.ts](tests/leaks.test.ts)

Notes and Caveats
- Image upload path uses X v1.1 media/upload; OAuth 2.0 bearer acceptance varies by account/app
  - If you encounter 401/403 on media upload in production, disable X_MEDIA_UPLOAD_ENABLED to allow text-only posting
- For local manual simulations of rate limits (429) and transient 5xx, rely on tests under tests/ and MSW handlers or temporarily instrument the library in [src/lib/x-oauth.ts](src/lib/x-oauth.ts)