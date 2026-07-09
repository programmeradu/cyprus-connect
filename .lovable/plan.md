# VerdeIQ `/tools` — Interactive Tools Hub Build Plan

Goal: rank on high-intent ESG/CBAM/CSRD tool searches across EU + global English by shipping 5 deep, free, no-signup interactive tools under a dedicated `/tools` section.

---

## Target keywords (validated via Semrush)

| Route | Primary keyword | Vol | KD |
|---|---|---|---|
| `/tools` (hub) | esg reporting tool | 590 US | 30 |
| `/tools/ghg-calculator` | ghg calculator + scope 3 emissions calculator | 210 + 50 | 45 / 31 |
| `/tools/cbam-report-generator` | cbam calculator + cbam report | 20 + 30 | 0 / 25 |
| `/tools/double-materiality` | double materiality matrix + template | 50 + 30 | 0 |
| `/tools/vsme-template` | vsme template + vsme reporting template | 40 | 0 |
| `/tools/eu-taxonomy-checker` | eu taxonomy tool + calculator | 40 + 20 | 0 |

All KDs are near-zero except the hub's — wide-open niche. Real reachable demand ≈ 10-20x these single-country volumes across 27 EU markets.

---

## Architecture

```text
src/app/[locale]/tools/
  page.tsx                          → hub (grid of all 5 tools)
  layout.tsx                        → shared MarketingHeader + Footer
  ghg-calculator/page.tsx
  cbam-report-generator/page.tsx
  double-materiality/page.tsx
  vsme-template/page.tsx
  eu-taxonomy-checker/page.tsx

src/components/tools/
  ToolShell.tsx                     → shared: hero, tool slot, methodology, worked example, FAQ, related-guides, CTA
  ToolCard.tsx                      → hub grid card
  MethodologyBlock.tsx
  WorkedExample.tsx
  ExportPdfButton.tsx               → branded PDF export (shared)

src/components/tools/widgets/
  GhgCalculator.tsx                 → full-page Scope 1/2/3 calculator, Climatiq-wired
  CbamReportGenerator.tsx           → CN-code table, quarterly aggregation, XML/PDF export
  DoubleMaterialityMatrix.tsx       → 2D IRO plotter + stakeholder scoring
  VsmeTemplateBuilder.tsx           → guided EFRAG VSME Basic form
  EuTaxonomyChecker.tsx             → NACE picker → eligibility + DNSH checklist

src/data/tools/
  index.ts                          → tool registry (slug, keywords, category, related-pillar slugs)
```

Each tool page follows the **same 7-block layout** (locks in E-E-A-T + on-page SEO):
1. Hero (H1 = primary keyword phrased naturally, subhead, "free · no signup" badge)
2. Interactive tool (works immediately, above the fold on desktop)
3. Methodology (sources, formulas, factor version, last-updated date)
4. Worked example (real numbers, Cyprus/EU context)
5. FAQ (5-8 questions, `FAQPage` schema)
6. Related guides (2-3 links into `/learn/*`)
7. CTA → sign up for VerdeIQ platform

---

## SEO wiring (per tool page)

- Bilingual EN + EL with `hreflang` alternates
- Head metadata: unique title, description, og:title, og:description, og:image (per-tool, generated), twitter:card
- Canonical + `og:url` self-referencing
- JSON-LD stack: `SoftwareApplication` + `HowTo` + `FAQPage` + `BreadcrumbList`
- Sitemap: add 12 new URLs (6 pages × 2 locales) to `src/app/sitemap.ts`
- Reciprocal internal links: matching Learn pillars link to their tool, tools link back
- Robots: `/tools/*` explicitly allowed (already covered by current rules)

---

## Design system

Reuse existing editorial system (from Learn redesign):
- `--editorial-sans` (Geist/Inter) typography
- `MarketingHeader` from `src/components/marketing/`
- `verdeiq-range` slider style
- Numeric `01/02/03` section prefixes, sharp borders, no gradients/pills/decorative icons (per `mem://constraints/no-icons-no-pills`)
- Per-tool generated hero image (context-aware, per `mem://design/context-aware-assets`)

