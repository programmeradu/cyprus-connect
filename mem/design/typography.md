---
name: VerdeIQ typography — pending replacement
description: Current locked pairing (Fraunces + Instrument Sans) plus the open action item to replace Fraunces with a licensed/self-hosted display face
type: design
---
Current locked pairing across every page (marketing, learn/pillars, tools, app dashboard, auth, legal):

**Display / headings:** `Fraunces` (variable, optical sizing). Token: `--editorial-display`.
**Body / UI / small text:** `Instrument Sans` (400 body, 500/600 UI, 700 emphasis). Token: `--editorial-sans`.

**Rules:**
- Body has `font-variant-numeric: tabular-nums` and `font-feature-settings: "ss01","cv11","cv06"` set globally.
- Headings have `font-optical-sizing: auto` and `letter-spacing: -0.015em` (hero size can go to `-0.02em`).
- Never use weight 300 on body/UI text. Body = 400, UI labels = 500, emphasis/buttons = 600, headings = 600–700.
- Small caps / eyebrow labels: weight 500–600, size 12–13px, tracking 0.02–0.06em.
- Rely on the global `body`/`h1..h6` CSS in `src/app/globals.css` — do NOT re-declare font-family in components.
- Do NOT introduce Inter, Space Grotesk, Geist, Poppins, DM Sans, Montserrat, or any other family without explicit user approval.

**Pending action — Fraunces replacement (agreed 2026-07-14):**
Fraunces is on the pols.dev anti-slop rejected list (free Google display serif carrying every brand). The plan is to replace it with a licensed or self-hosted display face — a real brand decision, not another Google family. Do NOT swap Fraunces for another Google serif (Cormorant, Playfair, Petrona, Young Serif, Bodoni, Didot are all rejected too). This swap requires the user to pick / license the face; keep Fraunces in the codebase until they do, but flag the debt whenever touching typography.
