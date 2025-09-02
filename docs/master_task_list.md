# Master Task List

Last updated: 2025-09-02

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


- [-] Accessibility audit (WCAG AA) across public pages
  - Changes implemented:
    - Viewport meta export added in [src/app/layout.tsx](src/app/layout.tsx)
    - Skip link “Skip to content” added and styled; target set on main landmark in [src/app/layout.tsx](src/app/layout.tsx) and [src/app/globals.css](src/app/globals.css)
    - Aria-live (polite) announcements for upload progress/errors added to [src/components/photos/Uploader.tsx](src/components/photos/Uploader.tsx)
    - Main landmark role set on homepage in [src/app/page.tsx](src/app/page.tsx)
    - Next/Image usage and sizes improved in [src/components/sections/Hero.tsx](src/components/sections/Hero.tsx) and [src/components/sections/Highlights.tsx](src/components/sections/Highlights.tsx) to avoid CLS
  - Next steps for completion:
    - Keyboard sweep across public pages (tab order, focus rings, focus traps)
    - Contrast verification for text over hero overlays and cards (AA)
    - Alt text audit for all imagery (meaningful alt or aria-hidden when decorative)

- [-] Optimize for mobile browsers (responsive layout, tap targets, viewport meta, avoid CLS/LCP regressions)
  - Changes implemented:
    - Viewport meta configured via Next export in [src/app/layout.tsx](src/app/layout.tsx)
    - 44×44+ tap targets through shared button primitives in [src/components/ui/Button.tsx](src/components/ui/Button.tsx)
    - Image sizes/priority tuned for hero and highlights to reduce CLS in [src/components/sections/Hero.tsx](src/components/sections/Hero.tsx) and [src/components/sections/Highlights.tsx](src/components/sections/Highlights.tsx)
  - Next steps for completion:
    - Verify layouts at 360/768/1280/1536; adjust spacing if needed
    - Validate scroll/overscroll behavior, avoid double scroll containers on mobile
## Backlog

- [x] Consolidate and import outstanding tasks from source docs listed above





## Done

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