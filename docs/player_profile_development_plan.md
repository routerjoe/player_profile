# Player Profile — Development Plan (Greenfield)

References
- Style Guide: [docs/player_profile_style_guide.md](docs/player_profile_style_guide.md)
- Fresh Build Spec: [docs/player_profile_fresh_build_spec.md](docs/player_profile_fresh_build_spec.md)

Constraints
- Framework: Next.js App Router + TypeScript + TailwindCSS
- Fonts: Inter (body), Bebas Neue (headings) via next/font in [src/app/layout.tsx](src/app/layout.tsx)
- Accessibility: WCAG AA; visible focus; 44×44 hit targets; reduced motion respected
- Performance: Next/Image with explicit width/height/sizes; avoid layout shift; minimal motion
- Adapter rule: Keep public read adapters stable; the Player Profile Dashboard may transform inputs before persistence (adapter layer), but public API/JSON shapes must remain unchanged


## 1) Objectives & Scope

Primary outcomes
- Public site (Player Profile) rebuilt with the new design language and tokens from the style guide
- Player Profile Dashboard (owner UI) to edit all fields in the profile data model
- Blog system (authoring, schedule, publish) and public blog pages
- Media library for blog images (upload/browse/reuse) backed by Supabase Storage or S3
- Twitter integration to post when a blog entry is published or scheduled time is reached

In-scope
- UI/UX of public profile: Hero, Quick Stats, Bio & Academics, Highlights, Schedule, Contact + Socials, Recruiting Packet, Performance Measurables, Calendar
- Dashboard tabs for Profile, Stats, Highlights, Schedule (+ Calendar view), Photos, Blog, Settings
- Server routes for media uploads and Twitter posting
- Adapter layer to preserve public data shapes

Out-of-scope (for initial release)
- Changing existing public API endpoints or data routing formats
- Heavy animations, parallax, or complex transitions
- Non-essential third-party integrations beyond storage and Twitter


## 2) Milestones, Deliverables, and Acceptance Criteria

Milestone A — Foundation and Tokens
- Deliverables
  - Running Next.js App Router project with TypeScript and Tailwind
  - Global CSS tokens and utilities in [src/app/globals.css](src/app/globals.css)
  - Fonts wired in [src/app/layout.tsx](src/app/layout.tsx)
  - Tokens test page in [src/app/page.tsx](src/app/page.tsx)
  - Tailwind theme extension in [tailwind.config.js](tailwind.config.js)
  - PostCSS pipeline in [postcss.config.js](postcss.config.js)
  - Remote image patterns in [next.config.js](next.config.js)
- Acceptance criteria
  - Dev server loads with no CSS or PostCSS errors
  - Tokens render visually (brand green, accents, focus ring, reduced motion)
  - No layout shift from fonts; Inter/Bebas via next/font

Milestone B — Public Profile Sections
- Deliverables
  - Hero with gradient overlay and badges
  - Quick Stats strip (carded tiles)
  - Bio & Academics, Highlights grid, Schedule table, Contact + Socials block
  - Optional Recruiting Packet download
- Acceptance criteria
  - All sections use tokens and components consistently
  - All CTAs are keyboard accessible with visible focus
  - Next/Image used where applicable; no layout shift for imagery

Milestone C — Data Model + Adapters (Public Read Stable)
- Deliverables
  - Data model documented (see section 4) and referenced by UI
  - Adapter layer to read existing JSON/API without breaking changes
  - Minimal demo JSON or fetch mocks wired through adapters
- Acceptance criteria
  - Public pages read through adapters only (no direct shape coupling)
  - Swapping adapter impl does not require UI code changes
  - Type-safe models (TypeScript) and schema validation (Zod) co-located with adapters

Milestone D — Player Profile Dashboard (MVP)
- Deliverables
  - Dashboard shell at /dashboard with tabs: Profile, Stats, Highlights, Schedule, Photos, Blog, Settings
  - CRUD for Profile, Stats, Highlights, Schedule, Photos metadata (upload handled in Milestone E)
  - Live preview pane for edited component(s) where feasible
