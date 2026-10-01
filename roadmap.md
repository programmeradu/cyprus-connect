# Roadmap

## App build (audit 2026-09-26, docs/APP_AUDIT_2026-09-26.md)
- [x] Full app + repo-quality audit
- [x] P0 lock down API routes (session-derived userId, admin role table + gates, every body through validate.ts; guard test enforces it)
- [x] P1a invented figures removed (upload parsing, compliance score/dates/SEC, forecast noise)
- [x] P1b merge duplicate systems (unused /api/lms removed; one Gemini library)
- [x] P2a CI verify gate (typecheck+tests+coverage+audit before deploy), /api/healthz, env parity + test
- [x] P2b structured logger (src/lib/log.ts, error refs) + tests for validation/admin/log/PDF/filters
- [x] P2d every API error answer returns a short log reference, never the raw error (31 routes fixed; tests/api-error-leak-guard.test.ts)
- [x] P2c split files over 500 lines: dashboard (908 → 429), compliance (565 → 151, fake per-rule % removed); studio/calculator/insights were already under 310
- [x] P3a Release 2: approve/reject tasks from the queue (writes audit trail)
- [x] P3b CSV export per console section
- [x] P3c Approve runs the exact act the agent asked for (fingerprint-checked); first act: CBAM signature
- [x] P3d Start agent run — real for Ledger (evidence sweep) via /api/console/agents/run; other agents still sample
- [x] P3f Agents page (/app/agents): run now + pause per agent, pause all, run history with step-by-step ledger per run

- [x] Bank of Cyprus read-only link (sandbox): link, first 90-day read, Read again, Unlink (deletes stored payments), fuel/electricity/water/freight sorting with matched rule; on Integrations
- [x] Integrations tiles wired: Climate TRACE (Cyprus total, world share, top sectors), CyStat (establishments in your sector, all Cyprus), EAC (bill upload, read, Scope 2, remove), WikiRate (key-gated)
- [x] Utility bills: tiles renamed (Electricity bills (EAC), Water bills); bank check matches board/EAC payments to bills and lists payments with no bill; forwarding address per account reads emailed e-bills (Gmail confirmation code shown in app)
- [x] Fixed: cron handler was a named export Cloudflare never calls; now on the default export with the email handler
- [ ] Bill forwarding live: founder to enable Cloudflare Email Routing on bills.vuneli.com + set BILL_INBOX_DOMAIN, INBOUND_EMAIL_SECRET; then send one real forwarded bill
- [ ] EAC bill reading checked on real bills (founder to upload); WikiRate needs WIKIRATE_API_KEY
- [ ] Bank link end-to-end with the bank's sign-in: blocked until the redirect URL is registered on the BoC app (founder)

External actions for the founder: docs/FOUNDER_EXTERNAL_SETUP.md (updated every turn)

## One shared workspace (plan: .lovable/plan/one-shared-workspace-for-every-app-page-2026-09-26.md)
- [x] Phase 1a shared store (workspace-store.ts): one cache + one transport for all pages, writes invalidate every page + overview; guard test (tests/app-data-guard.test.ts)
- [x] Moved: Dashboard overview, Reports, Report detail, Leaderboard, Marketplace impact
- [x] Company facts stored once (profile: name/industry/size/country; workspace: sites/revenue) via /api/console/company with audit event; dashboard agent status is real
- [ ] Phase 1b server (rest): Agents + CBAM mutations through useWorkspaceAction; every page write records an activity event
- [x] Phase 2 quick: Analytics, Grant alerts, Settings, Privacy (shared reads/writes; settings save refreshes analytics + leaderboard; analytics AI insights asked once per fresh data)
- [x] Phase 3 medium: Actions, Marketplace list/detail/admin, Onboarding, Compliance on the shared store. Removed: invented fallback actions/emissions/company in Actions, banner auto-generation on every Marketplace visit, account search in Onboarding. Fixed: QuickBooks connect trusted a caller-supplied user id; compliance email toggle could never be off
- [ ] Pages that check sign-in with the client session (Compliance, Marketplace, Onboarding, Analytics) cannot be opened by the QA identity, so they are only browser-checked signed out
- [x] Phase 4 Learn: library, course, lesson and generator on the shared store; generated courses private until an admin publishes; owner/admin-only edits; lesson HTML cleaned; all-or-nothing course save; creator-only notification; duplicate course endpoints removed
- [x] Phase 4 Studio: one-step make (server reads real records per topic, no invented figures, refunds on failure), owner-scoped image routes, unsafe edit-image and stats endpoints removed, EN+EL copy
- [x] Phase 4 Calculator: one form per month, server works out the footprint from the company country (live Climatiq per line, published factor otherwise, stated per line), one transaction writes emissions + dashboard figures + scopes + activity; replaces a month instead of duplicating; auto-saved AI actions and self-calling batch endpoint removed. Note: monthly history table (historical_emissions) needs renewable/efficiency data the form does not collect, so it is not written
- [x] Phase 4 Insights: one server read (measured hourly grid from Energy-Charts for the company country, own recorded months, tracked obligations); one-click advice built from numbered server-side facts, uncited points dropped. Removed: fake quarterly 'you vs industry' chart, mock benchmark percentile, US $0.15 savings on a fixed 10,000 kWh, 85% default compliance score, stock 'personalised' advice; deleted industry-benchmarks and ai-recommendations endpoints
- [x] Phase 4 heavy: Integrations — one view on the shared store, Energy-Charts live reading, QuickBooks set-up/link state, guessed tariff + benchmark services deleted. Open: carbon-intensity client still has a Climate TRACE estimate fallback (unused by app pages)
- [x] Agents + CBAM pages (and supplier email panel) on the shared store; every /app page now reads and writes through it (guard list empty). CBAM upload with no readable rows now answers with the row problems instead of a refusal
- [ ] Learn: click through signed in with a real generated course (needs AI key in preview)
- [x] Exchange rates: one shared request per page load (was ~4; duplicate currency wrapper removed)
- [x] Found: analytics insights and AI recommendations call /api/learn/auto-generate over HTTP (endpoint removed)
- [x] Greek translation: all app pages, marketplace (list, item, impact, admin), agent roles, missions and step labels done. Agent names are product names and stay as-is; agent-written notes, report content, PDF and supplier emails stay English

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
- [x] Collect company revenue in Settings (per-revenue figures can now be built on it)

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
- [x] Registrar of Companies lookup/link in Settings + Integrations tile; agents can check Cyprus suppliers
- [x] WikiRate supplier checks + peer comparison (unit/year checks, no partial-year comparisons); old mock client removed
- [x] JCC removed (Stripe chosen; Stripe billing not built yet)
- [ ] Planner agents (Weaver, Compass) need a live run to confirm AI tool-calling works end to end

