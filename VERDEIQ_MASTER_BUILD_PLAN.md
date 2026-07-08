# VerdeIQ — Master Build Plan (Product + Integrations + SEO, in one loop)
**Version:** 1.0 · **Date:** 2026-07-08 · **Sources merged:** `CYPRUS_RESEARCH.md` (20 layers, product/regulatory/GTM) + `CYPRUS_INTEGRATIONS.md` (15 layers, T0→T3 connector strategy)

> **Rule of this document:** Every phase ships three things together — (1) product feature, (2) required integration(s), (3) an SEO increment (routes + metadata + content + schema + sitemap). No phase is "done" until Google can crawl and rank what we just built. By the end of the last phase, VerdeIQ's public surface should already be indexed, linked to, and topically authoritative for Cyprus SME sustainability queries.

---

## 0 · Operating principles

1. **Cyprus-only positioning.** EL/EN bilingual, EUR-only, jurisdictional accuracy is the moat — reflect that in every H1, meta description, and JSON-LD.
2. **SEO is a build tool, not a launch task.** Each merged PR/turn adds: route(s), `<head>` metadata, sitemap entry, an internal link from an existing page, and (where applicable) `Article` / `FAQPage` / `Product` / `Organization` JSON-LD.
3. **Locale routing already in place** — `/[locale]/…` with `en` and `el`. Every new public route ships in both locales with proper `hreflang` (`en`, `el-CY`, `x-default`).
4. **Canonical domain:** `https://verdeiq.lovable.app` until custom domain is set. Update `NEXT_PUBLIC_SITE_URL` once switched.
5. **"SEO Definition of Done" checklist** (applied every phase):
   - Unique `<title>` <60 chars containing the primary keyword
   - Unique `meta description` <160 chars with CTA
   - Single H1 mirroring the target query
   - Canonical + `og:url` self-referencing
   - `og:image` present (hero/cover, absolute HTTPS)
   - `hreflang` alternates for `en`, `el-CY`, `x-default`
   - Sitemap entry added, robots.txt not blocking
   - ≥1 internal link in from an existing indexable page
   - Relevant schema.org JSON-LD embedded
   - Lighthouse SEO score ≥95 on the new route

---

## 1 · Target keyword clusters (Cyprus SME ESG)

Anchor every route to one primary + 2–3 secondary keywords. All in both EL and EN.

| Cluster | Primary (EN) | Primary (EL) | Owner route |
|---|---|---|---|
| **CSRD/VSME cascade** | "vsme reporting cyprus" | "αναφορά βιωσιμότητας ΜΜΕ Κύπρος" | `/[locale]/csrd-vsme` |
| **CBAM** | "cbam cyprus importer" | "cbam Κύπρος εισαγωγέας" | `/[locale]/cbam` |
| **EU ETS2** | "ets2 fuel cost cyprus" | "ets2 κόστος καυσίμων Κύπρος" | `/[locale]/ets2` |
| **EAC tariffs** | "eac tariff calculator" | "τιμολόγιο ΑΗΚ υπολογιστής" | `/[locale]/eac-tariff-calculator` |
| **Carbon footprint SME** | "carbon footprint calculator cyprus" | "ανθρακικό αποτύπωμα Κύπρος" | `/[locale]/carbon-calculator` |
| **RIF/RRF grants** | "rif green grants cyprus sme" | "χορηγήσεις πράσινες ΜΜΕ Κύπρος" | `/[locale]/grants` |
| **Sector: hotels** | "hotel sustainability software cyprus" | "λογισμικό βιωσιμότητας ξενοδοχεία Κύπρος" | `/[locale]/sectors/hotels` |
| **Sector: halloumi/dairy** | "halloumi carbon footprint" | "χαλλούμι αποτύπωμα άνθρακα" | `/[locale]/sectors/halloumi` |
| **Sector: construction** | "cbam construction cyprus" | "cbam κατασκευές Κύπρος" | `/[locale]/sectors/construction` |
| **Comparisons** | "verdeiq vs plan a / persefoni cyprus" | — | `/[locale]/compare/…` |

Content cadence: 1 pillar page per cluster + 3–5 supporting posts published across phases (see per-phase SEO deliverables).

---

## 2 · Phased build plan

