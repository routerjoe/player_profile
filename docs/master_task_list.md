# Master Task List

Last updated: 2025-09-07

This document is the single source of truth for project tasks. Keep sections ordered by priority. Link issues/PRs where applicable.

Source docs for context:
- [docs/player_profile_development_plan.md](docs/player_profile_development_plan.md)
- [docs/player_profile_fresh_build_spec.md](docs/player_profile_fresh_build_spec.md)
- [docs/player_profile_style_guide.md](docs/player_profile_style_guide.md)
- [README.md](README.md)

Conventions:
- Backlog = not started. Add brief description and acceptance criteria link.
- In Progress = actively being worked. Include owner.
- Done = completed and verified.

## In Progress


## Backlog


## Done
### X Integration

- [x] Definition of Done (X Integration)
  - Acceptance verified: Connect/Disconnect; tokens encrypted at rest; Post Now + Schedule; tests pass (CI green); docs updated; no Supabase.

- [x] Observability: minimal structured logs with secret scrubbing
  - Code: [src/lib/observability/logger.ts](src/lib/observability/logger.ts), route instrumentation: [src/app/api/x/auth-url/route.ts](src/app/api/x/auth-url/route.ts), [src/app/api/x/callback/route.ts](src/app/api/x/callback/route.ts), [src/app/api/x/post/route.ts](src/app/api/x/post/route.ts), [src/app/api/x/schedule/route.ts](src/app/api/x/schedule/route.ts), [src/app/api/x/retry/route.ts](src/app/api/x/retry/route.ts), [src/app/api/x/status/route.ts](src/app/api/x/status/route.ts), [src/app/api/cron/run-x-queue/route.ts](src/app/api/cron/run-x-queue/route.ts)
  - Acceptance verified: tokens/Authorization never logged; redaction patterns applied; logs useful for debugging.

- [x] Unit tests
  - Files: [tests/pkce.test.ts](tests/pkce.test.ts), [tests/crypto.test.ts](tests/crypto.test.ts), [tests/x.oauth.retry.test.ts](tests/x.oauth.retry.test.ts)
  - Acceptance verified: PKCE verifier/challenge length/charset; crypto round-trip + bad inputs; backoff and 429/5xx retries.

- [x] Dev mocking: MSW for X flows
  - Files: [tests/setup/msw.ts](tests/setup/msw.ts), [vitest.config.ts](vitest.config.ts)
  - Acceptance verified: tests use handlers; no real calls to X.

- [x] API tests with MSW for X routes
  - Files: [tests/x.api.routes.test.ts](tests/x.api.routes.test.ts), [tests/x.callback.api.test.ts](tests/x.callback.api.test.ts), [tests/x.oauth.msw.test.ts](tests/x.oauth.msw.test.ts)
  - Acceptance verified: happy paths + 401/403/429/5xx; cron queue processes and updates records correctly.

- [x] Leak tests
  - Files: [tests/leaks.test.ts](tests/leaks.test.ts)
  - Acceptance verified: no secrets in API responses or logs (tokens, refresh_token, Authorization headers).

- [x] Manual QA checklist
  - File: [docs/x_manual_test_plan.md](docs/x_manual_test_plan.md)
  - Acceptance verified: steps authored for Connect/Disconnect/Post/Schedule/Retry, expired tokens, rate limits, cron, CSRF, flags, image gating.

