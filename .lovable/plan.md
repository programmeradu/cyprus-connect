# One place to drop any document

## 1. Homepage line
"Made in Cyprus, for Cyprus" sits in the section explaining why local knowledge matters (EAC bills, Cyprus deadlines, Greek). Swapping to "for EU" on its own would weaken that point. Change it to **"Made in Cyprus, ready for Europe"** (EL: "Φτιαγμένο στην Κύπρο, έτοιμο για την Ευρώπη"), with the sentence under it saying we start with Cyprus rules and bills and follow EU law (CSRD/VSME, CBAM, EUDR).

## 2. "Add figures" becomes "Add data"
Same page and address, upgraded:

- One big drop zone at the top: PDF, photo, CSV, Excel. Several files at once.
- Each file shows a card that moves through: Reading → Recognised as … → Proposed figures → Added / Rejected.
- The page tells the user what kind of document it thinks it is:
  - EAC electricity bill → existing EAC reader
  - Nicosia Water Board bill → existing water reader
  - Bank statement (PDF/CSV) → spend lines, sorted with the existing Cyprus categoriser; fuel/energy spend becomes estimates, supplier payees feed the Suppliers list
  - Fuel receipts, waste invoices, other utility invoices, spreadsheets of consumption → general reader
  - Anything else (ID cards, contracts, menus, unreadable scans) → **rejected with a plain reason** and what to upload instead
- **Nothing is added silently.** For every figure the card shows the number, unit, period, and the exact line from the document it came from. The user confirms (can edit) before it goes into company data. Low-confidence or mismatched-period figures are flagged, never auto-filled.
- Duplicate check: the same bill or month already recorded is caught, with "replace" or "skip".
- The manual form stays below, as "Or type figures in".
- Every saved document is kept under the company's documents and logged in the activity record, so Verde and agents see it.

## 3. Ways in
- Home: a small "Drop a bill or statement" card that opens Add data (and accepts a drag directly).
- Agent and Verde suggestions that ask for a document: an "Upload" button that opens a file picker right there and runs the same reader; if the item needs context, it links to Add data with the request pre-selected.
- Setup checklist "add your first bill" step points to Add data.
- Integrations keeps its EAC and water uploads unchanged; they now use the same shared reader.

## 4. Out of scope now
Other cities' water boards and other utilities (to discuss later). Scanned PDFs without text still need the image-reading AI key; until then the page says so and asks for a photo instead.

## Technical details
- New `src/lib/documents/classify.server.ts`: cheap byte/text checks first (EAC/water patterns, bank statement headers, CSV column sniffing), AI classification only as fallback via `lovable-ai.ts`. Returns `{ kind, confidence, reason }`.
- New `src/lib/documents/extract.server.ts`: routes to `eac.server.ts`, `water.server.ts`, a bank-statement parser (CSV + PDF text, reusing `bank/categorize.ts`), or a general AI extractor that must return a verbatim source quote per figure (quote checked against document text, as Grant scout does).
- New `POST /api/console/documents/intake` (via `readUpload` in `validate.ts`, `logger` errors): returns a proposal, stores the file in `documents` with status `proposed`. `POST /api/console/documents/intake/[id]/confirm` writes confirmed figures through the existing emissions save path and activity record.
- Small SQL migration in `scripts/sql/0041_document_intake.sql` (+ `src/db/schema.ts`): `documents.detected_kind`, `proposal jsonb`, `decision`, `decided_at`.
- Page reads/writes only through `workspace-store.ts`. Shared `DocumentIntake` component reused by Home card and task "Upload" buttons. EN/EL strings for everything. Replace the old `/api/documents/process` use in the calculator; keep tests for classify/extract and the input guard green.
- AGENTS.md rule: all user document uploads go through the one intake reader.