Each phase = 1–2 sprints. Format: **Product** → **Integrations** → **SEO**. Nothing merges without all three.

### Phase 1 — Compliance decision engine (buyer's first "aha")
**Product**
- Compliance wizard: 8-question flow → outputs which of {CSRD-wave1, CSRD-wave2, VSME, CBAM, ETS2, EED audit, EPBD, F-Gas, PPWR} apply, with Cyprus law number citations.
- Persist result on `compliance_profiles` table; drive gated modules from it.

**Integrations (T0)**
- Tax Department: TIC (Tax ID) validation regex + optional VIES lookup.
- Cystat NACE code picker (JSON dataset bundled).
- Companies Law Cap. 113 threshold table (bundled, versioned).

**SEO**
- New routes (EN + EL):
  - `/[locale]/compliance-check` — interactive tool page (indexable, H1 = "Cyprus ESG Compliance Check for SMEs")
  - `/[locale]/csrd-vsme` — pillar page
  - `/[locale]/cbam` — pillar page
- Schema: `SoftwareApplication` on `/compliance-check`, `Article` on pillars, `BreadcrumbList` everywhere.
- Add to `sitemap.ts` `PUBLIC_PATHS`; verify `robots.ts` isn't blocking (currently blocks `/*/app/` only — good).
- Internal links: homepage hero adds "Check my obligations →"; footer adds "Compliance" column with 3 pillar links.
- FAQ block on each pillar → `FAQPage` JSON-LD (8 Q&A each, EL/EN).
- OG images: generate 1200×630 cover per pillar (regulator badge + Cyprus flag motif).
- **Success metric:** GSC impressions on 3 new routes within 14 days; average position ≤30 by day 30.

---

### Phase 2 — Emission factor & activity data core
**Product**
- Cyprus-native factor registry (`emission_factors` table, effective-dated, source-hashed).
- Activity data ingest UI (electricity, LPG, diesel, petrol, LNG, waste, water, refrigerants).
- S1/S2/S3 breakdown card on dashboard.

**Integrations (T0/T1)**
- **EAC bill parser (T0):** upload PDF → OCR → tariff code + kWh + fuel adjustment.
- **DEFRA / EPA fallback factors** for missing S3 activities.
- **TSOC grid intensity poll (T1):** hourly scrape when endpoint publishes; fallback 620 gCO₂/kWh `[EST]`.

**SEO**
- New routes:
  - `/[locale]/carbon-calculator` — free unauth calculator (JS form) with server-rendered result page at `/[locale]/carbon-calculator/result/[hash]` (indexable canonical example results for long-tail).
  - `/[locale]/eac-tariff-calculator`
  - `/[locale]/emission-factors/cyprus` — reference table (rich, linkable asset).
- Schema: `HowTo` on the calculator, `Dataset` on `/emission-factors/cyprus`, `WebApplication` too.
- Programmatic SEO: 20 pre-computed example result pages ("Carbon footprint of a 15-room hotel in Paphos", etc.) — one per {sector × size × district} combo, linked from a hub page.
- Blog post 1: *"EAC fuel adjustment explained — how your Cyprus electricity bill actually works"* (targets `eac fuel adjustment`, low competition, high intent).
- Add all new routes to sitemap with `changefreq: monthly`.
- Internal links: compliance wizard result page now recommends specific calculator pages.

---

### Phase 3 — Accounting & ERP integrations (data at rest)
**Product**
- One-click connectors + evidence vault (signed source hashes for audit).
- Chart-of-accounts mapper → emission categories.

**Integrations (T0)**
- **SoftOne CY, Epsilon** — Cyprus market leaders; OAuth or API-key.
- **Xero (T2)**, **Sage (T1)**, **Odoo (T1)**, **SAP B1 (T1)**, **Dynamics 365 BC (T1)**.
- **Excel/CSV template (T0)** universal fallback.

**SEO**
- One landing page per integration: `/[locale]/integrations/{softone|epsilon|xero|sage|odoo|sap-b1|d365bc|excel}` (16 pages EL+EN).
- Each with: H1 "VerdeIQ + {Vendor} — sync {country} ESG data", 300–500 words unique copy, screenshots, `SoftwareApplication` + `Organization` JSON-LD referencing the partner.
- Hub: `/[locale]/integrations` (index) — internal links out to all 16.
- Blog post 2: *"How Cypriot accountants prepare a VSME report from SoftOne data"* (ICPAC-flavored, targets Big-4 partner queries).
- Reach out to ICPAC directory for a backlink from the partner page (off-page).

