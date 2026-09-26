# Roadmap

## App build (audit 2026-09-26, docs/APP_AUDIT_2026-09-26.md)
- [x] Full app + repo-quality audit
- [x] P0 lock down API routes (session-derived userId, admin role table + gates, every body through validate.ts; guard test enforces it)
- [x] P1a invented figures removed (upload parsing, compliance score/dates/SEC, forecast noise)
- [x] P1b merge duplicate systems (unused /api/lms removed; one Gemini library)
- [x] P2a CI verify gate (typecheck+tests+coverage+audit before deploy), /api/healthz, env parity + test
- [x] P2b structured logger (src/lib/log.ts, error refs) + tests for validation/admin/log/PDF/filters
- [ ] P2c split files over 500 lines (app/page 837, studio 801, calculator 758, integrations 737, compliance 622, insights 599)
- [x] P3a Release 2: approve/reject tasks from the queue (writes audit trail)
- [x] P3b CSV export per console section
- [x] P3c Approve runs the exact act the agent asked for (fingerprint-checked); first act: CBAM signature
- [x] P3d Start agent run — real for Ledger (evidence sweep) via /api/console/agents/run; other agents still sample
- [x] P3f Agents page (/app/agents): run now + pause per agent, pause all, run history with step-by-step ledger per run

External actions for the founder: docs/FOUNDER_EXTERNAL_SETUP.md (updated every turn)

## One shared workspace (plan: .lovable/plan/one-shared-workspace-for-every-app-page-2026-09-26.md)
- [x] Phase 1a shared store (workspace-store.ts): one cache + one transport for all pages, writes invalidate every page + overview; guard test (tests/app-data-guard.test.ts)
- [x] Moved: Dashboard overview, Reports, Report detail, Leaderboard, Marketplace impact
- [ ] Phase 1b server: company facts (location, sites, revenue) stored once; Agents + CBAM mutations through useWorkspaceAction; every page write records an activity event
- [x] Phase 2 quick: Analytics, Grant alerts, Settings, Privacy (shared reads/writes; settings save refreshes analytics + leaderboard; analytics AI insights asked once per fresh data)
- [ ] Phase 3 medium: Actions (drop extra AI call, one-click complete), Marketplace list/detail/admin, Onboarding, Compliance
- [ ] Phase 4 heavy (rebuild + split each): Studio, Learn + course creator + lesson (course generator calls its own API over HTTP and notifies every user in the database - fix), Calculator, Insights, Integrations
- [ ] Found: exchange rates fetched ~4x per page load (CurrencyContext) - move into the shared store
- [ ] Greek translation of the 12 English-only pages, after pages settle

## Agent ecosystem (plan: .lovable/plan/vuneli-agent-ecosystem-plan-2026-09-26.md)
- [x] Step 1 runtime: job queue + lease, step ledger (SHA-256), tool contract with risk levels, autonomy policy (L3 always human), kill switch, retries/dead jobs, 15-min cron heartbeat
- [x] Step 2 (first part) Evidence sweep agent: asks for missing bills/receipts, flags obligations at risk, records coverage fact
- [ ] Step 2 (rest) pull bills automatically from connectors — blocked: no EAC/bank connector access yet
- [x] Step 3 CBAM agent: CSV import, annual draft (hash), supplier data requests, L3 signature via approval, /app/cbam page
- [x] CBAM supplier emails (L2, full text on approval, Resend) and Registry export XML (draft/final)
- [ ] CBAM: official definitive default values + full Annex I CN list; confirm rules (founder, see docs/FOUNDER_EXTERNAL_SETUP.md)
- [ ] CBAM: match export to the official Registry XSD (blocked: founder to supply XSD); live email send (blocked: RESEND_API_KEY + EMAIL_FROM)
- [ ] Step 4 research gates on I-25 (Grid Surplus) and I-26 (Upgrade Club) — blocked: TSO/EAC curtailment + tariff data, pilot SMEs, licence checks
- [ ] Steps 5-6 pilots, Upgrade Club, agent-to-agent exchange — depend on step 4
- [ ] Founder: set CRON_SECRET in Cloudflare (heartbeat skips without it); sign off Postgres queue vs Queues/Durable Objects
- [x] P3e period/site filter, PDF export (site filter shows data once readings carry a site)

(Research paused by founder.)

