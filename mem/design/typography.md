---
name: VerdeIQ typography system
description: Locked font pairing (Fraunces display + Instrument Sans body) and typographic rules for all pages
type: design
---
Typography is locked. Every page — marketing, learn/pillars, tools, app dashboard, auth, legal — MUST use this pairing. Do not introduce Inter, Space Grotesk, Geist, Poppins, DM Sans, Montserrat, or any other family without explicit user approval.

**Display / headings (h1–h3, large hero type):** `Fraunces` (variable, optical sizing on). Serif, editorial, distinctive. Loaded via Google Fonts in `src/app/globals.css`. Token: `--editorial-display`.

**Body / UI / small text:** `Instrument Sans` (400 body, 500/600 UI, 700 emphasis). Neutral B2B workhorse — less overused than Inter/Space Grotesk. Token: `--editorial-sans`.

**Rules:**
- Body has `font-variant-numeric: tabular-nums` and `font-feature-settings: "ss01","cv11","cv06"` set globally in `body {}`.
- Headings have `font-optical-sizing: auto` and `letter-spacing: -0.015em` by default; hero-size type can go to `-0.02em`. No `tracking-tight` on small headings.
- Never use weight 300 on body/UI text. Body = 400, UI labels = 500, emphasis/buttons = 600, headings = 600–700.
- Small caps / eyebrow labels: weight 500–600, size 12–13px, tracking 0.02–0.06em, NOT 10px + 0.24em.
- Numbers in tables/prices/dates: always tabular-nums (inherited from body).
- Inline components using `style={{ fontFamily: ... }}` must reference Instrument Sans for body/UI and Fraunces for display, not the previous Space Grotesk stack.

**How to apply in new components:**
- Rely on the global `body`/`h1..h6` CSS in `src/app/globals.css` — do NOT re-declare font-family in components.
- If a component needs an inline style prop (SSR-safe rendering), import from `ToolShell`'s `SANS`/`DISPLAY` pattern or use `font-family: var(--editorial-sans)` / `var(--editorial-display)`.