---

### Phase 4 — Reporting outputs (the paid workflow)
**Product**
- VSME PDF report generator (EL/EN, EFRAG template).
- CBAM XML export (regulator schema v2).
- ESRS iXBRL export (T1).
- Report scheduler + audit log.

**Integrations**
- Peppol BIS 3.0 e-invoicing sender (T2) — future-proof for CY e-invoicing mandate.
- Email-in `travel@<tenant>.verdeiq.cy` for booking parsing.

**SEO**
- Routes:
  - `/[locale]/vsme-report-template` — free downloadable template (lead magnet, gated with email → SEO-indexable landing).
  - `/[locale]/cbam-xml-export`
  - `/[locale]/esrs-checklist`
- Schema: `HowTo` on each, `Article` on `esrs-checklist`.
- Programmatic: one page per NACE sector explaining VSME materiality for that sector (~30 pages).
- Blog post 3: *"CBAM Q1 2026 declaration — a walkthrough for Cypriot importers"* (topical, timely, ETS2/CBAM cluster).
- Backlink target: RIF grant portal, ICPAC newsletter, EAC business pages.

---

### Phase 5 — Sector playbooks (buyer personas turned into pages)
**Product**
- Sector templates on onboarding: Hotel, Halloumi/dairy, Construction, Retail, Logistics, Professional services.
- Sector-specific KPI dashboards.

**Integrations**
- Hotel-specific: PMS connectors (Opera Cloud T2, Protel T1).
- Dairy: MilkFacts sector data (bundled).
- Construction: CBAM importer flow (T0).

**SEO**
- Pillar pages: `/[locale]/sectors/{hotels|halloumi|construction|retail|logistics|services}` (6×2=12 pages).
- Each pillar links to 3 supporting posts (18 blog posts total across Phase 5).
- Hotels example post: *"Sustainability reporting for Cyprus hotels 2026 — CSRD supply-chain requests and Travelife alignment"*.
- Schema: `Article` + `Product` (VerdeIQ plan applicable to sector) + `FAQPage`.
- Add JSON-LD `Organization` `knowsAbout` fields listing sector NACE codes.
- Internal linking: cross-link pillars in a "Related sectors" module.

---

### Phase 6 — Utility & fuel data (real-time)
**Product**
- Live EAC balance tile, DEPA gas price tile, monthly bill anomaly detection.

**Integrations (T0/T1)**
- **EAC OCPI (T0)** — where offered; PDF bill parser fallback.
- **CERA tariff cron scraper (T0)**.
- **DEPA gas price (T2)**.
- **Fuel cards (T1)** — Petrolina, EKO, Lukoil.
- **EV charging (T2)** — EAC eCharge, EvLoader.

**SEO**
- Route: `/[locale]/live-cyprus-energy` — public dashboard (grid intensity + tariff + gas price). This is a **link magnet**.
- Schema: `Dataset` + `Observation` (OG-image auto-updated hourly with current numbers via server-generated PNG).
- Blog post: *"Cyprus grid carbon intensity — live dashboard and methodology"*.
- Twitter/X card that changes daily → social signal loop.
- Add `<link rel="alternate" type="application/rss+xml">` publishing weekly summary → PR/backlink hook.

---

### Phase 7 — Grants, funding, financial rails
**Product**
- RIF/RRF grant eligibility checker; prefill of application (T2).
- Bank co-brand hooks (BoC, Hellenic Bank).

**Integrations**
- **PSD2 Open Banking (T1)** via Tink or Salt Edge.
- **RIF grant registry (T2)** — start with a curated JSON.

**SEO**
- Route: `/[locale]/grants` — searchable table of all open Cyprus green grants (updated weekly).
- Each grant → detail page `/[locale]/grants/[slug]` (~40 pages).
- Schema: `GovernmentService` + `MonetaryGrant` JSON-LD per grant.
- Blog post: *"Cyprus green grants 2026 — every open scheme, deadlines, and how VerdeIQ prefills the application"*.
- This cluster alone should drive branded + long-tail traffic; keep the table updated → freshness signal.

