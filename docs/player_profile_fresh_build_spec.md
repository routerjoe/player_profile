# Player Profile — Fresh Build Spec (UI + Player Profile Dashboard + Twitter Integration)

This document is the single source of truth for rebuilding the Player Profile experience from scratch, including the **Player Profile Dashboard** (formerly “admin dashboard”) and **Twitter integration for posting blog updates**. Hand this spec to Kilo Code as the top-level brief. The build must preserve current data wiring wherever possible, while replacing the presentation layer and adding the dashboard.

---

---

## Repository & Local Setup

**GitHub Repo:** https://github.com/routerjoe/player_profile  
**Local folder (project root):** `player_profile`

### Commands
```bash
# 1) Clone and enter the project
git clone https://github.com/routerjoe/player_profile.git
cd player_profile

# 2) Create a working branch for the rebuild
git checkout -b feat/green-refresh-ui

# 3) Ensure documentation lives in docs/
mkdir -p docs
# Move or add your reference docs here:
#   - docs/lana-nolan-profile.md
#   - docs/player_profile_style_guide.md
#   - docs/content-strategy-wireframes.md
#   - docs/implementation-guide.md
#   - docs/website-architecture-plan.md
#   - docs/deployment-guide.md
#   - docs/RECRUITING-OUTREACH-STRATEGY.md
#   - docs/TASKS_MASTER.md
#   - docs/README.md

# 4) Commit the docs move (if applicable)
git add docs
git commit -m "docs: consolidate project docs into docs/"

# 5) After implementing UI changes, push and open PR
git push -u origin feat/green-refresh-ui
# Open a PR to main on GitHub and include before/after screenshots + Lighthouse summaries
```

**Kilo Code Setup:** Open the **`player_profile/`** folder as the project root and include **all files in `docs/` as context**. Follow the “Design System & Tokens” and “Pages/Components to Update” sections in this spec.


## 0) Naming & Scope

- **Public site:** Player Profile (public-facing, SEO friendly).
- **Owner UI:** **Player Profile Dashboard** (player/parent/coach edit surface). Use this name throughout UI and code comments.
- **Scope:** Rebuild the **presentation layer** of the public profile; add a **first-class dashboard** where **all fields are editable**. Integrate **Twitter posting** when a blog post is published or scheduled.

**Non-goals:** Do not alter existing API shapes or storage locations unless explicitly required for the dashboard; avoid heavy animations/parallax; keep Next/Image.

---

## 1) Design Language (from the Style Guide)

- Clean, collegiate, recruiter-friendly. Lots of white space, big numbers, zero clutter.
- **Typography:** Bebas Neue (headings), Inter (body).
- **Palette:** Brand Green `#26A84A`, Brand Green Dark `#1B6F35`, Neutral text `#1E293B`, Background `#F8FAFC`, Accent Cool `#06B6D4`, Accent Warm `#F4B400`.
- **Cards:** `rounded-2xl bg-white shadow-sm hover:shadow-lg transition`.
- **Hero overlay:** `bg-gradient-to-br from-[var(--hero-from)]/15 to-[var(--hero-to)]/15`.
- **Spacing:** Section padding `py-14 md:py-20`; grid gaps 8–12px mobile, 24–32px desktop.
- **A11y:** AA contrast, visible focus, hit targets ≥44×44, reduced motion respected.

---

## 2) Sections (Public Page)

1. **Hero**: Name, positions/class year, location, quick badge row, 2 CTAs (Primary Contact, Secondary Twitter).
2. **Quick Stats Strip**: 5–8 stat tiles (big numeral + small label).
3. **Bio & Academics**: Narrative paragraph(s), GPA, coursework, test scores (optional).
4. **Highlights Grid**: Responsive thumbnails linking to video URLs (YouTube, GameChanger, Hudl, etc.).
5. **Schedule/Results**: Table (Date | Opponent | Result | Link).
6. **Contact + Socials**: Email mailto, Twitter handle, optional QR to contact.
7. **Optional: Recruiting Packet**: Download link if available.

---

## 3) Data Model (Editable Fields)

> All fields below must be editable from the **Player Profile Dashboard**. Persist to existing JSON/API when possible.

### 3.1 Identity
- `name.first`, `name.last`
- `classYear` (e.g., 2027)
- `positions` (array of strings, e.g., ["SS", "2B"])
- `bats`, `throws`
- `location.city`, `location.state`
- `height`, `weight` (optional)

