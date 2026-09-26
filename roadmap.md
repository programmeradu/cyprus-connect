# Roadmap

## App build (audit 2026-09-26, docs/APP_AUDIT_2026-09-26.md)
- [x] Full app + repo-quality audit
- [ ] P0 lock down API routes (session-derived userId, remove/guard admin routes, zod)
- [x] P1a invented figures removed (upload parsing, compliance score/dates/SEC, forecast noise)
- [x] P1b merge duplicate systems (unused /api/lms removed; one Gemini library)
- [x] P2a CI verify gate (typecheck+tests+coverage+audit before deploy), /api/healthz, env parity + test
- [ ] P2b structured logger, split files over 500 lines, broaden test coverage
- [x] P3a Release 2: approve/reject tasks from the queue (writes audit trail)
- [ ] P3b Release 2: start agent runs, period/site filter, CSV/PDF export; then Release 3 CBAM agent

(Research paused by founder.)

- [x] Keep-alive ping moved to a daily Cloudflare cron (GitHub kept as weekly backup)
- [x] Remove invented figures in Integrations benchmarks (revenue, team-size fallback)
- [x] Re-enable "finish your setup" redirect without the sign-in loop
- [x] Rebuild Onboarding in the console design
- [x] Remove the old-styling layer (app.css + app-* bridge) from all 19 pages
- [ ] Rewrite pages from the shell adapters to direct kit imports (visual parity already)
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
