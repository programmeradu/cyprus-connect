# Vuneli — Post-QA Build Plan (4 Oct 2026)

Sources:
- `Vuneli app QA report – 4 Oct 2026.md` (120+ tested items)
- `Vuneli: blind spots, gaps and what to build next – 4 Oct 2026.md` (62 items, 10 strategic bets)

> [!WARNING]
> **Check before building.** Some tools named below came from AI research and have not been checked. Confirm each one exists, is maintained and does what is claimed before relying on it. In particular: "OntoESG", the "Bank of Cyprus B2B API" (we would need a corporate data-sharing agreement), "CitationGraph", Accord Project (inactive, and more than we need), and Typia's "C++ speed" claim.
>
> Every choice must also follow `AGENTS.md`:
> - **Model calls** go only through the router `src/lib/vuneli-ai.ts`. It sends text calls to Groq when `GROQ_API_KEY` is set, otherwise to the Lovable gateway; images and embeddings go to Lovable. BAML, DSPy and Instructor must sit behind it or be dropped.
> - **PDFs** already use Typst in the browser (`src/lib/pdf/typst-render.ts`).
> - **Bill email** already arrives via Cloudflare Email Routing → worker `email` handler.
> - **Uploads** go through the one intake reader (`src/lib/documents/`).
> - **Python tools** (DocTR, PyMuPDF, OpenPyXL, TATR) cannot run in the Worker.

---

## Part 1 — What already works

- EAC electricity bill PDFs are read correctly (kWh, dates, bi-monthly split).
- WDD water bills and bank CSVs are read and sorted into categories.
- CBAM import lines calculate certificate costs and produce valid XML drafts.
- The compliance engine applies 2026 EU rules and cites the actual laws.
- The full interface is available in Greek and English.

## Part 2 — The main gap: trust

| Problem | Detail | QA refs |
|---|---|---|
| Figures disagree | App ~0.535 kg/kWh, free tool 0.622, marketing 0.489. The same 1,840 kWh bill gives different results. | F14, F115, F24, F104, F6 |
| Fingerprint broken | The UI shows only 12 characters, but `/verify` expects all 64. Our own CBAM draft returns "Not in our register". | F114, F80, F88 |
| Evidence not enforced | "Upload evidence for Scope 1" can be closed in one click with no file attached. | F57 |
| Env errors shown to users | "Email sending is not set up yet (RESEND_API_KEY and EMAIL_FROM)" | F81 |
| Other companies visible on leaderboard (GDPR) | A new workspace sees another company (StaUniverse) by name, with its score. | F66 |
| Account basics missing | No sign out, change password or team roles. | F74, F100, AUTH-03..06 |
| Verde shows raw tool tokens | e.g. `read_footprint`, `co2e_total` appear in replies. | F52, F53 |
| Intake fails on real-world files | Phone photos, Greek diesel receipts, empty PDFs | F20/F26, F21, F28/F29 |

## Part 3 — The 3 features most likely to win investment

Since the EU Omnibus I change, CSRD only covers companies with more than 1,000 employees and more than €450m turnover. Cypriot SMEs will report because a **bank, a large customer, a tour operator or CBAM customs** asks them to.

1. **VSME Passport.** Under EU rules, large buyers cannot ask small suppliers for more than the EFRAG VSME standard. One verified link plus a PDF pack, shared with every buyer, bank and auditor. Public link: `/passport/{company}`.
2. **Bank ESG Questionnaire Pack.** Bank of Cyprus and Hellenic Bank ESG borrower questionnaires, filled in from bills the customer has already uploaded. This makes banks a distribution channel.
3. **Reverse Questionnaire Inbox.** The SME forwards a client's questionnaire (PDF or Excel). We read it, fill it from verified data and send it back ready to sign.

## Part 4 — Order of work

### Step 1 — Fix the 5 issues that break the demo (48h)
1. Put all emission factors in **one versioned table** (EAC grid factor, with its source and year).
2. Set up Resend keys in production. Users should never see env error text.
3. Use the full 64-character SHA-256 fingerprint everywhere, so `/verify` returns "Verified" for real drafts.
4. Tasks that require evidence cannot be closed without a file attached (server returns 422).
5. Add account settings (sign out, change password). Hide other companies on the leaderboard (opt-in only, anonymous by default).