### 3.2 Contact & Social
- `email` (public or masked)
- `twitter.handle` (e.g., "@LanaNolan02")
- `phone` (private; dashboard only)
- `website` (optional)

### 3.3 Academics
- `gpa`
- `testScores` (SAT/ACT optional)
- `coursework` (array of strings)

### 3.4 Athletics (Stats)
- `stats` (array of stat objects): label, value, season, source/notes
  - Example: `{ label: "Exit Velo", value: "68 mph", season: "2024" }`

### 3.5 Highlights (Media)
- `highlights` (array): `{ title, thumbnailUrl, videoUrl, date }`
- Support YouTube/GameChanger/Hudl/etc.

### 3.6 Schedule/Results
- `schedule` (array): `{ date, opponent, location, result?, link? }`

### 3.7 Photos/Imagery
- `photos.active.heroImage` (path), fallback to `featuredAction`
- `gallery` (array): URLs + alt text

### 3.8 Recruiting Packet
- `recruitingPacket.url` (if available)

### 3.9 SEO
- `seo.title`, `seo.description`, `seo.image`

---

## 4) Player Profile Dashboard (Owner UI)

> Purpose: **All fields** above must be editable. UX should be clean, mobile-friendly, and forgiving.

### 4.1 Navigation
- Tabs or left-nav sections: **Profile**, **Stats**, **Highlights**, **Schedule**, **Photos**, **Blog**, **Settings**.

### 4.2 Editing Patterns
- Use forms with inline validation.
- For arrays (stats, highlights, schedule, gallery): controls for **Add / Edit / Reorder / Delete**.
- Image uploads: direct to storage provider (keep current infra). Show previews.

### 4.3 Blog Management
- Create, edit, schedule, and publish blog posts (Markdown or rich text).
- Fields: `title`, `slug`, `summary`, `content`, `coverImage`, `tags`, `status` (draft/scheduled/published), `publishAt`.
- When status transitions to **published** (or publish time is reached), trigger **Twitter posting** (see §6).

### 4.4 Live Preview
- On the right side (desktop) or under the form (mobile), render a **live preview** of the public page or the specific component being edited (e.g., a stat tile or blog card).

### 4.5 Access & Roles
- Single owner or multiple editors (future-ready).
- Keep the existing auth provider; do not break login.

### 4.6 Save & Versioning
- Save buttons with optimistic updates and toast confirmations.
- Optional: Version history per section (MVP can defer).

---



### 4B) Highlights Dashboard Details (Explicit)
- **Highlights** tab supports full CRUD for entries in §3.5.
- Fields per item: `title`, `videoUrl` (YouTube/GameChanger/Hudl/etc.), `thumbnailUrl` (optional), `date` (optional), `notes` (optional), `isFeatured` (boolean).
- Features: **Add / Edit / Reorder / Delete**, drag-reorder list, inline validation for supported providers.
- Rendering: auto-embed provider players; lazy-load iframes; fall back to open-in-new-tab if embed fails.
- Public page shows **Featured** clips first, then the rest by `date` desc.


## 5) Public Blog

- Image uploads are supported via the Media Library detailed below.



---

## 5B) Blog Editing UX (WordPress‑like) + Media Library (Images)

### Editor (Authoring Experience)
- **Rich text/MDX editor** with block-style controls: Heading, Paragraph, Quote, Image, Gallery, List (ol/ul), Divider, Code, Embed (YouTube/Twitter/X).
- **Slash menu** ("/") to insert blocks; **drag‑and‑drop** to reorder blocks.
- **Autosave** every 10s and on blur; manual **Save Draft**, **Schedule**, **Publish** actions.
- **Preview** button renders the post as it will appear publicly.
- **Taxonomy**: `categories` (optional), `tags` (string array).
- **SEO fields**: `seoTitle`, `seoDescription`, optional `ogImage` override.
- **Slug** auto-generated from title with manual override; enforce uniqueness.
- **Featured image** (cover) support with focal point selection.
- **Revisions**: keep last 10 versions (MVP: timestamped snapshots).

