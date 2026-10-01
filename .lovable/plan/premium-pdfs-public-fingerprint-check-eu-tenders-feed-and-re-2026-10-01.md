# Premium PDFs, public fingerprint check, EU tenders feed and remaining tools

## 1. PDF redesign: an official document, not a webpage

What is wrong now: one big photo on the cover, small labels above headings, thin generic fonts, and layouts that look like web cards. The fix is a real document design used the same way on every page.

**Tool decision (research first, then commit)**
- Run the same 3-page Board Summary through three engines and compare the pages side by side:
  1. current engine with a proper print layout (baseline)
  2. **Typst**: a typesetting engine built for publishing quality (kerning, proper justification and hyphenation, OpenType features, Greek support). Runs in the browser and on the server as WebAssembly (`@myriaddreamin/typst.ts`), so it works with our Cloudflare hosting
  3. HTML/CSS print via **Paged.js** rendering (only if 1 and 2 fall short)
- Keep the best one, judged on printed pages, not on code. Typst is the expected winner, because tools like it, not web renderers, are what make finance and government documents feel official.

**Typography (licensed for commercial use, with full Greek)**
- Headings: **Source Serif 4** (display weights): an authoritative serif with no "website" feel
- Body and tables: **IBM Plex Sans** (regular 400 / medium 500 / semibold 600, never light), plus Plex Sans tabular figures so numbers line up in columns
- Numbers in data and fingerprints: **IBM Plex Mono**
- One type scale for all documents (e.g. 9.5pt body, 8pt tables, 22pt titles), set to a baseline grid
- Fallback check: every glyph used in the Greek reports renders correctly (no Noto mixed mid-sentence)

**Page system, same across every page of every document**
- Cover: typographic, not photographic. Title, company, period, document ID, issue date, and a subtle Cyprus-inspired generated pattern (contour or coastline linework in brand green, Nano Banana) used as a *border/margin motif*, not a photo
- Interior pages: a running header (Vuneli mark, document title, section), a footer (page X of Y, document ID, short fingerprint) and a thin brand rule
- Section openers: a numbered section with a short summary box, no small labels above headings
- Tables: ruled financial style (hairlines, zebra-free, right-aligned figures, units in the column head)
- Charts: flat, printed-chart style matching the palette
- Back page: data sources, method, fingerprint plus QR code linking to the public check page
- Remove: eyebrows, the full-bleed photo, rounded "card" boxes, shadows

**Applies to:** Board Summary, VSME/report PDF, CBAM declaration. Regenerate samples (EN + Greek, long 40-line CBAM) and check them visually page by page before handing over.

## 2. Public fingerprint check page
- `/[locale]/verify` (EN + EL, hreflang): upload a PDF or paste/scan the fingerprint, and the page answers "matches a document Vuneli issued on DATE for COMPANY-ID" or "no match"
- Store at issue time: fingerprint, document type, issue date, anonymised document ID (no figures, no company name unless the owner chooses to show it)
- Clear wording: this proves the document is unchanged since Vuneli issued it; it is not a legal e-signature
- Rate-limited public endpoint under `/api/public/verify`

## 3. EU tenders and law feed
- **TED** (EU tenders, official API): daily cron pulls Cyprus and EU green/energy/sustainability tenders by CPV code into shared storage; shown under Action plan → Funding as "Tenders", with source links, deadlines and a "why it matches" explanation from company facts
- **EUR-Lex**: watch CSRD/VSME, CBAM, ETS2 and taxonomy acts; changes create Deadlines entries and an agent note
- Agents can read both through typed tools

## 4. Remaining tools from the review
- **OpenSanctions**: sanctions/PEP check on suppliers (Suppliers page + Weaver tool), with source and date shown
- **pdf-lib**: attach metadata and fingerprint to final PDFs and fill in the official forms where needed
- **Docling-style table reading**: better bill/invoice tables (needs a hosted service, because it can't run on our hosting. Will propose before adding)
- **axe-core + MSW**: accessibility checks and offline API tests in CI
- **Promptfoo**: evaluation set for Verde/agent answers (no fabricated figures, cites sources)

## Order
1. PDF engine bake-off and font/page system (show you sample pages before converting all three documents)
2. Convert all three PDFs and add the QR code to the check page
3. Public check page
4. TED + EUR-Lex feeds
5. OpenSanctions, pdf-lib, axe/MSW, Promptfoo; Docling proposal

## Technical notes
- New table `document_fingerprints` (SQL in `scripts/sql/`, mirrored in schema); feeds in `tenders`/`legal_watch` tables; all reads via `workspace-store.ts`
- Fonts self-hosted as files (OFL licences), subset per document
- If Typst wins: templates in `src/lib/pdf/typst/`, data passed as JSON, and the shared kit/fingerprint logic stays; the AGENTS.md PDF rule is updated
- Founder: none for 1–3; TED needs no key; OpenSanctions commercial use needs an API key
