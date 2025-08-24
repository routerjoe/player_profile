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
## Milestone F — Photos Library (Local FS + JSON)

A simple local photo manager is implemented with Next.js App Router. Files are saved under `public/uploads/{playerId}/` and metadata is persisted to `data/photos.json` (atomic writes, safe read/repair).

Key files:
- API
  - GET/POST: [src/app/api/photos/route.ts](src/app/api/photos/route.ts)
  - PATCH/DELETE: [src/app/api/photos/[id]/route.ts](src/app/api/photos/%5Bid%5D/route.ts)
- Library
  - Types: [src/lib/photos/types.ts](src/lib/photos/types.ts)
  - JSON DB helpers (atomic write): [src/lib/photos/db.ts](src/lib/photos/db.ts)
  - Filesystem helpers: [src/lib/photos/fs.ts](src/lib/photos/fs.ts)
  - Service (CRUD + hero exclusivity + public helper): [src/lib/photos/service.ts](src/lib/photos/service.ts)
  - Dev auth guards (header-based): [src/lib/auth/guards.ts](src/lib/auth/guards.ts)
- UI
  - Dashboard page: [src/app/dashboard/photos/page.tsx](src/app/dashboard/photos/page.tsx)
  - Components: [src/components/photos/Uploader.tsx](src/components/photos/Uploader.tsx), [src/components/photos/PhotoTile.tsx](src/components/photos/PhotoTile.tsx)

API contracts:
- GET `/api/photos?playerId=...` → `PhotoRecord[]` sorted newest first
- POST `/api/photos` (multipart/form-data)
  - fields: `playerId`
  - files: `images[]`
  - stores to `/public/uploads/{playerId}/{uuid}.{ext}`, creates `PhotoRecord` with usage "unassigned"
  - returns created `PhotoRecord[]`
- PATCH `/api/photos/[id]` with JSON `{ title?, alt?, usage? }`
  - setting `usage:"hero"` unsets any other hero for that `playerId`
  - returns updated `PhotoRecord`
- DELETE `/api/photos/[id]` deletes file from disk (ignored if missing) and removes record
  - returns `{ ok: true }`

Dev auth (header-based):
- All API routes allow the request if either:
  - `x-user-id == playerId`, or
  - `x-user-role` in `['coach','admin']`
- UI uses `x-user-id: {playerId}` to simplify local testing. Replace with real session logic as needed.

Types:
- See [src/lib/photos/types.ts](src/lib/photos/types.ts) for `PhotoUsage` and `PhotoRecord`. Only `jpg/jpeg`, `png`, `webp`, `avif`, `gif` are allowed. Max size: 8MB.

Helper for public pages:
- Use the exported service helper to fetch the player's hero image:

```tsx
// app/profile/HeroImage.tsx
import { getHeroPhoto } from '@/lib/photos/service';

export default async function HeroImage({ playerId }: { playerId: string }) {
  const hero = await getHeroPhoto(playerId);
  if (!hero) return null;
  return (
    <img
      src={hero.url}
      alt={hero.alt || hero.title}
      className="w-full h-auto"
    />
  );
}
```

Storage layout:
- Upload directory: `/public/uploads/{playerId}/`
- Metadata file: `/data/photos.json` (created when missing or corrupted)

Dashboard usage:
- Navigate to `/dashboard/photos?playerId=YOUR_ID`
- Drag-drop or select images to upload. Each tile shows a preview and fields to edit Title, Alt, and Usage.
- Save to persist metadata; Delete removes the image and metadata; Open previews the full-size file.
- Setting Usage = Hero ensures exactly one hero per player.

Deployment notes:
- Attach a persistent volume for both `/public/uploads` and `/data` so files and metadata survive restarts.
- Example (Render): create two disks and mount them at those paths, or one disk mounted at `/` covering both subpaths.
- This implementation does not use Supabase or any external storage.
## Milestone G — Local Auth (Login/Register + Protected Dashboard)

A simple local authentication layer has been added to protect the Dashboard and derive playerId from the logged-in user.

Key pieces:
- Cookie session middleware: [middleware.ts](middleware.ts)
- Session helpers: [src/lib/users/session.ts](src/lib/users/session.ts)
- Password hashing (scrypt): [src/lib/users/crypto.ts](src/lib/users/crypto.ts)
- Users DB (JSON, atomic write): [src/lib/users/db.ts](src/lib/users/db.ts)
- Types: [src/lib/users/types.ts](src/lib/users/types.ts)
- API routes:
  - Register: [src/app/api/auth/register/route.ts](src/app/api/auth/register/route.ts)
  - Login: [src/app/api/auth/login/route.ts](src/app/api/auth/login/route.ts)
  - Logout: [src/app/api/auth/logout/route.ts](src/app/api/auth/logout/route.ts)
  - Me (get/update account): [src/app/api/auth/me/route.ts](src/app/api/auth/me/route.ts)
  - Change password: [src/app/api/auth/password/route.ts](src/app/api/auth/password/route.ts)
- Pages:
  - Login: [src/app/login/page.tsx](src/app/login/page.tsx)
  - Register: [src/app/register/page.tsx](src/app/register/page.tsx)
- Dashboard updates:
  - Photos page prefers session playerId automatically: [src/app/dashboard/photos/page.tsx](src/app/dashboard/photos/page.tsx)
  - Settings page manages account (username, email, socials, password): [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx)
  - Layout includes Sign out: [src/app/dashboard/layout.tsx](src/app/dashboard/layout.tsx)

Environment:
- .env.local (create if missing)
  AUTH_SECRET=change-me-for-prod
  NEXT_PUBLIC_DEFAULT_PLAYER_ID=demo

Notes:
- AUTH_SECRET is required to sign the cookie token. Use a long random string in production.
- NEXT_PUBLIC_DEFAULT_PLAYER_ID is only used as a fallback when no session is present (e.g., local dev viewing /dashboard/photos without logging in, or for the public home page hero override).

How to use:
1) Start dev server: npm run dev
2) Visit /register to create an account
   - A new record is created in data/users.json and a cookie session is set
3) You are redirected to /dashboard (middleware protects /dashboard/*)
4) Dashboard Photos: playerId is taken from your session; upload, set Usage=Hero, Save
5) Public home hero:
   - Home page uses getHeroPhoto(playerId) with NEXT_PUBLIC_DEFAULT_PLAYER_ID.
   - To show your logged-in hero on the home page, set NEXT_PUBLIC_DEFAULT_PLAYER_ID to your playerId (equal to your user id). This ensures / displays your selected hero image.

Storage:
- Users JSON: /data/users.json (created on first write)
- Photo metadata: /data/photos.json (created on first write)
- Uploads: /public/uploads/{playerId}/

Production:
- Attach persistent volumes for /data and /public/uploads
- Replace this simple auth with a managed provider when ready (NextAuth, Clerk, etc.), but these routes and types serve as a clean scaffold.