### Media Library (Images)
- **Upload** PNG/JPG/WebP; max 10MB/file (configurable). Client‑side compress to WebP when feasible.
- **Metadata**: required `alt` text; optional caption and credit.
- **Reuse**: pick from existing media; search by filename/caption.
- **Storage**: server‑side upload to **Supabase Storage or S3** (choose one env‑driven). Return permanent HTTPS URL.
- **Security**: signed upload via server route; never expose credentials client‑side.
- **Cleanup**: soft‑delete assets (keep for 30 days) to avoid broken links.
- **Next/Image**: allow remote images via `next.config.js` `images.remotePatterns` for chosen CDN/storage domain.

### Files (Additions)
- `src/app/dashboard/blog/editor/Editor.tsx` — block editor with image block and gallery block.
- `src/app/dashboard/blog/media/MediaLibrary.tsx` — modal/panel for browsing and uploading images.
- `src/app/api/media/upload/route.ts` — server route returning `{ url, width, height, format, size }`.
- `next.config.js` — add `images.remotePatterns` for storage domain.

### Env (Storage)
```
# Choose one provider and configure accordingly
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# or AWS S3
S3_BUCKET=...
S3_REGION=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_BASE_URL=https://<bucket>.<region>.amazonaws.com
```

### Acceptance Criteria (Blog Images)
- Author can **insert images inline** in posts, set alt text and captions.
- Author can **upload new** images and **reuse existing** ones from a Media Library.
- Published post renders images via Next/Image; no layout shift (width/height provided).
- **Featured image** appears on index cards and at the top of the post (optional).
- Scheduling/publishing still triggers Twitter post when enabled (§6).

 (Optional but Recommended)

- Public `/blog` index and `/blog/[slug]` pages matching the site style.
- Blog posts are authored/managed in the **Player Profile Dashboard**.
- On publish, post to Twitter (see §6).

---

## 6) Twitter Integration (Posting Blog Updates)

**Goal:** When a blog post is **published** (or scheduled time hits), automatically create a post on Twitter (X).

### 6.1 Behavior
- Compose a post using a template:
  - `"{title} — new post by {playerName}. Read: {publicUrl}  #softball #recruiting"`
- If `coverImage` exists, attach it if API supports media upload.
- Include a “Post to Twitter” toggle per post (default ON). If OFF, skip posting.
- Provide a manual **“Post Now”** button for drafts.

### 6.2 Config
- Securely store API credentials in server-side env (e.g., `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET` or OAuth tokens). Do not expose to client.
- Add a **Settings** panel in the Dashboard to connect/disconnect Twitter and test a sample post (silent test or sandbox).

### 6.3 Implementation Notes
- Use server-side route/handler to post to Twitter; do not call API from the browser.
- Respect rate limits and handle failures with retries + user feedback (toast + log).
- Log post ID/URL and surface it in the Blog table.

### 6.4 Edge Cases
- If publishing fails (Twitter API down), keep post **published** but show a banner offering **Retry**.
- If credentials are missing, show a clear setup callout in Blog tab.

---

## 7) Technical Requirements

- **Framework:** Next.js + TailwindCSS; Framer Motion minimal (fade/slide, 150–250ms).
- **Fonts:** Bebas Neue (headings), Inter (body).
- **Images:** Next/Image with `sizes` and priority for Hero.
- **Tokens:** Implement CSS variables and Tailwind theme extension per style guide.
- **A11y:** Keyboard navigation, focus states, ARIA labels on CTAs, AA contrast.
- **Perf:** Avoid layout shift; optimize images; lazy-load videos.

---

## 8) Files to Create/Update

- `src/app/layout.tsx` — fonts, base colors.
- `src/app/globals.css` — root CSS vars + utilities (`.card`, `.card-hover`, `.heading-xl`).
- `tailwind.config.js` — extend theme with `brand`, `accent.cool`, `accent.warm`.
- `src/components/sections/Hero.tsx` — new layout, overlay, badges, CTAs.
- `src/components/sections/PlayerProfile.tsx` — stats grid, consistent cards.
- `src/components/ui/Button.tsx`, `src/components/ui/Card.tsx` — design system.
- `src/app/dashboard/(routes)` — **Player Profile Dashboard** (tabs, forms, blog).
- `src/app/api/twitter/post/route.ts` — server handler for Twitter posting.
- `src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx` — public blog (optional).

> Data sources (JSON/APIs) must remain compatible. If schema must change for dashboard, create a small adapter layer so the public site remains stable.

---

## 9) Acceptance Criteria

