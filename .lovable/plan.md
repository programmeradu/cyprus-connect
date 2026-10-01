# Deadlines that know the business

## Goal
Show each business only the legal deadlines that apply to it, with the law it comes from, and update them automatically when the law changes. Full research: `docs/research/DEADLINES_2026-10-01.md`.

## What the user will see
- Deadlines page and Home "next deadline" list only obligations that apply, each with "why this applies to you" (e.g. "You imported 72 t of steel in 2026, above the 50 t CBAM threshold") and a link to the official text.
- "Might apply" items become one-tap questions (like Grant scout): "Do you sell cocoa, coffee, wood, soya, rubber, palm oil or cattle products?", "Annual turnover?", "Do you put packaged goods on the Cyprus market?". Answers save to the company record.
- A short "Doesn't apply to you" note for big rules (CSRD, CSDDD) so owners stop worrying, with the reason.
- When a law changes, a "What changed" entry and the deadline updates; nothing changes silently.

## How it works
1. **One rulebook in code** (`src/lib/obligations/rulebook.ts`): each obligation has the legal source (CELEX + article), a date rule (fixed or recurring), and a fixed applicability test on company facts. Only VERIFIED rows from the research go in first: CBAM (declaration, certificates, repurchase), CSRD/CSDDD (as "not in scope" explanations unless thresholds met), EUDR, energy audit/EnMS, Empowering Consumers, F-gas report (after reading Art. 26 thresholds), packaging EPR once dates are confirmed. Replaces the stale `compliance-tracker.ts` list and the 4-item `frameworks.ts`.
2. **Matching** (`match.ts`, fixed code, no AI): applies / might apply (one missing fact) / does not apply. Facts come from the company record, CBAM import lines (tonnes per year), bills (kWh to TJ) and bank spend. Results stored per workspace in `obligations` with a `rule_id`, reason and source; user-edited rows are never overwritten.
3. **Missing facts** become `question` tasks through the same path Grant scout uses; answers go through `company-update.server.ts`. New company fields: exact employees, turnover, EUDR commodities, packaging on Cyprus market, F-gas equipment, consumer environmental claims (migration 0039).
4. **Automatic law watch**: extend the existing EUR-Lex SPARQL feed to look for new acts amending the tracked base acts and new consolidated versions; hash-watch EC CBAM/EUDR/F-gas pages. A change opens a review task for a person ("CBAM text changed on <date>: check deadline rule") rather than letting AI rewrite dates. Runs on the existing hourly cron.
5. **Re-match** daily per workspace (the Deadlines agent) and immediately after a company fact changes.

## Technical details
- Migration `0039_obligation_rules.sql`: `obligations` gains `rule_id`, `reason`, `source_url`, `match` ('applies'|'might'|'not'), `user_edited`; company facts columns; `law_watch` table (base CELEX, last consolidated version, page hash, checked_at).
- Tests: rule dates (CBAM 30 Sep recurrence, EUDR size split), applicability per rule, user-edited rows preserved, law-watch detects a new amending act from a fixture SPARQL response.
- Remove `src/lib/compliance-tracker.ts` usage; landing-page box reads the same rulebook.

## Not included
- Rows still UNVERIFIED in the research (WEEE/batteries, E-PRTR, ESPR, Taxonomy, plastic-bag levy, packaging dates) stay out until a second research pass confirms them.
- No AI deciding whether a deadline applies or what date it is.