- Acceptance criteria
  - Every field listed in the data model is editable in some tab
  - Inline validation with helpful errors; form state resilient to refresh
  - No change to public read shapes (adapters enforce transformation)

Milestone E — Media Library + Blog Authoring + Twitter Integration
- Deliverables
  - Blog authoring UI (draft/schedule/publish), slash menu blocks (minimal set), preview
  - Media Library: upload (Supabase or S3), browse, reuse; server route for signed upload
  - Twitter server route and dashboard control to post on publish (toggle)
- Acceptance criteria
  - Publishing (or schedule hit) posts to Twitter when enabled; failures are surfaced with retry
  - Blog images render via Next/Image without layout shift
  - Credentials remain server-side; no leakage to client

Milestone F — Performance, A11y, SEO
- Deliverables
  - Lighthouse tuning for Accessibility and Best Practices
  - Titles/descriptions and social meta tags; correct heading semantics; keyboard flows
  - Reduced motion verified; focus states visible across interactive elements
- Acceptance criteria
  - Lighthouse: Accessibility ≥ 90, Best Practices ≥ 90
  - AA contrast validated on hero overlays and cards
  - All interactive targets ≥ 44×44

Milestone G — Stabilization, CI, and Release
- Deliverables
  - GitHub Actions for lint, typecheck, build
  - README deployment notes and environment variable documentation
- Acceptance criteria
  - Green CI on main
  - Clean build and start on target hosting environment


## 3) Architecture Decisions

Framework
- Next.js App Router with TypeScript, TailwindCSS.
- Fonts via next/font (Inter, Bebas Neue) in [src/app/layout.tsx](src/app/layout.tsx).

Design tokens and theme
- CSS variables defined in [src/app/globals.css](src/app/globals.css) for brand, accents, neutrals, hero gradient stops.
- Tailwind theme extension in [tailwind.config.js](tailwind.config.js) maps tokens to utilities.

Components and sections
- UI primitives in [src/components/ui](src/components/ui) (Button, Card, Badge, Table bits).
- Page sections in [src/components/sections](src/components/sections) (Hero, Stats, Bio, Highlights, Schedule, Contact, Performance, Calendar).

Adapters and data access
- Public read adapters in [src/lib/adapters/public](src/lib/adapters/public) must remain stable (same output shapes to UI).
- Dashboard write adapters in [src/lib/adapters/dashboard](src/lib/adapters/dashboard) may translate form inputs to storage schema and vice versa.
- Validation with Zod in [src/lib/validation](src/lib/validation).

Storage and media
- Media upload route at [src/app/api/media/upload/route.ts](src/app/api/media/upload/route.ts) returns metadata and a permanent https URL.
- Environment selects provider (Supabase Storage or S3). Remote image patterns configured in [next.config.js](next.config.js).

Blog and Twitter
- Blog pages at [src/app/blog/page.tsx](src/app/blog/page.tsx) and [src/app/blog/[slug]/page.tsx](src/app/blog/%5Bslug%5D/page.tsx).
- Twitter post route at [src/app/api/twitter/post/route.ts](src/app/api/twitter/post/route.ts). Server-side only; credentials in env.

Performance and a11y
- Always pass width/height (or fill with sizes) to Next/Image.
- Respect prefers-reduced-motion for transitions and animations.
- Maintain visible focus across interactive elements (buttons, links, nav).

Routing and typed paths
- App Router with colocated route handlers under /app.
- Public site remains SSR/SSG-friendly; dynamic client features limited to essentials.


## 4) Data Model Overview (Collections & Key Fields)

Identity
- name: { first, last }
- classYear: number
- positions: string[]
- bats: string; throws: string
- location: { city, state }
- height?: string; weight?: string

Contact & Social
- email: string (public or masked)
- twitter: { handle: string }
- phone?: string (dashboard-only)
- website?: string