1. Public profile matches the modern design language and color tokens.
2. All fields in §3 are **editable** in the **Player Profile Dashboard**.
3. Blog posts can be drafted, scheduled, and published.
4. Publishing a blog post (or hitting scheduled time) **posts to Twitter** when enabled.
5. Lighthouse scores: Accessibility ≥90, Best Practices ≥90.
6. No breaking changes to existing data routing or public URLs.

---

## 10) Test Plan

- **Visual QA:** 360px, 768px, 1280px, 1536px breakpoints.
- **Keyboard Navigation:** Tab through dashboard forms and public CTAs.
- **Contrast:** AA checks on hero and cards.
- **Twitter:** Post succeeds, logs stored, toggle respected, retry works.
- **Data Integrity:** Player JSON/APIs unchanged; fallbacks (hero image, packets) working.
- **SEO:** Titles/descriptions present; social meta tags generated.

---

## 11) Deliverables

- PR with:
  - New **Player Profile Dashboard**.
  - Updated public profile UI.
  - Twitter post endpoint + settings UI.
  - README updates: env vars, setup steps.
  - Before/after screenshots and a brief migration note.

**Suggested Commits**
- `feat(ui): fresh player profile with green design system`
- `feat(dashboard): add Player Profile Dashboard with full edit controls`
- `feat(blog): draft/schedule/publish pipeline`
- `feat(twitter): server route + settings + auto-post on publish`
- `chore(a11y): focus/contrast improvements`
- `docs: setup for twitter credentials and dashboard usage`


---

## 2A) Additional Public Sections (Explicit)

8. **Performance Measurables**: Card + Table section listing measured metrics.
   - Columns: **Metric | Value | Unit | Date | Notes**
   - Example: *Vertical Jump | 6 | inches | 2024-01-01 | To be updated with latest measurement*.
   - Optional badges for source (e.g., “Team Combine”, “Trainer Test”).

9. **Calendar**: Visual calendar complementing the Schedule table.
   - Views: Month (default), Week.
   - Same data source as `schedule` (§3.6). Do **not** change existing endpoints—render is a derived view.
   - Optional `.ics` export in future; out of scope for MVP unless trivial.

---

## 3A) Performance Measurables — Data Model

Add a `performance` collection persisted alongside player data:
```json
{
  "performance": [
    {
      "metric": "Vertical Jump",
      "value": 6,
      "unit": "inches",
      "measuredAt": "2024-01-01",
      "notes": "To be updated with latest measurement",
      "source": "Team Combine 2024"
    }
  ]
}
```

- All fields editable from the **Player Profile Dashboard**.
- Sorting: default by `measuredAt` desc.
- Validation: numeric `value` with `unit` (inches, mph, sec, lbs, etc.).

---

## 4A) Dashboard Additions

- **Performance** tab: CRUD for `performance` entries; inline validation, reordering, and delete with confirm.
- **Calendar** view in **Schedule** tab: toggle between **Table** and **Calendar**; entries share the same data.

---

## 8A) Files to Create/Update (Additions)

- `src/app/dashboard/highlights/page.tsx` — dashboard CRUD UI for highlights (add/edit/reorder/delete, feature flagging).


- `src/components/sections/Performance.tsx` — card + table rendering.
- `src/components/sections/Calendar.tsx` — month/week calendar derived from schedule.
- `src/app/dashboard/performance/page.tsx` — dashboard CRUD for measurables.
- Augment `src/app/dashboard/schedule/page.tsx` with a **Calendar** toggle.

---

## 9A) Acceptance Criteria (Additions)

- A **Performance Measurables** section is visible on the public profile and fully editable in the dashboard.
- A **Calendar** view exists for schedule data (no API changes required).
- **Video Highlights** and **Contacts** sections remain present and functional as specified.


---

## All-Sections Checklist (Parity with Localhost:3000)

- [x] Hero (name, positions/class, badges, CTAs)
- [x] Quick Stats Strip
- [x] Bio & Academics
- [x] Highlights (Video) Grid
- [x] Schedule (Table)
- [x] **Calendar** (Month/Week view derived from Schedule)
- [x] **Performance Measurables** (Card + Table)
- [x] Contact + Socials (email, Twitter handle)
- [x] Recruiting Packet (optional)
- [x] SEO metadata

> If the localhost site includes any additional sections not listed here, implement them using the same design tokens and patterns, and keep the data wiring unchanged.