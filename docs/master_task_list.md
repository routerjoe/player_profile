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