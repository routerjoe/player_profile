# Player Profile

Modern Next.js + TypeScript + Tailwind app.

## Milestone C — Adapters + Validation
- Public read adapter and Zod validation implemented.
- Dashboard storage adapter stubs added.
- Home route refactored to load data via adapter.

## Adapters
- Public: getPublicProfile()
  - Reads NEXT_PUBLIC_PROFILE_JSON_URL if set (fetch with revalidate: 60)
  - Validates with Zod and falls back to local sample on error
- Dashboard: toStorageProfile(), fromStorageProfile()

## Files
- src/lib/adapters/public/profile.ts
- src/lib/adapters/dashboard/profile.ts
- src/lib/validation/schemas.ts
- src/lib/sample/profile.ts
- src/app/page.tsx

## Environment
1) Optionally create .env.local:
   NEXT_PUBLIC_PROFILE_JSON_URL=https://example.com/profile.json
2) The endpoint must return JSON matching the Profile schema.
3) If unset or invalid, the app uses the bundled sample profile.

## Development
- npm install
- npm run dev
- Open http://localhost:3000

## Acceptance (Milestone C)
- UI renders identically
- Data flows only through adapter
- Zod validation guards inputs; no runtime errors or CLS
## Milestone D — Dashboard MVP
- Dashboard shell and tabs implemented in [src/app/dashboard/layout.tsx](src/app/dashboard/layout.tsx) with redirect in [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx).
- LocalStorage-backed draft store with Zod guard in [src/lib/dashboard/storage.ts](src/lib/dashboard/storage.ts).
- Profile, Stats, Highlights, Schedule, Photos, Performance, Blog, and Settings tabs scaffolded. Blog authoring was expanded in Milestone E.

## Milestone E — Blog + Media Library + Twitter Integration
- Types: Blog types added in [src/lib/types.ts](src/lib/types.ts).
- Validation: Blog Zod schemas in [src/lib/validation/blog.ts](src/lib/validation/blog.ts).
- Sample data: Blog sample index in [src/lib/sample/blog.ts](src/lib/sample/blog.ts).
- Public adapters and routes:
  - Adapter in [src/lib/adapters/public/blog.ts](src/lib/adapters/public/blog.ts)
  - Blog index route [src/app/blog/page.tsx](src/app/blog/page.tsx) (lists published posts)
  - Blog detail route [src/app/blog/[slug]/page.tsx](src/app/blog/%5Bslug%5D/page.tsx) (renders published posts)
- Dashboard Blog authoring UI:
  - Editor at [src/app/dashboard/blog/page.tsx](src/app/dashboard/blog/page.tsx)
  - Draft storage utilities in [src/lib/dashboard/blogStorage.ts](src/lib/dashboard/blogStorage.ts)
  - Media library picker in [src/components/dashboard/MediaPicker.tsx](src/components/dashboard/MediaPicker.tsx)
  - Features: create/select/edit/delete posts, auto-save, tags, hero image picker, markdown content area, live preview, import/export JSON, schedule/publish, optional Tweet on publish (stub).

## Environment
1) Optional .env.local (public read adapters):
   - NEXT_PUBLIC_PROFILE_JSON_URL=https://example.com/profile.json
   - NEXT_PUBLIC_BLOG_JSON_URL=https://example.com/blog.json
2) Endpoints must return JSON shapes validated by Zod (Profile and BlogIndex). If unset or invalid, the app falls back to bundled samples.

## API Stubs (server routes)
- Media Upload (multipart/form-data)
  - POST /api/media/upload — returns a fake CDN URL and metadata
  - Source: [src/app/api/media/upload/route.ts](src/app/api/media/upload/route.ts)
- Twitter Post (JSON)
  - POST /api/twitter/post — returns a fake tweet id
  - Source: [src/app/api/twitter/post/route.ts](src/app/api/twitter/post/route.ts)

## Using the Dashboard Blog Editor
- Navigate to /dashboard/blog
- New Post: creates a draft with a unique slug.
- Fields: title, slug (auto slugify or manual), summary, tags (comma-separated), hero image (via MediaPicker), markdown content.
- Status and scheduling: set Draft/Scheduled/Published; optionally set scheduledAt/publishedAt.
- Publish: persists as published; if "Tweet on publish" is enabled, a request is sent to the Twitter stub.
- Import/Export: validate and import JSON of the entire blog index or export the current index.

## Public Blog
- /blog shows the published posts list.
- /blog/[slug] renders a published post by slug.
- Both use the public blog adapter in [src/lib/adapters/public/blog.ts](src/lib/adapters/public/blog.ts) and validate external JSON via Zod, with graceful fallback to sample data in [src/lib/sample/blog.ts](src/lib/sample/blog.ts).

## Development
- npm install
- npm run dev
- Open http://localhost:3000
- Dashboard: /dashboard/blog
- Public blog: /blog and /blog/[slug]

## Acceptance (Milestone E)
- Dashboard Blog editor loads, saves, and restores drafts via LocalStorage with Zod guard.
- MediaPicker uploads to the stub and stores assets in the local media library; selections persist.
- Publish flow updates status/time; when enabled, a Twitter stub request is sent and returns an id.
- Public blog index and detail render using the adapter; only published posts are visible.
- No runtime parse errors; adapters validate external JSON and fall back to bundled sample data.