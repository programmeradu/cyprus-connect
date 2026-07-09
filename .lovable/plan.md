## Goal

Replace the "Live preview / Dashboard" block on the landing page with a lighter, context-aware surface, and give news its own dedicated destination. Keep only Carbon Footprint + Report Visuals as standalone tools. Add a global floating AI assistant on marketing pages.

## 1. News

**New page: `/news`**
- Curated ESG/climate feed from existing `/api/news` route.
- Topic filters as underlined tabs (no pills): All / CBAM / CSRD / Energy / EU Taxonomy / Markets.
- Each item: source, timestamp, headline (serif), 1-line summary, external-link glyph.
- Sidebar rail: "EU Regulatory Timeline" — next upcoming deadlines (CBAM definitive period, CSRD wave 2, VSME adoption dates) as a vertical numbered list.
- Below the feed: "VerdeIQ takes" — 2-3 short editorial commentaries on the week's biggest stories (static MD content initially, extensible later).
- Bilingual EN/EL, full head() metadata, hreflang.

**Header nav**
- Add "News" link to the header (both `MarketingHeader` and the inline header in `page.tsx`).
- Add "News" to the footer nav.

**Landing ticker**
- Replace the entire `DashboardDemo` section on `/` with a slim horizontal auto-scrolling marquee.
- Continuous CSS-driven translateX loop, pauses on hover.
- Format per item: `SOURCE / timestamp — headline`, separated by a slash divider glyph.
- Eyebrow above: `Latest / ESG & climate wire`.
- Trailing link: `All news →` routing to `/news`.
- Pulls top ~12 items from `/api/news` via a server function (SSR-safe fallback to a static placeholder set on failure).

## 2. Context-aware widgets on landing

A single editorial section titled "Right now / where you are", replacing the demo. Three compact widgets in a grid, driven by geo + time:

1. **Grid intensity now** — visitor's country carbon intensity (gCO2/kWh) from the existing electricity-maps client. Big numeral, small delta vs 7-day avg, region label.
2. **Next EU deadline** — computed from a static regulatory calendar; shows "CSRD Wave 2 filings — 47 days" style. Numeric prefix, serif title, muted subtext.
3. **This week in climate** — top headline from `/api/news` filtered to policy tag, with source + date.

No cards with pills. Numeric prefixes (01/02/03), thin dividers, serif titles, sans body — consistent with the existing editorial system.

## 3. Tools cleanup

- Keep as standalone `/tools/*` pages: **GHG Calculator** (existing) and **Report Visuals** (already extracted).
- Remove other demo widgets (metrics, benchmarks, goals, actions, suggestions) from the marketing surface entirely — they live inside the authed `/app` dashboard and don't belong on the landing page.
- Delete the `DashboardDemo` import from `src/app/[locale]/page.tsx`. Leave `DashboardDemo` intact for `/tools/report-visuals` (uses `focusTab="report"`).
- Tools hub `/tools` stays as-is but the listing is trimmed to the two real tools + any existing compliance widgets already there.

## 4. Floating AI assistant

- New component `FloatingAIAssistant` — fixed bottom-right on marketing pages only.
- Minimal: circular button (no icon-chrome — a single monogram letter or "AI" wordmark), expands into a compact chat panel.
- Streams from an existing `/api/gemini/stream` or equivalent route (reuse what's wired).
- Mounted in the marketing layout / __root wrapper but **excluded on `/app/*` routes** via a path check.
- Uses `mem://constraints/no-icons-no-pills` — no Lucide, no rounded pill chrome. Rectangular expandable panel with editorial typography.

## 5. Files touched

- `src/app/[locale]/page.tsx` — remove DashboardDemo section, add ticker + context section.
- `src/app/[locale]/news/page.tsx` — **new**, news hub.
- `src/components/news/NewsTicker.tsx` — **new**, marquee.
- `src/components/news/NewsFeed.tsx` — **new**, filtered feed for /news.
- `src/components/news/RegulatoryTimeline.tsx` — **new**.
- `src/components/landing/ContextWidgets.tsx` — **new**, geo+time widgets.
- `src/components/ai/FloatingAIAssistant.tsx` — **new**.
- `src/app/[locale]/layout.tsx` — mount floating assistant conditionally.
- `src/components/marketing/MarketingHeader.tsx` + inline header in `page.tsx` — add News link.
- `src/components/legal/SiteFooter.tsx` — add News link.
- `messages/en.json` + `messages/el.json` — new strings for news, ticker, widgets, assistant.

## 6. Order of work

1. News page + ticker + header/footer nav links (highest user value).
2. Context widgets replacing demo section.
3. Floating AI assistant.
4. Remove obsolete DashboardDemo tabs from landing.

Ask before step 3 whether you want me to bundle the assistant now or defer to a follow-up turn — it's the largest single addition.

## Open question

Should the news ticker render server-side (SSR from `/api/news` during route load, better SEO, no CLS) or client-side (fresher, no build-time coupling)? Recommendation: **SSR via a server function with a 5-minute cache**, falling back to a static seed list if the fetch fails.
