# Funding matching that knows the business + the last Greek text

## What the user gets

**The app is not another list of public calls.** A dedicated agent, **Grant scout**, checks every call behind the scenes. The business only sees two kinds of result:

- **Strong fit**: every rule we can check is met and the topic matches what the business does. Shown on Action plan, and the best one on Home.
- **One answer away**: the call looks strong, but a fact or document is needed to confirm it, for example "Yearly revenue" or "Proof of SME status". It appears as Grant scout's question, not as a listing, and becomes a Strong fit, or disappears, once answered.

Everything else, including non-fits, weak topic matches and calls with too many unknowns, is never shown. There is no "show all" switch, because the public portals already list everything.

Each Strong fit says why it fits, in plain words, quotes the rule it meets, and links to the official call. Grant scout asks the way a consultant would: one question per missing fact, grouped across calls ("Add yearly revenue: confirms 2 calls"), never asking twice for something on file. When nothing fits, the page says so honestly and when Grant scout last checked.

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
4. **Keep only strong candidates.** A call is shown only when no rule fails, the topic match to the company's sector and footprint passes a fixed threshold, and at most two facts are missing. Results are ordered by deadline.
5. **Grant scout agent (risk 1, internal only).** It runs on the existing agent queue after each daily refresh and whenever company facts change. It reviews every call, stores the verdicts, and turns missing facts on strong candidates into grouped tasks with an input or upload slot. Answers save through the existing company-update path and trigger a re-check. Its run shows on Agents like every other agent; it can be paused and its steps are recorded. Verde can answer its questions too, still with approval.
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
