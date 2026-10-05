# **Vuneli: blind spots, gaps and what to build next**

Written 4 Oct 2026 after the full QA pass of vuneli.com/app, read against the Vuneli vision and the 2026-2027 EU rules that hit Cypriot SMEs. Working checklist with all 62 items, priorities and sources: [Vuneli gaps and roadmap checklist (Google Sheet)](https://docs.google.com/spreadsheets/d/1JiFXwXBF8lN-6prhqoe3CaZbYwOiifgiacOWaow0Nm8/edit)

# **The short version**

## **Vuneli's biggest blind spot is trust, and its biggest opening is the questions SMEs already get asked**

Vuneli sells verified numbers, but today the same kWh gives three different CO2 results, a number can't be traced back to its bill, and the app's own fingerprint doesn't verify. Until that layer is solid, every new feature inherits the doubt. That is the first thing to build, ahead of anything new.

The market has also moved. After Omnibus I, the CSRD applies only to companies with more than 1,000 employees and over €450m turnover, from financial years starting 1 January 2027, and those companies can't ask SME suppliers for more than the VSME standard covers. So most Cypriot SMEs won't report because a law tells them to. They'll report because a bank, a big customer, a tour operator, a CBAM rule or a grant asks them to. Vuneli should be built around answering those asks once and well, and around money: savings proven from bills, grants won, loans approved, CBAM costs avoided.

62 items in total: 16 fix-first foundations (P0), 24 next-90-day bets (P1), 15 for six to twelve months (P2), and 7 later or on watch (P3).

## **The 10 bets I'd make, in order**

1. **Trust layer first (F-01, F-02, S-39).** One factor library, every number traceable to its bill, full fingerprints with QR codes, and a public methodology page. This turns 'AI estimate' into 'evidence'.  
2. **VSME Passport (S-01).** One verified data pack the SME shares by link with every buyer, bank and auditor. The Omnibus value-chain cap makes VSME the ceiling of what buyers may ask for, so owning that format is the wedge.  
3. **Bank ESG pack and a bank partner (S-02, S-34).** Cypriot banks already ask borrowers for ESG questionnaires at application and annual review. Pre-filling them puts Vuneli inside the loan process, which is where SMEs feel the pain and where distribution comes from.  
4. **Questionnaire inbox (S-03).** Forward any customer ESG questionnaire and get it back filled in. Today the app sends questionnaires but doesn't answer the ones SMEs receive.  
5. **CBAM suite for small importers (S-04, S-05, S-06).** A 50-tonne threshold tracker, supplier installation-data requests and a certificate cost and cash-flow forecaster aimed at the Feb 2027 purchases and 30 Sep 2027 declaration.  
6. **Verified savings (S-18).** Prove an action worked by comparing later bills with a normalised baseline, then issue a fingerprinted savings certificate. This is the vision in one feature, and it's what investors will remember.  
7. **Grant co-pilot and solar business case (S-21, S-19).** Go from 'here are matching grants' to a drafted application, with PV payback as the most common Cypriot use case.  
8. **Accountant console (S-33).** Accountants already hold SMEs' bills and books. One accountant brings twenty clients.  
9. **Hospitality pack (S-24).** Per-guest-night intensity, water and tour-operator questionnaires for the sector that dominates Cypriot SMEs.  
10. **Production bank feed with bill-to-payment matching (S-13).** Makes 'confirmed from bills or bank payments' real rather than a sandbox demo.

# **Roadmap at a glance**

Phases assume the bug fixes from the QA report run in parallel with the foundations.

| When | Theme | What ships |
| :---- | :---- | :---- |
| 0-30 days | Foundations (P0) | F-01 to F-16: factor library, provenance, account basics, roles, email, monitoring, intake, Verde grounding, VAT, privacy, help, validation, Greek. |
| 30-90 days | Wedge (P1) | VSME Passport, bank pack, questionnaire inbox, CBAM tracker and forecaster, verified savings, grant co-pilot, solar case, accountant console, hospitality pack, evidence bundle, pricing. |
| 90-180 days | Depth (P2) | Production bank feed, ETS2 forecast, market-based Scope 2, scenario planner, Verde digest, API, trust centre, supplier network effect. |
| 180-365 days | Scale (P2/P3) | Bank white-label, installer marketplace, sector packs beyond hospitality, Greece (myDATA). |

# **Blind spots the QA pass exposed**

These aren't bugs. Fixing every bug in the QA report would still leave them open. Each one is a missing capability that a customer, bank or investor will notice.

## **F-01 · One versioned emission-factor library**

**Blind spot:** The same kWh gives three different CO2 results (0.535 in the app, 0.622 in the free tool, 0.489 in messaging). Water uses 0.616, 0.539 and 0.344. A customer can't trust any single number.

**Build:** One factor service used by the app, tools, Verde and documents. Each factor has a source, year, version and valid-from date. Every calculation stores the factor ID it used, and reports print the factors. Yearly update flow for the Cyprus grid factor.

**Evidence:** QA F14, F24, F104, F115. Impact High, effort M, P0.

## **F-02 · Show-your-working provenance and a full fingerprint chain**

**Blind spot:** A number can't be traced back to the bill, the extracted value, the factor and the formula. The app shows 12 of the 64 fingerprint characters, and its own CBAM draft fingerprint is not in the /verify register.

**Build:** Make every figure clickable down to the source page, the extracted value, the factor and the formula. Register every document version, drafts included. Print the full hash and a QR code that opens /verify with the hash pre-filled.

**Evidence:** QA F80, F114. Impact High, effort M, P0.

## **F-03 · Account basics: sign out, password, MFA, deletion, export**

**Blind spot:** There is no Sign out, Change password, MFA, session list, account deletion or data export, which buyers and banks expect.

**Build:** Add sign out, change password, TOTP-based MFA, active sessions, self-serve deletion and a full data export as JSON/CSV/ZIP (GDPR portability).

**Evidence:** QA F74. Impact High, effort S, P0.

## **F-04 · Team, roles and audit log**

**Blind spot:** Only one person can use a workspace, and nothing records who changed a figure.

**Build:** Add Owner, Admin, Editor, Viewer and External accountant roles, email invites, and an audit log of edits to data, factors and reports.

**Evidence:** QA F74, APP-21. Impact High, effort M, P0.

## **F-05 · Working transactional email**

**Blind spot:** Supplier requests fail with an error that shows environment-variable names. Reminders and invites depend on the same email setup.

**Build:** Verified sending domain (SPF/DKIM/DMARC), EN/EL templates, delivery log per message, bounce handling, and plain-language errors.

**Evidence:** QA F81, F82. Impact High, effort S, P0.

## **F-06 · Reliability, monitoring and status page**

**Blind spot:** The overview and reports APIs returned 500/503 repeatedly, and the bell said 'nothing waiting' during an outage.

**Build:** Error tracking, uptime checks, retries with backoff, a public status page, and a degraded-mode banner instead of misleading empty states.

**Evidence:** QA F9, F10, F95, F96. Impact High, effort M, P0.

## **F-07 · Robust bill and invoice intake**

**Blind spot:** Phone photos fail, Greek fuel invoices are rejected (so Scope 1 can't be recorded), and blank or corrupted PDFs get the wrong message.

**Build:** Photo pipeline (deskew, crop, OCR), Greek invoice parsing, fuel and refrigerant documents, multi-page bills, duplicate detection by bill number, period proration across months, and a specific error for each failure type.

**Evidence:** QA F20, F21, F26, F28, F29. Impact High, effort L, P0.

## **F-08 · Evidence-gated tasks**

**Blind spot:** An 'Upload evidence' task closes with one click and no file.

**Build:** Tasks that need evidence can't close without a file, with an optional reviewer approval step.

**Evidence:** QA F88, F57, F89. Impact High, effort S, P0.

## **F-09 · Grounded Verde with an evaluation suite**

**Blind spot:** Verde said no electricity data existed when it did, and printed internal tool names instead of numbers.

**Build:** Numbers only from tool results, each with a citation. Refuse when data is missing. Strip internal names. A 100-question EN/EL test set run on every release.

**Evidence:** QA F52, F53. Impact High, effort M, P0.

## **F-10 · One source for regulatory dates**

**Blind spot:** The public CBAM tool says 31 May 2027 and the app says 30 Sep 2027 (30 Sep is the current rule). News and glossary disagree on CSRD timing.

**Build:** One deadlines table feeding the app, tools, news and glossary, with a 'last reviewed' date and a monthly review owner.

**Evidence:** QA F116, F123. Impact Medium, effort S, P0.

## **F-11 · VAT and currency localisation**

**Blind spot:** Checkout charged 21% Romanian VAT in RON while the app and Terms promise 19% Cyprus VAT.

**Build:** Stripe Tax or equivalent with correct EU VAT by customer, EUR pricing, a VAT ID field with B2B reverse charge, and compliant invoices.

**Evidence:** QA F68, F119. Impact High, effort M, P0.

## **F-12 · Private-by-default benchmarks**

**Blind spot:** A new workspace can see another customer named on the leaderboard.

**Build:** Opt-in leaderboard, anonymised sector benchmarks, minimum group sizes.

**Evidence:** QA F66, F100. Impact High, effort S, P0.

## **F-13 · Help centre and guided first report**

**Blind spot:** There is no in-app help, and new users can't tell what to do next.

**Build:** Help centre in EN/EL, 'first report in 10 minutes' checklist, tooltips, a sample-data demo workspace, and a contact-support entry point.

**Evidence:** QA APP-26, F94-F102. Impact Medium, effort S, P0.

## **F-14 · Responsive app and accessibility**

**Blind spot:** The signed-in app wasn't verified at tablet or phone width, and there were accessibility gaps.

**Build:** Target WCAG 2.1 AA, keyboard paths, contrast fixes, and layouts tested at 1440, 768 and 390 px.

**Evidence:** QA X-02, X-03. Impact Medium, effort M, P0.

## **F-15 · Plausibility validation**

**Blind spot:** Negative Scope 1, renewable energy above total energy, negative employees and invalid URLs are all accepted.

**Build:** Range, unit and cross-field checks with friendly warnings, plus a 'review anomalies' step before export.

**Evidence:** QA F73, F120, F122. Impact Medium, effort S, P0.

## **F-16 · Greek localisation quality**

**Blind spot:** Untranslated strings, mixed-language documents, and a mistranslation ('TEST' rendered as 'ΠΡΟΒΛΗΜΑΤΙΚΟΣ').

**Build:** Full string coverage check in CI, an approved Greek ESG glossary, a native reviewer, and single-language document output.

**Evidence:** QA F103-F109. Impact Medium, effort S, P0.

# **Reporting and compliance features**

## **S-01 · VSME Passport**

**Gap:** After Omnibus I, SMEs aren't obliged to report, but large customers can ask suppliers for up to the VSME content. SMEs will keep answering the same questions in different formats.

**Build:** A verifiable, versioned VSME data pack the SME shares by consent link with buyers, banks and auditors. One answer, many requesters, each view logged.

**Basis:** Omnibus I value-chain cap (PwC, NGS Finland). Impact High, effort M, P1, 30-90 days.

## **S-02 · Bank ESG questionnaire pack**

**Gap:** Cypriot banks ask borrowers for ESG questionnaires at loan application and annual review, and SMEs fill them in by hand.

**Build:** Map Vuneli data to each bank's ESG questionnaire and export it in the bank's format. Use it as a bank partnership and distribution channel.

**Basis:** Philenews on Cyprus bank ESG lending criteria; Cyprus Mail interbank ESG project (Jul 2026). Impact High, effort M, P1, 30-90 days.

## **S-03 · Questionnaire inbox and answer library**

**Gap:** Customer ESG questionnaires arrive as Excel, PDF or portal forms. The app sends questionnaires but doesn't answer them.

**Build:** Forward any questionnaire. Vuneli pre-fills it from data and past answers, flags gaps, and exports in the original format.

**Basis:** Market gap; supplier engagement is a core competitor feature (Normative, Sweep). Impact High, effort M, P1, 30-90 days.

## **S-09 · Green claims checker**

**Gap:** SMEs make generic 'eco-friendly' claims that EU consumer law restricts.

**Build:** Scan the website and marketing copy and suggest substantiated wording backed by Vuneli data. Confirm the application date of Directive (EU) 2024/825 before launch (not checked in this review).

**Basis:** Watchlist: verify before building. Impact Medium, effort S, P2, 90-180 days.

## **S-10 · Base year, year-over-year and restatements**

**Gap:** The app has no base-year policy or comparison across years.

**Build:** Base-year setting, recalculation rules, YoY comparison report and intensity metrics.

**Basis:** GHG Protocol; QA F118 (SBTi tool 'Base year 2050'). Impact Medium, effort M, P2, 90-180 days.

## **S-11 · Assurance-ready evidence bundle**

**Gap:** Auditors and banks need the evidence behind each figure.

**Build:** One-click ZIP with source documents, calculation log, factor list and fingerprints, plus a partner network for limited assurance.

**Basis:** Competitor standard (audit trail); QA F80. Impact High, effort M, P1, 30-90 days.

## **S-30 · Board, bank and investor one-pagers**

**Gap:** The board summary exists but isn't tailored to the audience.

**Build:** Audience templates (bank, buyer, board, investor) in EN/EL, brandable, each fingerprinted.

**Basis:** Builds on board summary. Impact Medium, effort S, P1, 30-90 days.

## **S-31 · Data completeness score**

**Gap:** Users can't see what's missing for VSME Basic or Comprehensive.

**Build:** Completeness meter per module with the next missing item to add.

**Basis:** QA F120 (B3 counted complete with bad data). Impact Medium, effort S, P1, 30-90 days.

# **CBAM and carbon pricing**

## **S-04 · 50-tonne threshold tracker and declarant helper**

**Gap:** Under Reg. 2025/2083 importers below 50 t net a year of CBAM goods are exempt, but crossing it brings the whole year's volume into scope. SMEs can't see how close they are.

**Build:** Running tonnage per calendar year from invoices and customs data, alerts at 70% and 90%, and an authorised-declarant application checklist. Electricity and hydrogen are excluded from the count.

**Basis:** Reg. (EU) 2025/2083 (Reed Smith, ICAP, myDPP). Impact High, effort S, P1, 30-90 days.

## **S-05 · Supplier installation-data requests**

**Gap:** Default values are usually more expensive than actual data, and SMEs can't get installation data from non-EU producers.

**Build:** Send operator emissions templates to non-EU suppliers, track replies, and show the certificate cost saved by using actual over default values.

**Basis:** CBAM definitive period; QA F22, F27. Impact High, effort M, P1, 30-90 days.

## **S-06 · Certificate cost and cash-flow forecaster**

**Gap:** SMEs don't know what CBAM will cost them or when the cash is due.

**Build:** Forecast cost at the 2026 quarterly average ETS price, apply the free-allocation adjustment, deduct third-country carbon prices, and add a calendar for Feb 2027 purchases, 50% quarterly holding and the 30 Sep declaration.

**Basis:** Reg. (EU) 2025/2083 (ICAP, Mayer Brown). Impact High, effort M, P1, 30-90 days.

## **S-07 · ETS2 fuel-cost exposure forecast**

**Gap:** ETS2 now starts in 2028 and will raise fuel costs for heating and road transport. SMEs with vans or oil heating aren't warned.

**Build:** Use fuel spend from bank data to forecast 2028+ costs under price scenarios and suggest switching options. First surrender is 31 May 2029\.

**Basis:** EU Climate Law deal (BUILD UP), Veyt, REHVA. Impact Medium, effort S, P2, 90-180 days.

## **S-08 · Market-based Scope 2 and on-site solar**

**Gap:** Only location-based electricity is shown. Rooftop PV, net billing and green tariffs aren't credited.

**Build:** Market-based Scope 2 with guarantees of origin, PV generation and self-consumption tracking, shown alongside location-based figures.

**Basis:** GHG Protocol Scope 2 dual reporting. Impact Medium, effort M, P2, 90-180 days.

# **Savings, funding and finance: the money story**

## **S-18 · Verified savings (measurement and verification)**

**Gap:** Cost-saving actions are suggested but never proven. This is the core of the vision: 'confirm results from bills or bank payments'.

**Build:** After an action, compare later bills with a weather- and occupancy-normalised baseline, then issue a fingerprinted 'verified savings' certificate.

**Basis:** Vuneli vision; QA cost-saving rows. Impact High, effort M, P1, 30-90 days.

## **S-19 · Solar PV and battery business case**

**Gap:** Rooftop PV is the biggest lever for Cyprus SMEs, but owners can't judge it.

**Build:** Sizing from consumption, net-billing assumptions, grant, payback and loan scenarios, exported as a bank-ready one-pager.

**Basis:** Cyprus RES schemes (resecfund.org.cy). Impact High, effort M, P1, 30-90 days.

## **S-21 · Grant application co-pilot**

**Gap:** Grant matching stops at a list. Applying is where SMEs give up.

**Build:** Eligibility pre-check against Cyprus RES & Energy Conservation Fund, RRF and Ministry schemes, a drafted application, document checklist, deadline alerts and outcome tracking.

**Basis:** gov.cy MECI funding programmes; RRF SME energy-efficiency scheme (European Commission). Impact High, effort M, P1, 30-90 days.

## **S-22 · Green finance matching**

**Gap:** SMEs don't know which green loans or guaranteed SME lines they qualify for.

**Build:** Match data to green loan products and EIB/EIF-backed lines offered through Cypriot banks, with a pre-filled bank pack.

**Basis:** EIB SME loans via Bank of Cyprus. Impact Medium, effort M, P2, 90-180 days.

## **S-23 · Bill anomaly and leak alerts**

**Gap:** A jump in kWh or m3, estimated reads or billing errors go unnoticed.

**Build:** Alerts on unusual use, possible water leaks, estimated-read flags and tariff mismatches.

**Basis:** Product opportunity. Impact Medium, effort S, P1, 30-90 days.

## **S-20 · Vetted installer marketplace**

**Gap:** After a recommendation the SME still has to find and trust a supplier.

**Build:** Vetted local installers for PV, LED, heat pumps and insulation, three quotes per job, and referral revenue for Vuneli.

**Basis:** Revenue opportunity. Impact Medium, effort L, P2, 180-365 days.

# **Data and integrations**

## **S-12 · Accounting and ERP connectors**

**Gap:** Bank CSV import works, but most SMEs keep their books in accounting software.

**Build:** Xero and QuickBooks first, then ERPs common in Cyprus and Greece (check which ones local accountants use), plus statement templates for the main Cypriot banks.

**Basis:** Market practice. Impact Medium, effort M, P1, 30-90 days.

## **S-13 · Production bank feed and bill-to-payment matching**

**Gap:** The bank feed exists only in sandbox. The vision of 'confirming results from bills or bank payments' needs reliable matching.

**Build:** Production open-banking feed via an aggregator, categorisation, and automatic matching of bills to payments with a confidence score.

**Basis:** QA F61, F62; Vuneli vision. Impact High, effort L, P1, 90-180 days.

## **S-14 · Interval-meter data and peak analysis**

**Gap:** Monthly bills hide peak-load and tariff problems.

**Build:** Import interval or smart-meter data where available for peak-load, tariff and solar-sizing analysis.

**Basis:** Product opportunity. Impact Medium, effort M, P2, 90-180 days.

## **S-15 · WhatsApp, Viber and mobile scan intake**

**Gap:** Small business owners photograph bills on their phones, and email forwarding alone is friction.

**Build:** Upload by WhatsApp/Viber and a mobile scan view with edge detection, using the existing bills.vuneli.com forwarding as backup.

**Basis:** QA F20/F26 (photo failures). Impact Medium, effort M, P1, 30-90 days.

## **S-16 · Greece readiness (myDATA)**

**Gap:** Expansion to Greece needs e-invoice data ingestion.

**Build:** Ingest invoices from AADE myDATA for Greek customers.

**Basis:** Product opportunity. Impact Medium, effort L, P3, 180-365 days.

## **S-17 · Public API and webhooks**

**Gap:** Banks, accountants and platforms can't build on Vuneli.

**Build:** Documented REST API, webhooks for report and verification events, and partner API keys.

**Basis:** Partner channel enabler. Impact Medium, effort M, P2, 90-180 days.

# **Sector packs**

## **S-24 · Hospitality pack**

**Gap:** Hotels are a major Cypriot SME segment (the test company was one) and face tour-operator and eco-label questions.

**Build:** Per guest-night energy, water and CO2 intensity, evidence mapping for eco-labels (check current criteria), and tour-operator questionnaire templates.

**Basis:** Market fit (Cyprus tourism). Impact High, effort M, P1, 30-90 days.

## **S-25 · Shipping and logistics pack**

**Gap:** Shipping is a big Cyprus sector, with EU ETS maritime and FuelEU Maritime pressures.

**Build:** Start with awareness and data packs for logistics SMEs and ship-management shore offices; scope carefully before building.

**Basis:** Watchlist: validate demand. Impact Medium, effort L, P3, 180-365 days.

## **S-26 · Food, retail and refrigeration pack**

**Gap:** Refrigerant leaks, food waste and packaging are big emission sources missing from the model.

**Build:** F-gas refrigerant tracking, food-waste logging and packaging data.

**Basis:** Product opportunity. Impact Medium, effort M, P3, 180-365 days.

## **S-27 · Buildings and real-estate pack**

**Gap:** Energy performance certificates and building upgrades drive both grants and EU Taxonomy alignment.

**Build:** EPC upload and parsing, upgrade planning, and Taxonomy building-criteria checks (fixing F121 first).

**Basis:** QA F121. Impact Medium, effort M, P3, 180-365 days.

# **AI and product innovation**

## **S-28 · Proactive Verde digest**

**Gap:** Verde only answers questions. Owners need to be told what changed.

**Build:** Weekly EN/EL digest: what changed, why, the next best action and upcoming deadlines, with every number cited. Optional Greek voice notes.

**Basis:** Builds on F-09. Impact Medium, effort M, P2, 90-180 days.

## **S-29 · Scenario planner**

**Gap:** Owners can't see what a switch to PV, EVs or LED would do to cost, CO2 and ETS2/CBAM exposure.

**Build:** What-if planner using the same factor library and cost data.

**Basis:** Product opportunity. Impact Medium, effort M, P2, 90-180 days.

## **S-32 · Mobile-first app (PWA)**

**Gap:** Owners work from their phones.

**Build:** Installable PWA with offline capture and push notifications for deadlines.

**Basis:** QA X-02. Impact Medium, effort M, P2, 90-180 days.

## **S-40 · AI transparency**

**Gap:** Generated documents don't say what the AI did or what a human checked.

**Build:** Disclosure on generated outputs, an optional human-review step, and a short model and data note.

**Basis:** Customer trust. Impact Medium, effort S, P1, 30-90 days.

# **Distribution, pricing and growth**

## **S-33 · Accountant and advisor console**

**Gap:** Cypriot accountants already hold SMEs' bills and books, and they're the natural channel.

**Build:** Multi-client console, client invites, white-label reports, bulk upload and partner pricing.

**Basis:** Channel strategy. Impact High, effort M, P1, 30-90 days.

## **S-34 · Bank white-label and referral**

**Gap:** Banks need SME ESG data for lending decisions.

**Build:** White-label portal or embedded flow for a partner bank, with referral economics.

**Basis:** Builds on S-02. Impact High, effort L, P2, 180-365 days.

## **S-35 · Pay-per-report and annual plans**

**Gap:** Many SMEs need one VSME or one bank pack a year, not a subscription.

**Build:** One-off report purchase, annual discount, and an accountant plan.

**Basis:** Pricing gap (current Free/Pro/Enterprise only). Impact Medium, effort S, P1, 30-90 days.

## **S-36 · Verified badge and public profile**

**Gap:** Good performers can't show it off credibly.

**Build:** Opt-in public sustainability page plus an embeddable badge that links to /verify.

**Basis:** Builds on F-02. Impact Medium, effort S, P2, 90-180 days.

## **S-37 · Supplier network effect**

**Gap:** Questionnaire recipients are prospects who are never converted.

**Build:** Each recipient gets a free, pre-filled Vuneli workspace when they answer.

**Basis:** Competitor pattern (Normative Carbon Network). Impact High, effort M, P2, 90-180 days.

# **Trust and operations**

## **S-38 · Security programme and trust centre**

**Gap:** Buyers and banks will ask for security assurances. Legal pages lack a company registration number and address.

**Build:** Trust centre page, sub-processor list, EU data residency statement, pen test, and an ISO 27001 roadmap. Complete controller details.

**Basis:** QA F119. Impact High, effort M, P2, 90-180 days.

## **S-39 · Public methodology page**

**Gap:** Methodology, factor sources and limitations aren't published in one place.

**Build:** Methodology page (GHG Protocol alignment, factor sources and versions, limitations, change log) and an external expert review.

**Basis:** Builds on F-01. Impact High, effort S, P1, 30-90 days.

## **S-41 · Product analytics funnel**

**Gap:** Activation can't be measured: sign-up, first bill, first report, paid.

**Build:** Event tracking with a funnel dashboard and activation alerts.

**Basis:** Investor readiness. Impact Medium, effort S, P1, 30-90 days.

## **S-42 · Greek-speaking customer success**

**Gap:** Owners want a person to help with their first report.

**Build:** In-app chat, onboarding call booking, and EN/EL support hours.

**Basis:** QA APP-26. Impact Medium, effort S, P1, 30-90 days.

# **The regulatory calendar Vuneli should be built around**

| Date | What happens | Feature |
| :---- | :---- | :---- |
| 1 Jan 2027 | Narrowed CSRD scope applies; value-chain cap at VSME | S-01, S-03 |
| 1 Feb 2027 | CBAM certificate sales open for 2026 imports | S-06 |
| 30 Sep 2027 | First annual CBAM declaration and surrender | S-06, F-10 |
| 31 Oct / 1 Nov 2027 | CBAM repurchase deadline, then cancellation of unused 2026 certificates | S-06 |
| 2028 | ETS2 starts for buildings and road-transport fuels | S-07 |
| 31 May 2029 | First ETS2 surrender (2028 emissions) | S-07 |

The CBAM authorised-declarant application deadline (31 Mar 2026\) and the provisional import window (to 27 Sep 2026\) have passed. For 2027 imports, SMEs above 50 t need declarant status before importing, which S-04 should make obvious.

# **Watchlist: verify before building**

I didn't confirm the current dates or scope for these in this review, so treat them as signals, not plans.

* **EU Deforestation Regulation:** SMEs importing covered commodities may get obligations, but dates have shifted repeatedly. Track the final dates before deciding on a module.  
* **Digital Product Passport (ESPR):** Product makers will need product-level data over time. Watch delegated acts per product group, and reuse the product-carbon data model.  
* **CBAM scope extension to downstream goods:** The Commission flagged a proposal to extend CBAM scope. Monitor and pre-build CN-code tables when adopted.  
* **Final VSME delegated act:** The VSME standard is being adopted as a delegated act. Templates must match the final text. Track adoption and update templates and field mappings the same week.  
* **Green claims checker:** SMEs make generic 'eco-friendly' claims that EU consumer law restricts. Scan the website and marketing copy and suggest substantiated wording backed by Vuneli data. Confirm the application date of Directive (EU) 2024/825 before launch (not checked in this review).  
* **Shipping and logistics pack:** Shipping is a big Cyprus sector, with EU ETS maritime and FuelEU Maritime pressures. Start with awareness and data packs for logistics SMEs and ship-management shore offices; scope carefully before building.

# **Where Vuneli can win against the big platforms**

Normative, Sweep, Greenly, Watershed and Persefoni are built for sustainability teams in mid-size and large companies, and they compete on emission-factor depth, Scope 3 supplier networks and audit readiness. Vuneli shouldn't fight them there. Its edge is local, small and practical: Cyprus-specific factors and tariffs, Greek language, EAC and Water Board bills read automatically, Cypriot grants and banks, and results stated in euros. Two competitor patterns are worth copying: a supplier network where each questionnaire recipient becomes a user (Normative's Carbon Network), and visible methodology and audit trails.

# **How to know it's working**

* **Time to first report:** minutes from sign-up to a fingerprinted VSME or bank pack. Target under 15\.  
* **Provenance coverage:** share of reported numbers traceable to a source document. Target 100%.  
* **Requests answered:** questionnaires and bank packs completed through Vuneli per customer per year.  
* **Verified savings:** euros of savings proven from later bills across all customers. This is the pitch number.  
* **Grants won:** applications submitted and won through the co-pilot.  
* **Activation and paid conversion:** sign-up to first bill to first report to paid.

# **Sources**

* [EU postpones carbon pricing for buildings to 2028 (BUILD UP, European Commission)](https://build-up.ec.europa.eu/en/news-and-events/news/eu-postpones-carbon-pricing-buildings-2028-climate-law-deal)  
* [ETS2 delay to 2028 (Veyt)](https://veyt.com/eu-ets/eu-ets2-delay-to-2028/)  
* [ETS2 delayed to 2028, impact on HVAC (REHVA)](https://www.rehva.eu/news/article/ets2-delayed-to-2028-a-major-impact-on-hvac)  
* [CBAM simplification comes into effect (Reed Smith)](https://www.reedsmith.com/our-insights/blogs/viewpoints/102lr9t/what-you-need-to-know-as-cbam-simplification-comes-into-effect/)  
* [EU adopts simplifications of CBAM rules (ICAP)](https://icapcarbonaction.com/en/news/eu-adopts-simplifications-cbam-rules-ahead-compliance-phase-starting-2026)  
* [CBAM simplification regulation, 10 key amendments (Mayer Brown)](https://www.mayerbrown.com/en/insights/publications/2025/10/eu-adopts-cbam-simplification-regulation-10-key-amendments-and-challenges-ahead)  
* [CBAM registration and authorised declarant deadlines (myDPP)](https://mydpp.app/en/knowledge/cbam-registration-authorised-declarant-deadlines)  
* [CBAM simplifications in force (carboneer)](https://carboneer.earth/en/2025/11/cbam-simplifications/)  
* ['Omnibus' directive finalised (PwC Viewpoint)](https://viewpoint.pwc.com/gx/en/pwc/in-briefs/ib_int202527.html)  
* [Omnibus I 2026: what changed in CSRD for SMEs (NGS Finland)](https://ngsfinland.fi/en/articles/csrd-omnibus-2026/)  
* [Omnibus explained (Accountancy Europe)](https://accountancyeurope.eu/publications/omnibus-explained-key-changes-to-the-csrd-and-csddd/)  
* [Cyprus banks implement climate criteria for loans (Philenews)](https://en.philenews.com/insider/cyprus-banks-esg-lending-criteria-climate-reporting/)  
* [Cypriot businesses make ESG progress through interbank project (Cyprus Mail, 3 Jul 2026\)](https://cyprus-mail.com/2026/07/03/cypriot-businesses-make-esg-progress-through-interbank-project)  
* [Funding programmes, Ministry of Energy, Commerce and Industry (gov.cy)](https://www.gov.cy/meci/en/funding-programmes/)  
* [RES and Energy Conservation Fund support schemes](https://resecfund.org.cy/en/sxedia)  
* [Cyprus RRF nation-wide investment scheme (European Commission)](https://commission.europa.eu/business-economy-euro/economic-recovery/recovery-and-resilience-facility/cyprus-recovery-and-resilience-plan/cyprus-recovery-and-resilience-supported-projects-nation-wide-investment-scheme_en)  
* [Bank of Cyprus loan for SMEs (EIB)](https://www.eib.org/en/projects/all/20090186)  
* [Best carbon accounting platforms 2026 (Normative)](https://normative.io/insight/the-5-best-carbon-accounting-software-platforms-2026/)  
* [Best carbon accounting software 2026 (ClimatePartner)](https://www.climatepartner.com/en/knowledge/blog/best-carbon-accounting-software-2026)  
* [Vuneli app QA report, 4 Oct 2026](https://docs.google.com/document/d/1zNbxdMjvOUoxLvhN9C-4ZsVHqZEP7PJK6pMBJvqHguI/edit)  
* [Vuneli QA checklist and bug log](https://docs.google.com/spreadsheets/d/18-76rQtUJpXAnQmRcK2MdhH_MSqIBvDJIZ0UfKVJhbM/edit)