---

### Phase 8 — Trust, security, legal surface (essential for enterprise + Google E-E-A-T)
**Product**
- Consolidated Trust Center already partially in place (`/privacy`, `/terms`, `/security`, `/dpa`).
- Add: sub-processor register, DPIA templates, incident-response public log.

**Integrations**
- Sub-processor CSV export.
- NIS2/DORA readiness attestations (PDFs).

**SEO**
- Enhance existing routes with:
  - Author bylines with `Person` schema on legal pages (E-E-A-T signals).
  - `Organization` JSON-LD in `__root.tsx` head expanded with `founder`, `foundingLocation` (Nicosia), `areaServed` (Cyprus), `sameAs` (LinkedIn, GitHub, Companies Registrar entry once live).
  - `WebSite` schema with `SearchAction` (sitelinks search box eligibility).
- `/[locale]/trust` hub linking to all legal + status pages.
- Blog post: *"How VerdeIQ handles GDPR, NIS2 and DORA — a plain-English rundown for Cyprus SMEs"*.

---

### Phase 9 — Localization & content depth (EL is a growth channel)
**Product**
- Full EL translations for all UI strings + AI responses in Cypriot Greek register.
- EL-first support: Intercom, docs, sales calls.

**Integrations**
- Translation memory system (internal); optional DeepL API for AI-assist drafts (human-reviewed).

**SEO**
- Audit every EN page has an EL sibling and vice versa (`next-intl` already provides routing).
- Fix `hreflang` for any orphans; sitemap already emits alternates.
- Publish 10 EL-only posts targeting queries that don't exist in EN (e.g. "χαλλούμι CBAM αγελαδινό γάλα"). These face zero competition.
- Register site with Google Search Console for both `verdeiq.lovable.app` (and custom domain when set) and submit EL sitemap.

---

### Phase 10 — Comparison, alternatives, and off-site authority
**Product**
- Public "Migrate from X" wizard (Plan A, Persefoni, Sweep, Watershed, Normative).
- Data import mappers for common competitor exports.

**Integrations**
- One-off CSV/JSON importers per competitor.

**SEO** (this is the phase that steals traffic)
- Routes: `/[locale]/compare/{plan-a|persefoni|sweep|watershed|normative|greenly}-vs-verdeiq` (12 pages EL+EN).
- Each with fair comparison table, Cyprus-specific advantages, `Product` + `Review` schema (aggregate rating from our own G2 profile).
- Alternatives page: `/[locale]/alternatives/plan-a-alternatives-cyprus`.
- Off-page pushes: G2, Capterra, Product Hunt EU launch, ICPAC directory, Cyprus Chamber of Commerce (KEVE) member listing.

---

## 3 · SEO infrastructure to land NOW (before Phase 1)

Do these in the very next turn so every phase inherits the plumbing:

1. **Fix root metadata** — `layout.tsx` already reads `seo.home` translations ✅. Verify EL translation exists and is unique.
2. **Add `WebSite` + `Organization` JSON-LD** in `src/app/[locale]/layout.tsx` with `SearchAction`.
3. **Add per-locale `<link rel="alternate" hreflang>`** at the app root — already in `generateMetadata` ✅. Confirm `x-default` points to EN.
4. **Sitemap:** currently only 6 static paths. Wire it to include Phase-1+ routes as they land, and add dynamic entries for blog posts (`/[locale]/blog/[slug]`) once the blog exists.
5. **robots.ts:** already correctly excludes `/api/`, `/auth/`, `/*/app/*`, `/*/settings/*`, `/*/onboarding/*`. Confirm no accidental blocks on new marketing routes.
6. **Blog scaffolding:** create `/[locale]/blog` + `/[locale]/blog/[slug]` route with MDX content collection. Every phase will drop 1–3 posts here.
7. **Google Search Console verification meta tag** in root head (add now, verify once custom domain live).
8. **Analytics wired to GA4 + PostHog** with consent (already present via `ConsentedAnalytics`) — add a "SEO events" dashboard for scroll depth, doc downloads, sign-ups per landing route.
9. **Core Web Vitals** — set Lighthouse budget in CI; block deploys on LCP >2.5s / CLS >0.1 for the marketing routes.

