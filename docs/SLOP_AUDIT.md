# VerdeIQ · Anti-Slop Audit

Reference doctrine: [`docs/slop.md`](./slop.md) (pols.dev · The Anti-Slop Design Law).
Scope: production **Next.js** app under `src/app/[locale]/**` and its supporting components. The TanStack shell mirror was reverted — the Lovable preview now just redirects to `verdeiq.stauniverse.tech`, and this audit covers only what actually ships.

Legend: ✅ passes · ⚠️ borderline / needs cleanup · 🔴 clear slop tell

---

## 1. Marketing / public surfaces (`/`, `/pricing`, `/learn`, `/tools`, `/news`, footer)

### ✅ What's already right
- **No eyebrow pills.** The landing replaces the "pill + icon" hero eyebrow with a hairline rule + `00 / VerdeIQ` numeric marker (`src/app/[locale]/page.tsx:161-166`). Every section uses the same numeric prefix ("01 / Why VerdeIQ", "02 / The Platform"…), which is a real system, not an ornament.
- **No decorative Lucide row on the landing.** `src/app/[locale]/page.tsx` imports **zero** `lucide-react` icons. The "integrations" strip uses real brand SVGs from `cdn.simpleicons.org` — the doctrine's "use real marks" case, not a fake icon-pack row.
- **No gradient / glow buttons.** `PremiumButton` (`src/components/ui/PremiumButton.tsx`) is a flat `bg-primary` rectangle with `rounded-md`, no gradient, no glow, no arrow flourish. The primary CTA in the hero is **single** ("Get started free") — no filled+outlined preset pair.
- **No fake mac window, no code-snippet prop, no floating tag on the hero image.** Backdrop is a real photograph with a legible scrim + SVG turbulence grain to kill banding (`page.tsx:145-154`).
- **Pricing is not the "three-tier glow + MOST POPULAR pill" preset.** `PricingTable.tsx` uses a single hairline grid (`grid gap-px bg-border/60`), no glowing border, no floating pill — the "popular" plan is marked with the same `eyebrow` type treatment as everything else, no chip. Features are numbered, not checkmarked.
- **Cyprus voice is real.** Copy mentions Cyprus VAT, EUR pricing, Strovolos address — this is written for a specific market, not generic SaaS.
- **`mem/constraints/anti-vibecode-ui.md` + `no-icons-no-pills.md`** already codify most of these rules — the constraint memory is doing its job on marketing surfaces.

### 🔴 Clear tells still shipping

1. **`.gradient-text` on the footer wordmark** (`src/components/legal/SiteFooter.tsx:57` uses `className="gradient-text ..."`).
   Doctrine hit: *"Gradient-filled headline text"* and *"logo lockup (gradient tile + wordmark)"*. The whole rest of the site avoids gradient type — the footer wordmark shouldn't be the one place it slips back in. **Fix:** drop `gradient-text`, set it in `var(--editorial-serif)` at the same weight/tracking the site header uses.

2. **Footer typography inconsistency.** Same file mixes `font-[family-name:var(--font-geist-sans)]` on the wordmark with the editorial serif everywhere else. Doctrine hit: *"the standard footer"* — tidy, expected, no idea. **Fix:** align the footer wordmark to the site's actual voice (Fraunces editorial serif) and delete the Geist reference.

3. **Em-dashes in user-facing copy** — 140 hits across `messages/*.json` and `src/app/[locale]/**`. Doctrine hit: literally the first named tell (*"Em dashes — a classic tell of AI writing"*). Examples: `messages/en.json:44` "Yes — contact sales…", `page.tsx` meta title "VerdeIQ — AI-Powered Sustainability…". **Fix:** sweep both `messages/en.json` and `messages/el.json`. Replace `—` with `:` where introducing, `.` where separating clauses, and `,` when the pause is short. This is a copy pass, not a code change.

4. **`shadow-premium` in `globals.css`** (three-layer symmetric drop shadow, `0 2px 8px + 0 4px 16px + 0 8px 32px`).
   Doctrine hit: *"the default all-around shadow"* — the "float everything on a fluffy cloud" utility. It's defined and available site-wide. **Fix:** either remove the utility entirely, or narrow it to a single directional layer (`0 6px 18px -8px …`) tinted to the surface, not black.

### ⚠️ Borderline

5. **`SiteFooter.tsx` uses `bg-background/60 backdrop-blur`.** Frosted-glass footer is on the doctrine's list only when it's decorative. Here it's fine functionally, but combined with the gradient wordmark it reads as "generic AI polish". Ties to fix #1.

