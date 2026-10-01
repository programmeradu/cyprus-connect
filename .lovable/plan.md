# Funding matching that knows the business + the last Greek text

## What the user gets

**Funding on Action plan and Home shows only the calls this business could plausibly win.** Each call gets one of three labels:

- **Likely fits**: every rule we can check is met.
- **Could fit, need info**: nothing rules it out, but a fact or document is missing. The card says exactly what is missing, for example "Yearly revenue" or "Proof of SME status".
- **Not a fit**: hidden by default. A "Show all calls" switch shows them with the reason, for example "Only for companies with more than 50 staff".

Each card says why it fits, in plain words, and links to the official source. When information is missing, an agent asks for it the way a consultant would. It asks one question per missing fact, groups requests across calls, and never asks twice for something already on file. Once the business answers or uploads a document, the matches update.

## How matching works

```text
 Official calls (EU portal, research.gov.cy, Invest Cyprus, KEBE, accelerators)
        |  daily: fetch + read each call's rules once
        v
 Call rules (stored)  ---------------+
                                     v
 Business picture  ----------->  Match check (per company, fixed rules)
 (profile, sites, revenue,           |
  staff, sector, bills, bank,        +--> Likely / Could fit (missing X) / Not a fit
  Registry record, documents)        |
                                     v
                         Missing facts --> agent request (approval rules unchanged)
```

1. **Read each call's rules once, not per company.** When a call is fetched, the AI pulls out its rules into a fixed form, with a quote from the call as evidence for each rule. The rules cover:
   - eligible countries
   - company size or SME status, staff and revenue limits
   - sector and activity
   - company age
   - whether partners are required
   - co-funding share
   - deadline and budget
   - required documents

   Rules it can't read stay "unknown". Unknown rules never count as met or as failed. The same extraction is reused for every business, so cost stays flat as the user base grows.
2. **Build the business picture from the shared company record.** It includes company facts, sites, revenue, staff, sector, country, Registry record (age, legal form), bill and bank data, uploaded documents and footprint. It reads the same source every page uses.
3. **The match check is fixed code, not AI judgment.** Each rule is compared to the picture: met, failed or missing. The result can be reproduced and explained, and the result for each call is stored with the reasons.
4. **Rank.** Likely fits come first, then those needing info, each ordered by deadline and how closely the topic fits the company's sector and footprint.
5. **Ask for what's missing.** A new "Grant scout" agent (risk 1, internal only) gathers the missing facts across the top calls. It creates one task for each fact, such as "Add yearly revenue (unlocks 3 calls)". Each task has an input or an upload slot. Answers save to the company record through the existing company-update path, then matching re-runs. Verde can answer these too, still with approval.
6. **Honest limits.** "Likely fits" means the stated rules are met. It is not a promise of an award. The page says so once, plainly.

## Greek text still in English

- **EU law names:** EUR-Lex publishes official Greek titles. Fetch and store the Greek title next to the English one, and show it on Greek pages. No AI translation is needed.
- **Funding call and tender titles:** Show a cached machine translation on Greek pages. A small "Translated automatically · see original" link points to the source. Each title is translated once and reused.
- **Agent notes:** New agent notes are written in the company's chosen language. Older notes are translated once on display and cached, with the same "translated automatically" marker.
- **"What changed" list on Home:** Already translated in this turn.

## Technical details

- New SQL in `scripts/sql/`, mirrored in `src/db/schema.ts`:
  - `funding_calls`: normalised calls, extracted rules as JSON with evidence quotes and an extraction hash.
  - `funding_matches`: per workspace and call, the verdict, met/failed/missing rule lists and when it was checked.
  - `text_translations`: keyed by source-text hash and locale.
  - `eu_feed_items.title_el` for the Greek EUR-Lex titles.
- Grant-alert sources are reused. Rule extraction runs in the existing daily cron, only for new or changed calls. It uses `openai/gpt-6-astra` on Responses with streamed structured output, and follows the gateway's error and pause rules.
- `src/lib/funding/match.ts`: a pure rule checker with unit tests covering size, revenue, country, age, sector, unknowns and missing facts.
- The match check re-runs when company facts change (the company-update hook), when a new document is filed and after each daily refresh.
- `/app` reads through `workspace-store.ts` via `/api/console/funding`. The agent tools are `funding_matches` (risk 0) and `request_company_fact` (risk 1).
- The old keyword matcher stays only as a first filter on topic before rule extraction.
- `AGENTS.md` gets a rule: funding verdicts are deterministic over extracted rules, and unknown rules never count as met.
- Verification: unit tests, then a real run against live calls for the QA company, with Likely / Need info / Not-a-fit counts checked in the browser in English and Greek.