---

## 4 · Per-turn workflow (how we actually build this)

Every build turn from now on follows this template:

```
1. Product change (feature code + DB migration + tests).
2. Integration wiring (connector, feature flag, evidence hash).
3. SEO increment:
   a. Add/modify route file with generateMetadata (title, desc, og, twitter, canonical, alternates).
   b. Add JSON-LD via a <Script type="application/ld+json"> in the page.
   c. Update sitemap.ts PUBLIC_PATHS (or dynamic loader).
   d. Add ≥1 internal link from an existing indexable page.
   e. Draft or extend 1 pillar/support blog post if the phase specifies.
4. Verification: `next build` clean, Lighthouse SEO ≥95 on the new route, GSC URL Inspection request submitted after deploy.
```

---

## 5 · Removals & tech debt

**✅ Completed 2026-07-08 (pre-Phase-1 cleanup):**
- ✅ Marketing copy USD → EUR (`src/content/trust.ts`, insights, settings, landing).
- ✅ Locale formatters standardized from `en-US` → `en-GB` (Cyprus EUR + DD/MM). Only `en` + `el` locales remain.
- ✅ Autumn removed: `autumn-js` uninstalled; `useCustomer` swapped for `useSubscription` across `BenchmarkComparator`, `EnergyCostCalculator`, `ComplianceChecker`; migration `drizzle/0017_drop_autumn_columns.sql` drops legacy sync columns.
- ✅ Paystack purged (12 files) — Stripe/Payments is single source of truth.
- ✅ AI credit checks/deductions centralized in `src/lib/ai-credits.ts` (used by 7 AI routes: gemini/analyze, generate-image, generate-video, learn/generate-course, reports/export, reports/export-pdf, compliance/documents/generate).
- ✅ Media Studio → **Report Visuals** (UI labels + i18n `en`/`el` updated; route still `/app/studio` pending redirect in Phase 4).
- ✅ Seed cleanup: 16 dev/demo seed files deleted (`run-all-seeds.ts`, backdate-*, fresh-realistic-customers, seed-9-users, reset-and-seed-*, media_generations, payment-data, etc.). Kept production seeds: `actions`, `courses`, `emissions_history`, `industry_comparisons`, `marketplace-projects`, `assessments`, `leaderboard`, `sustainability_metrics`.

**Still open (deferred to Phase 4 & Phase 8):**
- [ ] Rebuild `Report Visuals` generation pipeline to consume real ESG data (S1/S2/S3, YoY, CBAM) instead of generic prompts — Phase 4 alongside VSME PDF exports.
- [ ] Move `/app/studio` route → `/app/reports/visuals` with 301 redirect once feature is data-driven.
- [ ] Confirm `sitemap.ts` never emits dev-only or auth-gated routes (currently OK — only 6 marketing paths).
- [ ] Delete any remaining legacy Stripe direct-API code once Lovable Payments migration in `.lovable/plan.md` lands.

---

## 6 · Success metrics (measured every 2 weeks)

| Metric | Baseline (today) | Phase 5 target | Phase 10 target |
|---|---|---|---|
| Indexed pages (GSC) | ~10 | 120 | 400+ |
| Non-branded organic clicks/mo | ~0 | 800 | 6,000 |
| Ranking keywords (top 100) | ~5 | 300 | 1,500 |
| EL organic clicks share | 0% | 25% | 45% |
| Referring domains (Ahrefs) | <5 | 40 | 150 |
| Trial signups from organic | 0 | 30/mo | 250/mo |

---

## 7 · Cross-references

- Product/regulatory depth: **`CYPRUS_RESEARCH.md`** Layers 1–20.
- Integration T0→T3 sequence & acceptance criteria: **`CYPRUS_INTEGRATIONS.md`** Layers 1–15.
- Payments consolidation blocking Phase 8: **`.lovable/plan.md`**.
- Existing SEO plumbing already in the repo: `src/app/[locale]/layout.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `messages/{en,el}.json` under `seo.*`.

---

**Next turn (recommended):** Ship the "Phase 0" SEO infrastructure block (section 3 above) — it unlocks everything after. Then start Phase 1 (Compliance decision engine) with its 3 pillar pages and internal linking so we begin accumulating GSC impressions immediately.