- [x] Migration notes
  - File: [docs/migration_x.md](docs/migration_x.md)
  - Acceptance verified: deprecation path for [src/app/api/twitter/post/route.ts](src/app/api/twitter/post/route.ts) documented; new /api/x/* endpoints referenced.

- [x] Deployment notes
  - File: [README.md](README.md)
  - Acceptance verified: Developer App setup/scopes, APP_URL/X_REDIRECT_URI alignment, Render cron cadence, volume mount for /data, token rotation notes.

- [x] Environment and dependencies
  - Added X_ENABLED and X_MEDIA_UPLOAD_ENABLED to [.env.example](.env.example); documented CRON_SECRET and CSRF usage in [README.md](README.md).

- [x] SQLite + Prisma schema and migrations
  - Extended [prisma/schema.prisma](prisma/schema.prisma) with ScheduledPost.tweetId/tweetUrl and introduced a "processing" transitional status; applied migration 20250906024137; DB path file:./data/app.db.

- [x] iron-session setup
  - Session helpers and guards wired for OAuth state and user context in API routes ([src/lib/session.ts](src/lib/session.ts)).

- [x] PKCE helpers
  - Implemented S256 verifier/challenge utilities ([src/lib/pkce.ts](src/lib/pkce.ts)).

- [x] libsodium crypto helpers
  - Token encryption-at-rest (secretbox with key derived from APP_SECRET) ([src/lib/crypto.ts](src/lib/crypto.ts)).

- [x] X OAuth + API wrapper
  - OAuth 2.0 PKCE flows, postTweet, minimal fetchWithRetry (429/5xx backoff), and env-gated image upload via legacy v1.1 endpoint ([src/lib/x-oauth.ts](src/lib/x-oauth.ts)).

- [x] API routes
  - Auth URL, callback, disconnect, post now, schedule, retry, history, status, cron runner:
    - [src/app/api/x/auth-url/route.ts](src/app/api/x/auth-url/route.ts)
    - [src/app/api/x/callback/route.ts](src/app/api/x/callback/route.ts)
    - [src/app/api/x/disconnect/route.ts](src/app/api/x/disconnect/route.ts)
    - [src/app/api/x/post/route.ts](src/app/api/x/post/route.ts)
    - [src/app/api/x/schedule/route.ts](src/app/api/x/schedule/route.ts)
    - [src/app/api/x/retry/route.ts](src/app/api/x/retry/route.ts)
    - [src/app/api/x/history/route.ts](src/app/api/x/history/route.ts)
    - [src/app/api/x/status/route.ts](src/app/api/x/status/route.ts)
    - [src/app/api/cron/run-x-queue/route.ts](src/app/api/cron/run-x-queue/route.ts)

- [x] Status enhancements + feature flag
  - Guarded by X_ENABLED; returns scopeWarning when required scopes are missing ([src/app/api/x/status/route.ts](src/app/api/x/status/route.ts)).

- [x] History with tweet links
  - Stores tweetId/tweetUrl and surfaces "Open" links in UI ([src/app/api/x/history/route.ts](src/app/api/x/history/route.ts)).

- [x] Dashboard Settings UI
  - Social connect state with handle/expiry; disconnect; Composer with optional single-image attach + 280 counter + 15s throttle; scheduler input; history (with tweet link) and retry; scopeWarning banner ([src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx)).

- [x] Scheduling + Cron processing
  - Schedules via /api/x/schedule; cron claims items atomically (scheduled→processing), posts, records tweet link, and marks posted/failed; crash-safe revert for stuck processing and 90-day retention cleanup ([src/app/api/cron/run-x-queue/route.ts](src/app/api/cron/run-x-queue/route.ts)).

- [x] Preferences API
  - Read/write "Auto-share blog posts to X" ([src/app/api/x/prefs/route.ts](src/app/api/x/prefs/route.ts)).

- [x] Security and resilience
  - CSRF double-submit cookie with /api/csrf, x-csrf-token on sensitive POSTs; no tokens returned; backoff in core X calls ([src/app/api/csrf/route.ts](src/app/api/csrf/route.ts), [src/lib/security/csrf.ts](src/lib/security/csrf.ts)).

- [x] Validation (Zod)
  - Schemas for post/schedule/retry and enforced in routes ([src/lib/validation/x.ts](src/lib/validation/x.ts)).

- [x] ENV invariants + flags
  - Centralized env loader/assertions ([src/lib/env.ts](src/lib/env.ts)).

- [x] CI pipeline
  - Ensures Prisma generate and migration deploy in CI before lint/typecheck/tests (package scripts and workflow).

- [x] Composer safeguards
  - Throttle to 1 post per 15s; disable when empty or >280; live char counter (UI).

- [x] Accessibility audit (WCAG AA) across public pages
  - Code: [src/app/layout.tsx](src/app/layout.tsx), [src/app/page.tsx](src/app/page.tsx), [src/app/globals.css](src/app/globals.css), [src/components/photos/Uploader.tsx](src/components/photos/Uploader.tsx), [src/components/sections/Hero.tsx](src/components/sections/Hero.tsx), [src/components/sections/GalleryClient.tsx](src/components/sections/GalleryClient.tsx), [src/components/sections/Highlights.tsx](src/components/sections/Highlights.tsx), [src/components/sections/BioAcademics.tsx](src/components/sections/BioAcademics.tsx), [src/app/blog/page.tsx](src/app/blog/page.tsx), [src/app/blog/%5Bslug%5D/page.tsx](src/app/blog/%5Bslug%5D/page.tsx)
  - Acceptance verified:
    - Skip link present and styled; main landmark present on key pages
    - Decorative overlays marked aria-hidden
    - Uploader uses aria-live=polite for progress/errors
    - Focus styles visible; tab order and modal focus trap behave correctly in Gallery
    - Alt text present or intentionally decorative for imagery

- [x] Optimize for mobile browsers (responsive layout, tap targets, viewport meta, avoid CLS/LCP regressions)
  - Code: [src/app/layout.tsx](src/app/layout.tsx), [src/components/ui/Button.tsx](src/components/ui/Button.tsx), [src/components/sections/Hero.tsx](src/components/sections/Hero.tsx), [src/components/sections/Highlights.tsx](src/components/sections/Highlights.tsx), [src/components/sections/BlogTeaser.tsx](src/components/sections/BlogTeaser.tsx), [src/app/blog/page.tsx](src/app/blog/page.tsx), [src/app/blog/%5Bslug%5D/page.tsx](src/app/blog/%5Bslug%5D/page.tsx)
  - Acceptance verified:
    - Viewport configured; 44×44+ tap targets via shared Button primitives
    - Image sizes/priority tuned to avoid CLS across hero, highlights, blog cards and detail
    - Layouts responsive with container tokens and section spacing

- [x] Performance pass (images, caching, bundle size) with measurable targets
  - Code: sizes added to Next/Image across public sections; external/SVG images remain plain img by design; blog pages use ISR revalidate=300; overlay opacity adjusted for contrast; remotePatterns already configured in next.config
  - Acceptance targets:
    - Lighthouse: Accessibility ≥ 90, Best Practices ≥ 90 (run locally against http://localhost:3000)
    - CLS minimized by explicit width/height/sizes on images; no layout shift observed during manual checks
    - Blog pages statically rendered with periodic revalidation (5 min)

- [x] Establish master task list and integrate with built-in task tracker
  - Notes:
    - Synchronized with built-in task tracker; this file remains the source of truth.

- [x] Add API test for Twitter post route
  - Code: [tests/twitter.post.test.ts](tests/twitter.post.test.ts), [src/app/api/twitter/post/route.ts](src/app/api/twitter/post/route.ts)
  - Acceptance verified:
    - Missing/short text returns 400
    - Valid text returns stub tweet id and echoes optional slug/title
    - Invalid JSON request body handled as 400
    - npm run test passes

- [x] Add tests for dashboard blog storage
  - Code: [tests/blogStorage.test.ts](tests/blogStorage.test.ts), [src/lib/dashboard/blogStorage.ts](src/lib/dashboard/blogStorage.ts)
  - Acceptance verified:
    - Raw/valid index persisted with localStorage
    - Zod validation surfaces errors
    - upsertPost updates/adds by slug; removePost deletes by slug
    - import/export round-trips JSON; subscribe callback fires on storage changes
    - npm run test passes

- [x] Polish Highlights uploader UX (per-row error messages, retry button)
  - Code: [src/components/photos/Uploader.tsx](src/components/photos/Uploader.tsx)
  - Acceptance verified:
    - Per-row error messages are displayed inline
    - Retry button added per row; resets to pending and re-attempts upload
    - Polite aria-live region announces progress/errors for screen readers
    - Controls remain keyboard accessible with ≥44×44 targets

- [x] Mobile/a11y foundations: viewport meta + skip link
  - Code: [src/app/layout.tsx](src/app/layout.tsx), [src/app/page.tsx](src/app/page.tsx), [src/app/globals.css](src/app/globals.css)
  - Acceptance verified:
    - Viewport configured (width=device-width, initial-scale=1) via Next viewport export
    - Skip to content link targets #main
    - No regressions observed

- [x] Address npm audit critical vulnerability (Next.js)
  - Code: [package.json](package.json), [next.config.js](next.config.js)
  - Acceptance verified:
    - Upgraded next to ^14.2.32; eslint-config-next aligned
    - npm install shows 0 vulnerabilities; npm audit report cleared
    - Typecheck and tests pass locally (npm run typecheck, npm run test)

- [x] Blog images rendering — hero on detail + index thumbnails
  - Code: [src/app/blog/[slug]/page.tsx](src/app/blog/%5Bslug%5D/page.tsx), [src/app/blog/page.tsx](src/app/blog/page.tsx), [next.config.js](next.config.js)
  - Acceptance verified:
    - /blog shows thumbnails when heroImage is set
    - /blog/[slug] renders heroImage for local /uploads and remote/SVG via fallback img with no Next/Image domain errors and no layout shift
- [x] “Latest from the Blog” home section + footer link
  - Code: [src/components/sections/BlogTeaser.tsx](src/components/sections/BlogTeaser.tsx), [src/app/page.tsx](src/app/page.tsx), [src/app/layout.tsx](src/app/layout.tsx)
  - Acceptance verified:
    - Section displays when ≥1 post is published and hides when none
    - Cards link to /blog/[slug]; “View all posts” CTA links to /blog; mobile layout verified
- [x] Headshot image wired to Bio & Academics top-left
  - Code: [src/lib/photos/types.ts](src/lib/photos/types.ts), [src/app/api/photos/[id]/route.ts](src/app/api/photos/%5Bid%5D/route.ts), [src/components/photos/PhotoTile.tsx](src/components/photos/PhotoTile.tsx), [src/lib/photos/service.ts](src/lib/photos/service.ts), [src/components/sections/BioAcademics.tsx](src/components/sections/BioAcademics.tsx)
  - Acceptance verified:
    - Setting Usage=Headshot on a photo shows it in Bio & Academics top-left; fallback order headshot → hero → placeholder
    - Alt text used; no CLS observed
- [x] Highlights grid cover image (labeled photo)
  - Code: [src/lib/photos/types.ts](src/lib/photos/types.ts), [src/app/api/photos/[id]/route.ts](src/app/api/photos/%5Bid%5D/route.ts), [src/components/photos/PhotoTile.tsx](src/components/photos/PhotoTile.tsx), [src/components/sections/Highlights.tsx](src/components/sections/Highlights.tsx), [src/app/page.tsx](src/app/page.tsx)
  - Acceptance verified:
    - Cover labeled as “highlights_cover” displays above the Highlights grid on /; removing the label hides the cover
    - No layout shift observed
- [x] Gallery section after Highlights (labeled “gallery”) with accessible modal
  - Code: [src/components/sections/Gallery.tsx](src/components/sections/Gallery.tsx), [src/components/sections/GalleryClient.tsx](src/components/sections/GalleryClient.tsx), [src/lib/photos/service.ts](src/lib/photos/service.ts), [src/app/page.tsx](src/app/page.tsx)
  - Acceptance verified:
    - At least one “gallery” photo renders in a responsive grid; preview supports keyboard nav (←/→), ESC to close, focus trap; images lazy-load
- [x] Highlights video upload (support local MP4/MOV/WebM with progress and validation)
  - Code: [src/app/api/media/upload/route.ts](src/app/api/media/upload/route.ts), [src/app/dashboard/highlights/page.tsx](src/app/dashboard/highlights/page.tsx), [README.md](README.md)
  - Acceptance verified:
    - Uploading a local .mp4 (≤100MB) stores the file and returns a /uploads URL
    - Oversize files return 413 with a clear message (MEDIA_MAX_UPLOAD_MB configurable)
    - Unsupported types return 400
    - Dashboard uploader shows progress and friendly errors
- [x] Create .env.example and document environment variables in README
  - Code: [.env.example](.env.example), [README.md](README.md)
  - Acceptance verified:
    - .env.example includes AUTH_SECRET, NEXT_PUBLIC_DEFAULT_PLAYER_ID, optional NEXT_PUBLIC_PROFILE_JSON_URL, NEXT_PUBLIC_BLOG_JSON_URL, and MEDIA_MAX_UPLOAD_MB
    - README contains an Environment Variables section with references to usage locations
- [x] CI setup (lint, type-check, tests on PRs)
  - Code: [.github/workflows/ci.yml](.github/workflows/ci.yml), [package.json](package.json), [vitest.config.ts](vitest.config.ts)
  - Acceptance verified:
    - Workflow runs on push/PR to main and executes npm run ci (lint, typecheck, tests)
- [x] Initial tests with Vitest (media upload API + public adapters)
  - Code: [tests/media.upload.test.ts](tests/media.upload.test.ts), [tests/adapters.public.test.ts](tests/adapters.public.test.ts)
  - Acceptance verified:
    - Local: npm run test passes
    - CI: tests executed in workflow
- [x] Photos Library — Local FS + JSON (Dashboard + API)
  - API: GET/POST [src/app/api/photos/route.ts](src/app/api/photos/route.ts), PATCH/DELETE [src/app/api/photos/[id]/route.ts](src/app/api/photos/%5Bid%5D/route.ts)
  - Library: Types [src/lib/photos/types.ts](src/lib/photos/types.ts), JSON DB [src/lib/photos/db.ts](src/lib/photos/db.ts), FS helpers [src/lib/photos/fs.ts](src/lib/photos/fs.ts), Service [src/lib/photos/service.ts](src/lib/photos/service.ts), Dev guards [src/lib/auth/guards.ts](src/lib/auth/guards.ts)
  - UI: Dashboard page [src/app/dashboard/photos/page.tsx](src/app/dashboard/photos/page.tsx), Components [src/components/photos/Uploader.tsx](src/components/photos/Uploader.tsx), [src/components/photos/PhotoTile.tsx](src/components/photos/PhotoTile.tsx)
  - Acceptance verified:
    - Upload multiple images and show immediately in grid
    - Edit Title/Alt/Usage and Save
    - Delete removes disk file and JSON record
    - Exactly one Hero per player (auto-unset previous)
    - Persistence to /data/photos.json and files in /public/uploads/{playerId}
    - No Supabase/external storage
    - Public helper getHeroPhoto() available

Imported from "All-Sections Checklist (Parity with Localhost:3000)" in docs/player_profile_fresh_build_spec.md:
- [x] Hero (name, positions/class, badges, CTAs)
- [x] Quick Stats Strip
- [x] Bio & Academics
- [x] Highlights (Video) Grid
- [x] Schedule (Table)
- [x] Calendar (Month/Week view derived from Schedule)
- [x] Performance Measurables (Card + Table)
- [x] Contact + Socials (email, Twitter handle)
- [x] Recruiting Packet (optional)
- [x] SEO metadata

Notes:
- When moving items to Done, ensure functional verification and update any related documentation.
- Keep this file in sync with the built-in task tracker entries.