Academics
- gpa: string | number
- testScores?: { SAT?: string; ACT?: string }
- coursework?: string[]

Athletics (Stats)
- stats: { label: string; value: string; season?: string; notes?: string }[]

Highlights (Media)
- highlights: { title: string; videoUrl: string; thumbnailUrl?: string; date?: string; isFeatured?: boolean; notes?: string }[]

Schedule / Results
- schedule: { date: string; opponent: string; location?: string; result?: string; link?: string }[]

Photos / Imagery
- photos: { active: { heroImage?: string; featuredAction?: string }; gallery?: { url: string; alt: string }[] }

Recruiting Packet
- recruitingPacket?: { url: string }

Performance Measurables
- performance: { metric: string; value: number; unit: string; measuredAt: string; notes?: string; source?: string }[]

SEO
- seo: { title?: string; description?: string; image?: string }

Note
- See the Fresh Build Spec for canonical details and acceptance criteria. The adapter layer ensures public read shapes remain stable while the Dashboard can transform inputs pre‑persistence.


## 5) File Map (Key Pages, Components, API Routes)

Top-level
- [next.config.js](next.config.js)
- [tailwind.config.js](tailwind.config.js)
- [postcss.config.js](postcss.config.js)
- [tsconfig.json](tsconfig.json)

App Router
- Public home: [src/app/page.tsx](src/app/page.tsx)
- Blog index: [src/app/blog/page.tsx](src/app/blog/page.tsx)
- Blog post: [src/app/blog/[slug]/page.tsx](src/app/blog/%5Bslug%5D/page.tsx)
- Dashboard shell: [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)
- Dashboard tabs:
  - [src/app/dashboard/profile/page.tsx](src/app/dashboard/profile/page.tsx)
  - [src/app/dashboard/stats/page.tsx](src/app/dashboard/stats/page.tsx)
  - [src/app/dashboard/highlights/page.tsx](src/app/dashboard/highlights/page.tsx)
  - [src/app/dashboard/schedule/page.tsx](src/app/dashboard/schedule/page.tsx)
  - [src/app/dashboard/performance/page.tsx](src/app/dashboard/performance/page.tsx)
  - [src/app/dashboard/photos/page.tsx](src/app/dashboard/photos/page.tsx)
  - [src/app/dashboard/blog/page.tsx](src/app/dashboard/blog/page.tsx)
  - [src/app/dashboard/settings/page.tsx](src/app/dashboard/settings/page.tsx)

Sections (public)
- [src/components/sections/Hero.tsx](src/components/sections/Hero.tsx)
- [src/components/sections/QuickStats.tsx](src/components/sections/QuickStats.tsx)
- [src/components/sections/BioAcademics.tsx](src/components/sections/BioAcademics.tsx)
- [src/components/sections/Highlights.tsx](src/components/sections/Highlights.tsx)
- [src/components/sections/Schedule.tsx](src/components/sections/Schedule.tsx)
- [src/components/sections/Contact.tsx](src/components/sections/Contact.tsx)
- [src/components/sections/Performance.tsx](src/components/sections/Performance.tsx)
- [src/components/sections/Calendar.tsx](src/components/sections/Calendar.tsx)

UI primitives
- [src/components/ui/Button.tsx](src/components/ui/Button.tsx)
- [src/components/ui/Card.tsx](src/components/ui/Card.tsx)
- [src/components/ui/Badge.tsx](src/components/ui/Badge.tsx)
- [src/components/ui/Table.tsx](src/components/ui/Table.tsx)

Lib, adapters, validation
- [src/lib/adapters/public/profile.ts](src/lib/adapters/public/profile.ts)
- [src/lib/adapters/dashboard/profile.ts](src/lib/adapters/dashboard/profile.ts)
- [src/lib/validation/schemas.ts](src/lib/validation/schemas.ts)
- [src/lib/types.ts](src/lib/types.ts)

