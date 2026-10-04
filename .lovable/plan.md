# Action plan: costed projects that Vuneli checks were really done

## Goal
Replace the points-and-checkbox Action plan with a list of real projects built from the company's own bills. Each project shows its cost, savings, carbon cut and matching funding. Nobody can tick a project done: Vuneli confirms it from bills or bank payments, or asks for a document.

## What the person sees

```text
Action plan                                         [Download dossier]
Projects drawn from your own bills, with costs, funding and proof.

Cost  |  After funding  |  Savings / yr  |  CO2e cut / yr  |  Payback
-----------------------------------------------------------------------
[Ideas] [Under way] [Being checked] [Confirmed]
-----------------------------------------------------------------------
Rooftop solar, about 25 kWp                         Idea
Based on 12 months of EAC bills (44,200 kWh)
Cost  €… (range)   Savings €…/yr   Cut … t/yr   Payback … yrs
Funding: <matched call from Grant scout, only if strong fit>
How Vuneli will check it: 2 EAC bills after the start date + invoice
[Start project]                          [How these figures are worked out]
```

- **Summary strip**: totals only from projects with real inputs; anything missing reads "needs your figure", never a guess.
- **Four stages**: Idea, Under way, Being checked, Confirmed. "Mark as complete" is removed.
- **Project card**: figures, the inputs behind them (bill months, unit price, factor and its source), matched funding, and a checklist of the proof needed.
- **Proof panel**: shows each check as passed, waiting or needed. If Vuneli can't confirm a step itself, it asks for a named document and opens the existing document drop.
- **Confirmed tab**: before/after bill comparison per project.
- Greek and English throughout; mobile layout checked; no truncated figures.

## How projects are suggested
1. A fixed project library (solar, heat pump / AC upgrade, LED, water fixtures, fleet, supplier data request), each with a written formula and required inputs.
2. Code picks only projects the company's data supports (e.g. solar only with electricity bills; fleet only with fuel spend). Each card says which records triggered it.
3. AI may only reword the explanation for this company; it never sets a number.
4. Costs are ranges from a dated, sourced table; if no source exists the card asks for a supplier quote instead of inventing a price.
5. Funding attaches only when Grant scout already rates the call strong or one answer away.

## How Vuneli confirms a project
| Check | Source | Passes when |
|---|---|---|
| Bill drop | EAC / water bills already in Vuneli | Enough bills after the start date show a drop against the same months before, beyond a set threshold |
| Payment | Linked bank (read-only) | A payment to the named supplier near the stated amount, confirmed by the person |
| Document | Unified document drop | Invoice, commissioning or disposal paper whose date, supplier and item the reader finds and quotes |
| Supplier data | Suppliers list | The supplier's declared figure is on file |

- Each project type lists which checks it needs. All required checks must pass before "Confirmed".
- If a check can't run automatically (no bank link, too few bills), the project stays "Being checked" and a task asks for the specific document.
- A failed or unclear bill check is shown honestly ("no drop seen yet") with the numbers.
- Every stage change and piece of evidence goes into the shared activity log, so Home, agents and Verde see the same state.

## Dossier
A Typst PDF (same look as the Board Summary) listing confirmed and planned projects, inputs, sources, funding and evidence references, with the usual fingerprint for `/verify`.

## Technical details
- **SQL** `scripts/sql/0043_action_projects.sql`, mirrored in `src/db/schema.ts`:
  - `action_projects` (workspace, project type, stage, inputs json, computed figures json, cost range, matched funding id, started_at, confirmed_at).
  - `action_checks` (project, kind: bill_drop | payment | document | supplier_data, status: waiting | passed | failed | needed, evidence refs to documents / bank_transactions / bills, numbers json, checked_at).
  - Old `actions` / `user_actions` stay readable; points/credits no longer shown on this page.
- **Library** `src/lib/actions/`: `catalog.ts` (project types, formulas, required checks, sources), `roi.ts` (deterministic maths, pure), `suggest.server.ts` (picks projects from workspace data), `verify.server.ts` (runs checks), `AGENTS.md` with the rule.
- **Sourced constants** `src/data/actions/` with dated source links; missing source means the value is absent, not defaulted.
- **API** `/api/console/actions` (list, start, stage change) and `/api/console/actions/[id]/evidence` (attach document or confirm payment), through `src/lib/validate.ts`; page uses `workspace-store`.
- **Checks re-run** when a bill is saved, a bank sync finishes, or a document is kept, plus the existing agent cron.
- **UI** rebuild of `src/app/[locale]/app/actions/page.tsx` with new `ProjectCard`, `ProofPanel`, `SummaryStrip`; FundingPanel stays further down for unmatched calls.
- **Tests**: ROI maths, suggestion triggers, every check pass/fail/wait path, "no source → no number", stage rules (cannot confirm without required checks).
- Update `AGENTS.md`, `docs/FOUNDER_EXTERNAL_SETUP.md` (run migration 0043), roadmap.

## Order of work
1. Schema, catalog, maths, tests.
2. Suggestion and verification logic, API.
3. Page rebuild and proof panel, both languages.
4. Dossier PDF.
5. Signed-in visual check on desktop and mobile.