---

## Build order (ship in this sequence)

**Phase 1 — Foundation + biggest keyword (this batch)**
1. `/tools` hub + shared `ToolShell`, `ToolCard`, `MethodologyBlock`, `WorkedExample`, `ExportPdfButton`
2. **GHG Calculator** — full Scope 1/2/3, region selector, Climatiq-wired, PDF export, methodology page, worked example, 8 FAQs
3. Sitemap + Learn pillar cross-links for these two
4. Generated hero images (EN + shared)

**Phase 2 — Timely + underserved** ✅ SHIPPED
5. **CBAM Report Generator** ✅ — CN-code table (46 codes, 6 sectors), per-line direct/indirect factors with override, effective carbon price, quarterly XML draft + PDF + CSV export
6. **Double Materiality Matrix** ✅ — 10 pre-loaded ESRS topics, dual-axis scoring (severity/scope/irremediability/likelihood + magnitude/likelihood), interactive SVG matrix, threshold slider, PDF + CSV export

**Phase 3 — Long-tail authority** ✅ SHIPPED
7. **VSME Template Builder** ✅ — 12-step guided walkthrough of EFRAG VSME Basic Module (B1–B12), typed fields (text/number/yes-no/select) with hints, per-step navigation with progress bar, PDF/JSON/CSV export, persistent client-side state.
8. **EU Taxonomy Eligibility Checker** ✅ — 30 curated eligible activities across all six objectives, NACE/keyword search, primary-objective picker, DNSH walk-through for the other 5 objectives, Art. 18 minimum safeguards, aligned/partial/not-aligned verdict, PDF + CSV export.

**Phase 4 — Polish + measurement** ✅ SHIPPED
9. ✅ Full EL translations — every tool page (metadata + copy blocks) and every widget (labels, buttons, exports) ships bilingual EN/EL. Data schemas (`vsme-basic-module.ts`, `nace-taxonomy.ts`, `cbam-cn-codes.ts`) carry `{ en, el }` labels throughout.
10. ✅ SEO rescan triggered — verifies JSON-LD (`SoftwareApplication` + `HowTo` + `FAQPage` + `BreadcrumbList`), hreflang, canonical, and sitemap coverage (12 URLs: 6 pages × 2 locales) for all 5 tools + hub.

---

## Technical details

- **Climatiq**: reuse `src/lib/climatiq.ts` + `/api/emissions/estimate` and `/api/emissions/batch` for GHG Calculator
- **PDF export**: reuse `src/lib/pdf/export-report.ts` pattern; brand each tool's export
- **CN codes for CBAM**: static JSON in `src/data/tools/cbam-cn-codes.ts` (starter set: iron/steel, aluminium, cement, fertilisers, electricity, hydrogen)
- **NACE codes for Taxonomy**: static JSON `src/data/tools/nace-taxonomy.ts` — Annex I/II eligible activities
- **VSME schema**: static JSON `src/data/tools/vsme-basic-module.ts` — 11 Basic Module disclosures per EFRAG standard
- **Materiality**: pure client-side state (no persistence needed for v1); "save as PDF" is the export path
- **Analytics**: track tool starts + completions via existing `ConsentedAnalytics`
- **No new backend routes required for Phase 1** — Climatiq endpoints already exist

---

## Success signals (post-launch, ~8 weeks)

- All 12 tool URLs indexed in GSC
- Hub page ranking top-20 for "esg reporting tool"
- At least 2 of 5 tools ranking top-10 for their primary keyword (KDs are ≤5, this is realistic)
- Organic tool → app signup conversion tracked

---

## Out of scope (explicitly deferred)

- SBTi calculator (low volume, complex methodology)
- PPA / renewable cost calculator (off-topic vs. compliance focus)
- Green Claims Directive checker (too early, deadline 2026)
- Emission Factor Database as standalone tool (needs massive backend; kept as internal to GHG Calculator)
- User accounts / saving tool results server-side (v2 feature)