API routes
- Media upload: [src/app/api/media/upload/route.ts](src/app/api/media/upload/route.ts)
- Twitter post: [src/app/api/twitter/post/route.ts](src/app/api/twitter/post/route.ts)

Styles
- Globals and tokens: [src/app/globals.css](src/app/globals.css)


## 6) Risks & Mitigations

Twitter API variability
- Risk: API or auth changes; rate limits; media upload constraints.
- Mitigation: Server-only integration with defensive retries and clear user messaging; toggle to disable posting; log post IDs.

Media storage complexity/cost
- Risk: Storage provider costs, misconfiguration, or permissions issues.
- Mitigation: Environment-driven provider (Supabase or S3); signed uploads; clear documentation; soft-delete policy.

Layout shift and visual polish
- Risk: LCP degradation or layout shift from images or fonts.
- Mitigation: Always provide width/height or sizes to Next/Image; use next/font to avoid FOUT/FoIT.

Adapter integrity
- Risk: Breaking changes between Dashboard writes and public reads.
- Mitigation: Centralize transformations in adapters; add schema validation and unit tests; version adapter outputs if needed.

Accessibility regressions
- Risk: Missing focus states, insufficient contrast on hero overlays, or small tap targets.
- Mitigation: Global focus ring, AA checks, manual keyboard sweeps; enforce ≥ 44×44 targets in components.

Operational secrets
- Risk: Exposure of credentials (Twitter, S3).
- Mitigation: Server-side only access; .env files excluded via [.gitignore](.gitignore); CI secret scopes restricted.


## 7) Testing Strategy

Unit tests
- Scope: Adapters (public and dashboard) and validation schemas (Zod).
- Goal: Ensure shapes and transformations are stable and backward compatible.

Component tests
- Scope: UI primitives and sections render with tokens, focus states, and reduced-motion behavior.
- Tools: React Testing Library + Vitest (or Jest) with jsdom.

Integration tests
- Scope: Blog authoring flow (draft → publish), Media upload route, Twitter post route (mocked).
- Ensure images render with correct dimensions; verify no layout shift in basic snapshots.

E2E + a11y + performance checks
- Playwright (or Cypress) basic flows across key pages.
- Lighthouse runs in CI for Accessibility and Best Practices thresholds.

Manual a11y QA
- Keyboard traversal and screen-reader spot checks on public CTAs and Dashboard forms.


## 8) Operating Notes (Env, Secrets, CI, Linting)

Environment variables (examples)
- Storage (choose one)
  - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - AWS S3: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL`
- Twitter: `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`
- General: `NEXT_PUBLIC_SITE_URL`, optional `NEXT_RUNTIME_LOG_LEVEL`

Secrets handling
- Never expose credentials to client code; all third-party calls occur server-side.
- Local secrets live in `.env.local` (ignored by git via [.gitignore](.gitignore)).

CI and quality gates
- Lint: `npm run lint` (config in [.eslintrc.json](.eslintrc.json))
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Optional: Playwright or Cypress job; Lighthouse CI for budgets

Next.js configuration
- Remote image patterns configured in [next.config.js](next.config.js)
- PostCSS/Tailwind pipeline in [postcss.config.js](postcss.config.js) and [tailwind.config.js](tailwind.config.js)

Local development
- Start: `npm run dev` → http://localhost:3000
- Verify: tokens on home page render (headings, cards, buttons, overlay), visible focus, reduced motion


## 9) Changelog

- 0.1.0 — This development plan created; constraints, milestones, architecture, data model, file map, testing and ops notes documented.
- 0.2.0 — Milestone A completed (foundation and tokens).
- 0.3.0 — Milestone B implemented (public sections).
- 0.4.0 — Milestone C (adapters + data model wired).
- 0.5.0 — Milestone D (Dashboard MVP).
- 0.6.0 — Milestone E (Media + Blog + Twitter).
- 0.7.0 — Milestone F (Perf, A11y, SEO).
- 1.0.0 — Milestone G (Stabilization, CI, Release).