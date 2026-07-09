---
name: Real logos & real assets rule
description: Never use 2-letter avatar fallbacks, generic gradient placeholders, or stock clichés — always ship real logos and real context-aware imagery
type: constraint
---

Synthesized from the same 30-layer UI/UX + anti-vibecode research (Refactoring UI, Linear/Vercel/Stripe/Notion craft posts, Brad Frost, NN/g trust studies, Baymard checkout research, Rauch on "taste"): the single fastest tell of a vibecoded / lazy site is **fake identity assets** — initialed circles where a logo belongs, gradient blobs where a product screenshot belongs, `<div class="w-10 h-10 rounded-full bg-gradient">AB</div>` in testimonials, and generic Unsplash abstracts on every hero.

## Findings

1. **Logos build trust; initials destroy it.** NN/g and Baymard both find real customer/partner logos measurably lift perceived credibility; initial-avatar fallbacks read as "we don't actually have these customers".
2. **Placeholders leak into production.** The vibecoded pattern is `Avatar` component with `fallback={initials}` and no `src` ever wired — ships as final. Every avatar/logo slot must have a real image path, or the slot is cut from the design.
3. **Stock abstracts = vibecode signature.** Purple gradient blobs, generic "team collaborating at laptop", isometric SaaS illustrations — all banned. Assets must be **context-aware**: generated or sourced for the specific page's subject (CBAM steel imports → actual steel/port imagery; SBTi → actual pathway chart, not a leaf).
4. **Screenshots > illustrations for product proof.** Real UI screenshots of the tool/dashboard beat any illustration. If the feature exists, show it.
5. **Consistent treatment.** All logos same optical height (~24px in rows, ~32px in grids), grayscale or monochrome on light bg unless brand requires color, never squished, never on gradient chips.

## Applied rules (enforced across VerdeIQ)

- **No `<Avatar>` initials fallback as final UI.** If we don't have a real headshot/logo, remove the element — no "AB" circles in testimonials, team, customer rows, comments.
- **No `bg-gradient-to-br from-primary` circles** as logo/avatar substitutes.
- **Customer/partner logo rows: real SVG logos only.** Use Logo.dev connector (`img.logo.dev/<domain>`) or ship real SVG files. If we can't get the real logo, that customer doesn't appear.
- **Hero/inline imagery: context-aware only.** Each page gets its own generated hero tied to its actual subject (see `mem://design/context-aware-assets`). No reusing one abstract across pages. No Unsplash generics.
- **No emoji as brand/logo/icon.** Ever.
- **No lorem/placeholder images (`via.placeholder.com`, `picsum.photos`) in shipped code.**
- **Team/testimonial photos: real people, real quotes with real name + title + company + linked source — or the section is cut.** Never fabricate testimonials.
- **Asset scale/treatment locked:** logo rows 24px height, grayscale (`opacity-70`), 40px horizontal gap, single row wrap; hero images 16:9 or 4:3, `object-cover`, `rounded-lg`, border `foreground/10`.
- **File hygiene:** binary assets >100KB migrate to CDN via `lovable-assets` (see skill), never committed raw.

## When we genuinely don't have a real asset

Do NOT invent one and do NOT drop in a placeholder. Options in priority order:
1. Cut the element from the layout entirely.
2. Replace with typography-driven treatment (name in Fraunces + role in Instrument Sans, no circle).
3. Generate a real, subject-specific image via `imagegen` (see context-aware-assets rule).

Never: initials avatar, gradient circle, stock abstract, emoji, `?` glyph.

## Approved exceptions

- **SubscriptionBadge** (`src/components/billing/SubscriptionBadge.tsx`): plan-tier emoji `👑 / ⭐ / 🌱` are allowed. Treated as tier glyph, not brand identity. Do not propose removing.