### Step 2 — Build the 3 investment features (weeks 2–3)
1. One-click VSME Passport (link + PDF).
2. Pre-filled Bank of Cyprus / Hellenic Bank ESG questionnaire.
3. Questionnaire Inbox (forward a client's PDF or Excel and get it back filled in).

---

## Part 5 — Tools and approaches by area

### 1. Emission factors: one source of truth (F14, F115, F24, F104, F6)
- **Versioned factor registry** (`src/lib/factors/registry.ts` + SQL table in `scripts/sql/`). Each factor stores: `factor_key`, `region`, `vintage`, `unit`, `source_authority` (e.g. EAC TSO / AIB residual mix). Every calculator, report and widget reads from it.
- **Typia** (github.com/samchon/typia): checks types at build time. *Optional; we already validate in `src/lib/validate.ts`.*

### 2. Bill and receipt intake (F20/F26, F21, F28/F29)
- **DocTR** (Mindee): OCR that copes with skewed or crumpled photos. *Python, so it would need a separate service.*
- **BAML** (boundaryml.com): enforces a fixed structure on AI extraction (Greek VAT IDs, diesel litres, tariff tiers). *Must call models through `vuneli-ai.ts`.*
- **unpdf** (PDF.js-based): fast text and page count at the edge. Reject empty or locked PDFs before calling vision models.

### 3. Fingerprints and audit trail (F114, F80, F88, F57)
- **Full 64-hex SHA-256** fingerprint (optionally a Merkle root over PDF + line items + factor IDs) in `document_fingerprints`, plus a QR code on each PDF linking to `/verify?h={hash}`.
- **Evidence-gated task state machine** (XState pattern): a task can only be resolved with a valid `evidence_file_id`.

### 4. Security and tenant privacy (F74, F100, F66, AUTH-03..06)
- **Better-Auth organization plugin**: team invites, roles (Owner, Sustainability Manager, External Auditor), passkeys, sign out on all devices. *Admin rights stay in `user_roles` only.*
- **Tenant filter on every query.** Leaderboard is opt-in with anonymous labels.

### 5. Email and Verde reliability (F81, F52, F53)
- **Resend + React Email**: Greek/English emails, DKIM and SPF on the domain.
- **Two-pass Verde replies.** Pass 1 gathers facts. Pass 2 writes the reply, and a fixed filter removes any leftover tool tokens before streaming.

### 6. Revenue, marketplace and industry packs
- **Verified Savings Engine** (IPMVP): weather-normalised baseline compared with bills after a retrofit, producing a savings certificate.
- **PVGIS API** (EU JRC): solar sizing, plus Cyprus tax-deduction and payback calculations.
- **Accountant console**: one login across 20–50 client workspaces.
- **HCMI hospitality pack**: emissions per guest-night, plus summer chiller load.
- **CBAM cash-flow forecaster**: quarterly certificate costs for steel, cement and aluminium importers.
- **Background queue** (Cloudflare Queues, or Upstash QStash / Inngest): heavy PDF, XML and OCR work runs off the request path.

---

## Part 6 — Engine 1: Bank ESG Questionnaire Pack

```
[EAC bills & invoices] → [Question-to-field mapper]
        → [Borrower facility match] → [Answer citations]
        → [Typst pack] → [Bank-ready green loan pack]
```

1. **Map questions to fields.** Map each bank question ("Annual grid electricity (kWh)", "Fleet fuel spend (EUR)", "Rooftop PV (kWp)") to our data fields, aligned with the EBA ESG ITS templates. *Claimed tool: "OntoESG" (not checked). A mapping table we maintain ourselves may be enough.*
2. **Facility match.** Bank of Cyprus developer portal (Berlin Group open banking). *Needs a partnership. Start with a manual facility reference.*
3. **Citation for every answer.** Each figure links to its source bills, meter dates, kWh breakdown and grid factor.
4. **Green loan margin rules.** Encode rules such as "35 bp discount if energy intensity is under 120 kWh/m²/yr and Scope 1+2 falls by more than 8%" and produce an eligibility memo. *Accord Project was suggested. A simple rules file is probably enough.*
5. **Typst** for the PDF pack (already our renderer), fingerprinted and checkable at `/verify`.

## Part 7 — Engine 2: Reverse Questionnaire Inbox

```
[Client ESG PDF/Excel] → [forward to <token>@inbox domain]
   → [postal-mime + queue] → [layout/table parse]
   → [semantic match to verified data] → [confidence-scored review]
   → [fill original file] → [return for signature]
```

1. **Email in.** Use the existing Cloudflare Email Routing and worker `email` handler (same pattern as bill email). `postal-mime` extracts the attachments, then the work goes to a queue.
2. **Layout and tables.** LlamaParse, or Microsoft Table-Transformer, for PDFs. SheetJS or Univer for Excel (cell positions, validation rules, formulas).
3. **Matching.** Embeddings (via `vuneli-ai.ts`) compared against our ESG knowledge base (GHG Protocol, VSME, CSRD), then a structured match to fields, e.g. "ISO 50001 EMS?" → `governance.iso50001_status`. Yes/no answers are converted to the client's dropdown options.
4. **Review screen.** Green (>95%) filled from verified bills. Amber (70–95%) inferred, needs confirmation. Red (<70%) no data yet, with an upload box right there.
5. **Fill the original file.** Excel: write the cells and keep formulas and formatting (ExcelJS in JS; OpenPyXL needs Python). PDF: fill AcroForm fields (pdf-lib in JS; PyMuPDF for XFA). Add a verification appendix with fingerprints.

### Why these two help with growth
Every returned questionnaire or bank pack carries a footer: *"Verified by Vuneli — check at vuneli.com/verify?h=…"*. Each document we send out introduces Vuneli to a large buyer or a bank.
