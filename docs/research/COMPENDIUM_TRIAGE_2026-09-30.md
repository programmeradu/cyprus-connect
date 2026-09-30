# Triage of the 106-phase compendium (30 Sep 2026)

Source: `docs/research/Vuneli_Grand_Compendium_106_Phases.md` (98 chapters, a tool catalogue, not specs).
Rule: a tool is adopted only if it runs on Cloudflare Workers + Postgres, serves a real user need before Slush, and fits AGENTS.md. Integration is not innovation (DMRID/RIF test).

## Adopt now (small, fits the stack, fixes a known gap)
| Ch | Tool | Gap it fixes |
|---|---|---|
| 30 | Vision LLM extraction (Zerox pattern) via the AI gateway | Cyprus bill OCR unproven; receipts 17.6% |
| 27 | pdf-lib hash + QR stamp on PDFs | Signed CBAM/report PDFs have no tamper check |
| 91 | WBCSD PACT v2 `GET /footprints` data model | Supplier emission data has no standard format |
| 2/90 | Promptfoo-style eval set + Playwright visual checks | No regression tests on agent output or UI |
| 97 | WhatsApp supplier chaser (official Cloud API, not Evolution) | Supplier email replies are the weak link; risk-2 approval still applies |

## Later (after pilots prove demand)
Ch 13 Theseus bridge (needs Customs Dept access; "5 days to 15 min" is unverified), 68 regulatory horizon, 64 tenders, 73 solar, 87 notifications, 54/88 usage billing.

## Reject for now
- Needs servers/GPUs we do not run: 3, 22, 32, 51, 63, 69, 78, 83, 89, 37.
- Conflicts with AGENTS.md queue decision (Trigger.dev, Inngest, Temporal, Redpanda): founder sign-off required.
- Out of scope or no customer: 9, 44, 11, 15, 98 (ZK), 27-EAS blockchain part, 77 stealth scraping (portal ToS/legal risk).
- Invented numbers in the doc (e.g. "95% read rate", "sub-20ms") are claims, not evidence. Do not reuse in pitch material without a source.