## Simpler navigation (agreed 2026-10-01)
- [x] Measure tab = Footprint + Insights + Add figures; Act tab = Reduce + Funding + Experts and offsets; Report tab = Obligations + CBAM + Drafting studio (section tabs under the top bar, phone dock too)
- [x] Merged Insights into Footprint: one page with totals, live grid, monthly chart, obligations and cited advice; uncited AI tips and duplicate monthly table removed; /app/insights redirects; "Agent workforce" links fixed to /app/agents
- [x] Act merged: Funding folded into Action plan (old link redirects); Experts and offsets kept as its own page with a pointer
- [x] Merge Report group: Deadlines home links each row to CBAM or the drafting flow; phone + desktop checked
- [x] More holds only Deliverables and Benchmarks; Settings and Plan and usage live in the account menu; Learn off the menu
- [ ] Home/dashboard redesign: on hold, founder to discuss
- [x] Suppliers page under Act: one list (saved, CBAM, bank payees), 12-month spend, register + WikiRate checks, next steps; CBAM emails stay approval-gated
- [ ] Suppliers: read payees from accounting systems once Nango live keys are in (blocked: live keys)
- [x] Report: Obligations home is now one Deadlines list (soonest first, status, drafts, Draft/Open CBAM/See drafts per row)

- [x] Home redesign: today view, guided first visit, self-ticking setup checklist, Verde fills company details (approval-gated), board summary PDF, shared approval queue on Agents.
- [ ] Home tour completion is remembered per browser only; move to account profile if needed.

## Onboarding + logos (2026-10-01)
- [x] Set-up cut to one screen (name, company, website, industry, size, country) or "Let Verde fill it in" (sent to Verde on Home, approval before saving)
- [x] Real company logos (website or work-email domain) on Leaderboard, Suppliers, Home and Settings; generated avatar only when none found
- [ ] Live database: apply scripts/sql/0029_company_website.sql (founder)

## Proven tools from the 106-tool review (2026-10-01)
- [x] CBAM on official EU data: default values (IR 2025/2621 as corrected by 2026/1740, 121 countries + fallbacks), benchmarks (2025/2620), CSCF 100 % (2026/1862), CBAM factor, 2026 quarterly certificate prices; certificate count + € cost per line and total; public CBAM tool switched; supplier emails show the EU default they replace
- [x] Removed unused packages: xero-node, intuit-oauth, @libsql/client
- [ ] CBAM official export format (XSD): founder to download from the CBAM Registry (EU Login)
- [ ] CBAM: add Q3/Q4 2026 certificate prices when published (5 Oct 2026, 4 Jan 2027) in src/lib/cbam/official.ts
- [x] Premium PDFs: Board Summary, drafted reports and a new CBAM declaration PDF on one design system (brand fonts, Greek support, generated Cyprus cover photographs, charts, SHA-256 fingerprint on every page)
- [ ] Public page where anyone can paste a PDF fingerprint and check it against Vuneli records
- [ ] OpenSanctions supplier check (needs OPENSANCTIONS_API_KEY; commercial use is paid)
- [ ] TED (EU tenders) + EUR-Lex feeds for Funding and Deadlines
- [ ] axe-core accessibility checks + MSW mocks for outside services in tests
- [ ] Promptfoo test set for Verde and agents
- [ ] Docling trial on sample bills vs current reader (needs a separate service; Python)

## Premium PDFs + public check + EU feeds (plan: .lovable/plan/premium-pdfs-public-fingerprint-check-eu-tenders-feed-and-re-2026-10-01.md)
- [x] Engine bake-off: Typst sample Board Summary (Source Serif 4 + IBM Plex, running header/footer, ruled tables, contour motif, QR) in src/lib/pdf/typst/
- [x] Founder approved direction; logo in header; per-document styles (Board Summary light, report bold forest cover)
- [ ] CBAM style (official form look)
- [ ] Convert Board Summary, report and CBAM to Typst (browser WebAssembly), Greek check
- [ ] Public /verify page + document_fingerprints table
- [ ] TED tenders + EUR-Lex watch feeds
- [ ] OpenSanctions (needs API key), pdf-lib metadata, axe/MSW, Promptfoo, Docling proposal
- [x] Premium Typst PDFs wired into Board Summary, reports and CBAM downloads (verified in-app download).
- [x] Public fingerprint verification page (/verify, register filled on every PDF download)
- [ ] EU tenders (TED) + EUR-Lex feeds
- [ ] Remaining tools: OpenSanctions, pdf-lib metadata, axe/MSW, Promptfoo, Docling proposal
