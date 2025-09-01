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
- [ ] Wire “Headshot” photo usage to Bio & Academics top-left headshot
  - Required: add a dedicated usage value “headshot” (or alias existing “thumbnail” to “Headshot”) across types [src/lib/photos/types.ts](src/lib/photos/types.ts), API validation [src/app/api/photos/[id]/route.ts](src/app/api/photos/%5Bid%5D/route.ts), and Dashboard selector [src/components/photos/PhotoTile.tsx](src/components/photos/PhotoTile.tsx). Render the selected image in the Bio & Academics section [src/components/sections/BioAcademics.tsx](src/components/sections/BioAcademics.tsx) at the top-left with responsive sizing.
  - Acceptance: Setting Usage=Headshot on a photo displays it on the public home page in Bio & Academics for the active player; fallback order is headshot → hero → placeholder; alt text is used; no CLS on load.
- [ ] Add Highlights grid cover image sourced from labeled photo
  - Required: use existing “banner” usage or introduce “highlights_cover” in types [src/lib/photos/types.ts](src/lib/photos/types.ts), update API allowed set [src/app/api/photos/[id]/route.ts](src/app/api/photos/%5Bid%5D/route.ts), add selector option in [src/components/photos/PhotoTile.tsx](src/components/photos/PhotoTile.tsx), and render the cover in the Highlights section [src/components/sections/Highlights.tsx](src/components/sections/Highlights.tsx) above the grid (lazy-loaded, responsive crop).
  - Acceptance: When a cover is assigned, the Highlights section shows it on /; removing/unassigning hides it; CLS remains 0 for the section.
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

- [ ] Add “Latest from the Blog” reference section on the home page (and link to full blog)
  - Required: Create a section component [`BlogTeaser.tsx`](src/components/sections/BlogTeaser.tsx) that loads published posts via adapter [`getBlogIndex()`](src/lib/adapters/public/blog.ts:10), selects the latest 3, and renders responsive cards (image, title, date/tags) linking to `/blog/[slug]`.
  - Required: Insert the section into the home page flow in [`HomePage()`](src/app/page.tsx:20) after Gallery if present, otherwise after Highlights. Include a “View all posts” CTA linking to `/blog`.
  - Required: Ensure images display for both local `/uploads/...` and remote URLs. If using Next/Image, expand domains/remotePatterns in [`next.config.js`](next.config.js) as needed; otherwise fall back to a safe `<img>` with width/height to prevent CLS.
  - Required: Add a simple global reference to the blog (e.g., footer link) in [`layout.tsx`](src/app/layout.tsx).
  - Required: Document the new section and image domain config in [`README.md`](README.md).
  - Acceptance: With ≥1 published post, the home page shows up to 3 blog cards with images and titles; each card opens `/blog/[slug]`; the CTA opens `/blog`; when no posts are published the section hides gracefully; mobile layout works (no overflow), and images render without domain errors or layout shift.

## Done

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