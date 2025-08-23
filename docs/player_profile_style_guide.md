# Player Profile Website — Style Guide (v1)

This guide captures the target look & feel for the site and maps concrete implementation notes to the current codebase for fast adoption.

---

## Overall Vibe

- Clean, collegiate, recruiter-friendly. Lots of white space, big numbers, zero clutter.
- Mobile-first; readable at arm’s length.
- Minimal motion; subtle polish.

---

## Color Palette

The green in your logo patch is vibrant and slightly cool (approx. `#26A84A`). This updated palette keeps that green as a central brand element and builds a balanced scheme around it.

- **Primary Green (brand):** `#26A84A`  
  Main brand accent; CTAs, highlights, stat numerals, hero overlays.
- **Deep Green (hover/dark):** `#1B6F35`  
  Hover states, dark backgrounds, overlay text.
- **Neutral Dark (text/UI):** `#1E293B` (slate-800)  
  High-contrast body text, headings, icons.
- **Neutral Light (background):** `#F8FAFC` (slate-50)  
  Clean, bright background for readability.
- **Warm Accent:** `#F4B400` (gold)  
  Sparingly for award icons, callouts, special highlights.
- **Cool Accent:** `#06B6D4` (cyan-500)  
  Optional secondary accent for links, secondary CTAs, gradient blends.
- **Gradient Pairing:**  
  From `#1B6F35` (deep green) → `#06B6D4` (cyan) with ~10–15% overlay over hero photo.

### CSS Variables
```css
:root {
  /* Brand Green */
  --brand-green: #26A84A;
  --brand-green-dark: #1B6F35;

  /* Neutral Base */
  --bg: #f8fafc;        /* slate-50 */
  --fg: #1e293b;        /* slate-800 */

  /* Accents */
  --accent-warm: #f4b400;     /* gold */
  --accent-cool: #06b6d4;     /* cyan-500 */
  --accent-cool-dark: #0e7490;/* cyan-700 */

  /* Hero Gradient Stops */
  --hero-from: #1b6f35;  /* deep green */
  --hero-to: #06b6d4;    /* cyan */
}
```

### Tailwind Class Alignment
- Brand green: `text-[var(--brand-green)] bg-[var(--brand-green)] hover:bg-[var(--brand-green-dark)]`
- Cool accent: `text-cyan-600 hover:text-cyan-700`
- Warm accent: `text-[var(--accent-warm)]`
- Neutrals: `bg-slate-50 text-slate-800`

---

## Typography

- **Headings:** Bebas Neue (or Oswald) — tall, athletic numberboard feel.
- **Body/UI:** Inter (fallback: system-ui).
- **Scale:**
  - H1: 42–56
  - H2: 28–36
  - Body: 16–18
  - Stat numerals: 40–64

Font wiring:
- Bebas Neue variable added in `layout.tsx` and applied to `html` class.
- Heading classes in `globals.css` should be updated to use `var(--font-bebas)`.

Example:
```css
.heading-xl {
  font-family: var(--font-bebas), var(--font-poppins), system-ui, sans-serif;
  font-size: clamp(2.625rem, 5vw, 3.5rem);
  line-height: 1.1;
  letter-spacing: 0.015em;
}
```

---

## Layout Patterns

- **Hero:**  
  Full-bleed photo with soft gradient overlay (deep green → cyan).  
  Left-aligned text block with Name, positions/class year, CTAs.
- **Sections:**  
  Carded blocks on neutral background, 8–12px gaps mobile, 24–32px desktop.
- **Grid:**  
  Stats 2×3 on mobile → 3×4+ on desktop; consistent card heights.
- **Edges:**  
  `rounded-2xl`, subtle hover shadows.

---

## Components

- **Badge row:** “Class of 2027”, positions, throws/bats as pill badges in brand green.
- **Stat tiles:**  
  Big numeral, small label; underline in brand green on hover.
- **Highlights:**  
  Responsive grid, lazy-loaded, link to videos.
- **Schedule:**  
  Simple table (date | opponent | result | link).
- **Contact card:**  
  Brand green CTA button; `mailto: lananolan08@gmail.com`, Twitter `@LanaNolan02`, optional QR.

---

## Motion

- Minimal fade/slide-up on enter (150–250ms).  
- Subtle hover micro-interactions (1–2px lift, slight scale).

---

## Imagery

- **Hero:**  
  Crisp action shot, subject positioned to balance text.  
  Gradient overlay: deep green → cyan, 10–15% opacity.

Hero image from `photos-config.json` → `activePhotos.heroImage` fallback logic.

---

## Accessibility

- Contrast AA+ for text on overlays.
- Hit targets ≥44×44px, visible focus, reduced motion respected.

---

## Example Section Order

1. Hero  
2. Quick stats strip  
3. Bio & academics  
4. Highlights grid  
5. Schedule/results  
6. Contact + socials

---

## Tailwind Tokens

- Containers:  
  `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Card:  
  `rounded-2xl bg-white shadow-sm hover:shadow-lg transition`
- Headings:  
  `tracking-tight font-semibold` (Bebas for H1)
- Accent:  
  `text-[var(--brand-green)] hover:text-[var(--brand-green-dark)]`

---

## Implementation Map (Actionable)

1. **Typography:** Switch headings to Bebas Neue.  
2. **Color tokens:** Add green palette vars to `globals.css`, migrate components.  
3. **Hero gradient:** Use brand green → cyan gradient stops.  
4. **Stat tiles:** Add cyan/green underline hover states.  
5. **Hover effects:** Apply `.card-hover` or Tailwind hover utilities.  
6. **Accessibility:** Check AA contrast, tap target sizes.


---

## Performance Measurables (Visual Pattern)

- Use the **Card + Table** pattern for measurables.
- Table columns: **Metric | Value | Unit | Date | Notes**.
- Typography: metric (semibold), value (xl, brand green), unit (sm, slate-500).
- Example row: *Vertical Jump | 6 | inches | 2024-01-01 | To be updated with latest measurement*.
- Optional: small source badge (e.g., “Team Combine 2024”).

**Table classes (Tailwind):**
- Wrapper card: `card card-hover p-4 md:p-6`
- Table: `w-full text-sm`
- Header: `text-left text-slate-500 uppercase tracking-wide text-xs`
- Cells: `py-3 border-b border-slate-100` (last row borderless)
- Emphasize numeric cell: `text-lg font-semibold text-[var(--brand-green)]`

---

## Calendar (Visual Pattern)

- Provide a **Calendar card** that complements the Schedule table.
- Views: **Month** (default) and **Week**.
- Event pill style: `rounded-full px-2 py-1 text-xs bg-[var(--brand-green)]/10 text-[var(--brand-green)] hover:bg-[var(--brand-green)]/15`.
- Today indicator: subtle ring or bold date.
- Keep hover/focus states accessible.

**Calendar container classes:**
- Wrapper: `card card-hover p-4 md:p-6`
- Header row (month nav): flex with prev/next buttons using outline style.
- Grid: 7-column CSS grid; dates in top-right of each cell (xs text), events list below.

---