6. **Landing has both a `PremiumButton` primary and a `PremiumButton variant="outline"` on the CTA block** (`page.tsx:434-443`, "Get started free" + "See pricing"). Doctrine hit: *"the filled-button-next-to-outlined-button pair"* is called out specifically. The hero itself has a single CTA (good) — but the pre-footer CTA reverts to the preset. **Fix:** one action, or differentiate by type/weight/position instead of fill-vs-outline.

7. **Nav gradient scrim over the hero photo.** Cosmetically fine, but `page.tsx:141-144` stacks three gradients on the same image — the tuning is right, just fragile. Keep in mind: the doctrine's "hard colour seams between sections" rule applies at the hero → next-section boundary; the SectionDivider hairline is the right call there and it's holding.

---

## 2. Authenticated app surfaces (`/[locale]/app/**`)

This is the part of the codebase that is not aligned with the doctrine.

- **`lucide-react` is imported by 14 dashboard pages** (`src/app/[locale]/app/{page,onboarding,leaderboard,actions,insights,learn,analytics,calculator,integrations,studio,...}`). Every "feature card" uses a Lucide glyph. Doctrine hit: *"Lucide React package"* is the very first named tell.
- **`rounded-full` chip labels are used across 20+ dashboard files** — status pills, difficulty pills, category pills. Doctrine hit: *"Labels and metadata as tinted pill chips, everywhere"* and the project's own `mem/constraints/no-icons-no-pills.md`, which the app pages violate.
- **`bg-gradient-to-br from-primary/10 to-primary/5` inside a `rounded-xl` around each icon** (e.g. `integrations/page.tsx:364,478,520,722`). Doctrine hit: *"an icon or a logo with a box behind it"* + *"oversized icon in a colored tile"* — the exact preset, four times in one file.

**Interpretation:** the marketing site was clearly redesigned against the doctrine. The dashboard is still the earlier hackathon UI (see `src/app/[locale]/app/README.md` — it was built with a Lucide-based custom icon set and pill badges as a "design system"). The two halves of the app now speak different visual languages.

### Recommended cleanup for the dashboard (not applied here — this is an audit)

- **Delete pill chips.** Difficulty, category, status — move to a typographic hierarchy (weight, colour, an underline or hairline rule) using the same `eyebrow` treatment the marketing site uses.
- **Rip out `lucide-react` from the dashboard chrome.** Keep it only for functional glyphs (close, chevron, search) inside `src/components/ui/*` shadcn primitives. Feature cards, stat cards, and action cards should carry their weight through number + type, not an icon in a tinted tile.
- **Delete the `bg-gradient-to-br from-primary/10 …` icon tiles** in `integrations/page.tsx` (and any siblings). If a mark needs to appear, place it bare on the surface at real logo size.
- **Retire the `.shadow-premium` and `.gradient-text` utilities** from `globals.css` once the dashboard stops depending on them.

---

## 3. Fonts

Currently in use (from `src/app/globals.css`): the site's `--editorial-serif` is **Fraunces**, `--editorial-sans` is **Instrument Sans**, plus **Geist Sans** referenced in the footer.

- Doctrine explicitly names **Fraunces + Work Sans** as an AI pairing, and warns that even "the tasteful font swap" is still slop when the pick is by reputation. Fraunces alone isn't fatal (it's genuinely well-drawn and there's a real editorial system on top of it — numeric prefixes, hairlines, italic emphasis), but this is the single item where the site is most exposed to the "tasteful font swap" critique.
- **Action:** don't panic-swap it. The system built on top of Fraunces is the more valuable asset than the family choice. If a real brand pass happens later, that's the moment to commission or license a display face; until then, keep Fraunces and delete the Geist import so the site speaks one voice.

---

## 4. Summary of shippable fixes (in order of impact)

| # | Where | What | Effort |
|---|---|---|---|
| 1 | `messages/en.json`, `messages/el.json` | Replace em-dashes in user-visible copy (`—` → `:`, `.`, or `,`) | S · copy sweep |
| 2 | `src/components/legal/SiteFooter.tsx` | Remove `.gradient-text` from wordmark; use editorial serif; drop Geist | XS |
| 3 | `src/app/globals.css` | Remove `.shadow-premium` and `.gradient-text` (or make shadow directional) | XS |
| 4 | `src/app/[locale]/page.tsx:434-443` | Collapse pre-footer filled+outlined CTA pair into a single primary action | XS |
| 5 | Dashboard (`src/app/[locale]/app/**`) | Remove Lucide + `rounded-full` chips + `bg-gradient-to-br` icon tiles across feature cards | M · multi-file |
| 6 | Later | Reconsider Fraunces once a real brand identity is commissioned | — |

Items 1–4 are copy/CSS-only and can go into the very next pass. Item 5 is a real design refactor of the dashboard and should be scoped as its own task.

---

*Audited on 2026-07-16 against `docs/slop.md`.*
