# Master Task List

Last updated: 2025-09-01

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

- [-] Establish master task list and integrate with built-in task tracker

## Backlog

- [x] Consolidate and import outstanding tasks from source docs listed above
- [ ] Scan codebase for TODO/FIXME and convert into backlog items
- [ ] Define acceptance criteria per feature/section and link to specs
- [ ] Set up CI: lint, type-check, and tests on pull requests
- [ ] Create .env.example and document required environment variables in README
- [ ] Add basic API route tests (media upload, twitter post, blog storage)
- [ ] Accessibility audit (WCAG AA) across public pages
- [ ] Performance pass (images, caching, bundle size) with measurable targets
- [ ] Optimize for mobile browsers (responsive layout, tap targets, viewport meta, avoid CLS/LCP regressions)
- [ ] Implement Gallery section after Highlights using photos labeled “gallery”
  - Required: fetch player photos via service [src/lib/photos/service.ts](src/lib/photos/service.ts) filtering usage="gallery"; create new section component at [src/components/sections/Gallery.tsx](src/components/sections/Gallery.tsx) and include it in the home page flow after Highlights in [src/app/page.tsx](src/app/page.tsx). Provide a responsive grid with modal preview, keyboard navigation, and proper alt text.
  - Acceptance: At least one “gallery” photo renders in a responsive grid at runtime; preview is accessible (focus trap, ESC to close); images are optimized and lazy-loaded.

- [ ] Fix Highlights video upload (support local MP4/MOV/WebM with progress and validation)
  - Required: Update the upload API to robustly handle large video files and validate video MIME types in [POST()](src/app/api/media/upload/route.ts:26); add a configurable size limit (e.g., MEDIA_MAX_UPLOAD_MB) and return the public URL under /uploads with proper headers.
  - Required: Enhance the Dashboard Highlights uploader [uploadVideo()](src/app/dashboard/highlights/page.tsx:53) to surface user-friendly errors (type/size/network), respect the configured max size, show progress reliably, and set videoUrl on success.
  - Required: Update documentation in [README.md](README.md) describing supported formats, size limits, and the local storage path, and include a small sample clip in testdata for verification.
  - Acceptance: Uploading a local .mp4 (≤100MB) from the Highlights dashboard successfully stores the file, updates the row’s Video URL, and clicking the Highlight card opens/plays the uploaded asset from /uploads; invalid type or oversize attempts show a clear error without crashing.

- [ ] Fix blog post images not displaying (hero image and index thumbnail)
  - Required: Ensure the blog post page renders heroImage reliably for local uploads under /uploads and any remote URLs.
    - Update rendering in [`page.tsx`](src/app/blog/%5Bslug%5D/page.tsx) to use an approach that works for both local and remote images (Next/Image with correct config or fallback to img).
    - If using Next/Image, extend [`next.config.js`](next.config.js) images.remotePatterns/domains to cover self-hosted and expected CDNs; avoid blocked-domain errors.
    - Set width/height or sizes to prevent CLS.
  - Required: Show a hero thumbnail on the blog index when heroImage is present in each post; update [`page.tsx`](src/app/blog/page.tsx) to include a small preview image.
  - Required: Verify the Dashboard editor writes the selected MediaPicker URL into heroImage and persists it in the draft/published index: [`page.tsx`](src/app/dashboard/blog/page.tsx) and [`MediaPicker.tsx`](src/components/dashboard/MediaPicker.tsx).
  - Required: Document supported image sources and any domain config steps in [`README.md`](README.md).
  - Acceptance: After uploading an image via MediaPicker and setting it as the post’s Hero Image, publishing the post results in:
    - /blog/[slug] displays the hero image at the top without errors.
    - /blog shows a thumbnail for that post.
    - Works with self-hosted /uploads and remote URLs; no Next.js image domain warnings; no layout shift.


## Done

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