- [x] Keep-alive ping moved to a daily Cloudflare cron (GitHub kept as weekly backup)
- [x] Remove invented figures in Integrations benchmarks (revenue, team-size fallback)
- [x] Re-enable "finish your setup" redirect without the sign-in loop
- [x] Rebuild Onboarding in the console design
- [x] Remove the old-styling layer (app.css + app-* bridge) from all 19 pages
- [x] Rewrite pages from the shell adapters to direct kit imports (shell folder deleted)
- [ ] Collect company revenue in Settings so per-revenue benchmarks can return

- [x] Research pipeline plan: fold in user review (Cyprus grid/doc realism, negative prior art, pre-registration lock, stress tests, tax/grant compliance, dual-track S6), then re-review
- [x] Fold refinements 2 (citations, raw-data SHA-256 manifest, FTO in S2, KS/Wasserstein synthetic validation) into plan + research README
- [x] S1 close-out: PV penetration (share by category not published), CBAM fields (78/111 supplier-only)
- [x] S2 on I-03 and I-04: both killed; I-03b residual opened
- [ ] Blocked on user/outside: EAC/CERA count of net-billing agreements by tariff; 2-3 real net-billing bills; Scheid 2025 full text
- [x] S2 on I-02 and I-03b: both killed; I-07 opened
- [x] CBAM sizing: 50 t de-minimis verified; CY import mass 2023-25
- [x] S2 screen on I-07 (survives, narrowed); I-08 killed; I-09 parked
- [x] I-07 prereg written and locked (SHA-256 in registry)
- [ ] Blocked on founder: add git hash of prereg to registry; recruit 3-5 pilot SMEs
- [x] I-07 full S2 screen (survives); I-05, I-06 killed; CBAM definitive re-map; VSME B1-B11 list
- [x] S4 E01 on I-07 (synthetic): H1 pass, H2 fail, H3 pass; generator not validated
- [x] External ideas I-10 killed, I-11 merged into I-07, I-12 killed; gap mining opened I-13
- [x] S2 prior-art on I-13: PASS with caveats
- [x] I-13 prereg written and locked (SHA-256 in registry)
- [x] S4 E02 on I-13 (synthetic): H13-1 pass, H13-2 pass, H13-3 fail; pooling not the value
- [x] EXIOBASE CY sector priors via pymrio
- [ ] Blocked on founder: git hash of prereg/I-13.md in registry; bank contact / pilot SMEs for ground truth
- [ ] Next: robust document likelihood (I-07 layer) under new prereg; rerun 2 non-converged runs; SBC via NumPyro; CYSTAT check of hotel Scope 1
- [ ] Next: full text Owl + arXiv 2504.13382; Espacenet claim search; verify CBAM mark-up; VSME datapoint inventory
- [ ] Blocked outside: CY Customs count of CBAM importers above/below 50 t

## Research tooling (2026-09-24)
- [x] Tooling survey + check of uploaded concepts A/B/C (research/reports/TOOLING_SURVEY_2026-09-24.md)
- [ ] Rebuild E01 on PyMC; add MAPIE conformal + Brightway MC baselines; SBC via simuk
- [ ] Patent white-space scan (BLANC method) + EPO OPS claim sets — needs EPO API key
- [ ] Idea generation run: Open Coscientist grounded on OpenAlex → I-14+ (unproven until gated) — needs an LLM API key
- [x] I-14 prereg locked + E03 run → killed on power (reports/S4_I14_RESULTS.md)

## Security pass (2026-09-26)
- [x] Sign-in wall now covers all data endpoints (was skipping every `/api` path); public allowlist in `src/lib/api-access.ts`
- [x] Account list/search endpoint removed; own-account-only on `/api/users*`; open account creation disabled
- [x] 42 account-data endpoints bound to the signed-in account (403 on someone else's ID)
- [x] Deleted codebase-download, Stripe reset, credit-award and schema-setup endpoints
- [x] Leaderboard no longer returns emails; AI stream rate-limited
- [x] Deleted migration endpoint (had a password written in code); receipt reading fixed (PDF + photo), tied to signed-in account
- [ ] Receipt reading: photos need GEMINI_API_KEY; bill parser misses kWh/account number on some layouts
- [ ] Rotate any credentials that may have leaked while `/api/users` was open (published site too)
