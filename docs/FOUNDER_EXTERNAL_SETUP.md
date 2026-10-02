# Things only you can do (outside the app)

Updated after every build turn. Newest changes first. Tick items off here when done.

_Last updated: 2 October 2026 — Progress synced: Cloudflare infrastructure, AI secrets, bill forwarding, database migrations completed; visa milestones, accelerator deadlines, and customer pilot data open._

---

## Executive Progress Dashboard (At a Glance)

### What is DONE (Completed)
- [x] **Cloudflare Secrets**: `CRON_SECRET`, `GROQ_API_KEY`, `BOC_CLIENT_ID`, `BOC_CLIENT_SECRET`, `BOC_REDIRECT_URI`, `SALTEDGE_APP_ID`, `SALTEDGE_SECRET`, `WIKIRATE_API_KEY`, `INBOUND_EMAIL_SECRET`, `BILL_INBOX_DOMAIN`, `LOGO_DEV_TOKEN`.
- [x] **Database Migrations**: All migrations from `0020` through `0040` applied on the database.
- [x] **Automated Cron Jobs**: 15-min agent heartbeat, daily EU feed, sanctions sync, grant alert crons attached & verified live.
- [x] **Utility Bill Forwarding System**: `bills.vuneli.com` provisioned in Cloudflare Email Routing; DNS MX & SPF active; catch-all & token routing to Worker `cyprus-connect` active and tested.
- [x] **Default CBAM Values**: Built-in default emission factors from IR 2025/2621 & 2026 certificate benchmark prices.

### Immediate Action Items for the Founder (Next Few Days)
- [ ] **SLUSH RIF Confirmation (URGENT - DEADLINE 5 OCT)**: Email Stavros Kambanellas (`skambanellas@research.org.cy`, cc `mchilimindri@research.org.cy`) forwarding the Slush approval email + EEN profile confirmation.
- [ ] **INSPIRE 2026 (7-8 Oct, Nicosia)**: Attend conference, network with 5-10 target partners (importers, accountants, customs brokers, CyEC/RIF).
- [ ] **Test Bill Forwarding**: Forward one real EAC or Water Board PDF bill to `c2f4exxjk6662w4effkm@bills.vuneli.com` and check it arrives in workspace.
- [ ] **Test Live Verde**: Ask one question in Verde on `https://vuneli.com/app` to confirm Groq answers smoothly.
- [ ] **Bank of Cyprus Portal**: Confirm redirect URL is `https://vuneli.com/api/console/bank/callback` in developer.bankofcyprus.com.
- [ ] **Salt Edge Dashboard**: Look up the provider codes for Hellenic Bank, Eurobank, Alpha Bank in dashboard.

### Upcoming Milestones (Oct - Nov 2026)
- [ ] **WikiEXPO Cyprus (Nov 2026)**: Finalize partnership agreement in writing on letterhead; prepare CBAM pilot demo.
- [ ] **Finland Schengen Visa (Slush 18-19 Nov)**: Submit application with RIF support letter, ticket, EUR 30,000 travel insurance, cover letter.
- [ ] **Customer Pilots**: Secure 3-5 paid CBAM pilot imports (€500-1,500) before Slush.

### March 2027 Startup Visa Re-evaluation (Long-term)
- [ ] Growth test: audited accounts (>=15% growth) or >=€150k invested in Cyprus.
- [ ] Contribution test: 3 jobs, or accelerator entry, or new product launch.
- [ ] 2 recognized digital skills certificates.

---

**Saved links:**
- Jotform (saved 30 Sep 2026 at your request): https://form.jotform.com/261142415764353

**This turn (Bank of Cyprus):**
- [ ] In the BoC developer portal, set the app's **redirect / callback URL** to `https://vuneli.com/api/console/bank/callback` (you chose to test on the live domain).
- [x] Run `scripts/sql/0025_bank_links.sql` on the production database before deploying (Done: applied to database).
- [x] In Cloudflare add `BOC_CLIENT_ID`, `BOC_CLIENT_SECRET`, and `BOC_REDIRECT_URI=https://vuneli.com/api/console/bank/callback` (Done: saved in Cloudflare secrets).
- Test sign-in at the bank's practice system: user **999999**, passcode **112233** (from the bank's own guide).
- Real customer accounts need a licensed AISP or a BoC partnership (see below); until then this is test mode and the app says so.

**This turn:**
- [x] Run `scripts/sql/0022_sites_and_roles.sql` on the production database (Done: applied to database). It adds a site column to readings and a separate admin-role table.
- Nobody is an admin yet, so the marketplace admin page now refuses everyone. To make yourself admin, run the grant at the bottom of `0022` on production with your own account id (find it in the `user` table by your email). Do not grant the QA test account.
- Readings don't carry a site yet, so the Site filter shows "Whole workspace" only until bills or connections are tagged per site (Limassol, Nicosia...).

**Previous turn:**
- [x] Run `scripts/sql/0021_cbam_suppliers.sql` (and `0020` if not done yet) on the production database (Done: applied to database).
- Create a Resend account, verify a sending domain, then set Cloudflare secrets `RESEND_API_KEY` and `EMAIL_FROM`.
- Get the official CBAM Registry XML format (XSD) so the export can be validated.

## Utility bill forwarding (added 2026-10-01)

Customers can now auto-forward EAC and water e-bills to a private address. To switch it on:

1. [x] Cloudflare dashboard → vuneli.com → Email → Email Routing → enable it on the **subdomain** `bills.vuneli.com` (Done: DNS MX and SPF records provisioned and active).
2. [x] Email Routing → Routing rules → Catch-all for `bills.vuneli.com` → Action "Send to a Worker" → `cyprus-connect` (Done: active in Cloudflare).
3. [x] Worker secrets: `INBOUND_EMAIL_SECRET` and variable `BILL_INBOX_DOMAIN=bills.vuneli.com` (Done: saved in Cloudflare).
4. [x] Deploy (the deploy script now attaches the email handler) (Done: deployed and verified live).
5. Test: in /app/integrations press "Get my forwarding address", forward one real EAC or water e-bill (PDF attached) and check it appears.

Also fixed: the cron jobs (grant alerts, keep-alive, agents) were attached in a way Cloudflare never calls. After the next deploy check Workers → Logs for `[agents cron]` lines; it still needs `CRON_SECRET`.

## Needed now

| # | What | Where | Why it matters | Blocks |
|---|------|-------|----------------|--------|
| 1 | Set `CRON_SECRET` (any long random value) | Cloudflare dashboard → Workers → vuneli → Settings → Variables (secret) | Without it the 15-minute heartbeat skips, so agents only run when you click "Run". | **Done** (Active in CF) |
| 2 | Set `GROQ_API_KEY` / `GEMINI_API_KEY` | Cloudflare Worker secrets (same place) | Photo/scan bill reading, Verde copilot, agents. | **Done** (Active in CF) |
| 3 | Confirm the CBAM rules the agent uses, against the official texts: annual declaration due **30 September** of the following year; **50 tonne** yearly exemption (electricity and hydrogen not counted); default values still allowed in the definitive period | EUR-Lex: Regulation (EU) 2023/956 and amending Regulation (EU) 2025/2083; DG TAXUD CBAM page | The agent's deadlines and "below threshold" answer depend on these. I applied them from memory of the amendment; they must be checked before any customer relies on them. | Selling the CBAM agent |
| 4 | ~~Get the official default values~~ **Done 2026-10-01**: built in from IR 2025/2621 as corrected by 2026/1740, with benchmarks (2025/2620) and 2026 certificate prices. Still to do: add the Q3 2026 price after 5 October and Q4 after 4 January (tell me and I'll add it), and spot-check 3 lines against the EUR-Lex tables | EUR-Lex; DG TAXUD price page | The cost figure for later quarters uses the latest published price until then and is marked with *. | Accurate CBAM cost |
| 5 | One real customer customs export (anonymised is fine) | A Cyprus importer of steel, aluminium, cement or fertiliser; or your customs broker | Tells us the real column layout so upload works without reformatting. | First paid CBAM pilot |

## Still open from earlier turns

| # | What | Where | Blocks |
|---|------|-------|--------|
| 6 | Real Cyprus EAC and water bills (5–10, any businesses, with permission) | Pilot businesses | Checking bill reading on real documents |
| 7 | Rotate any credentials that ever sat in the removed migration endpoint | Database provider and any service whose key appeared there | Security |
| 8 | Register at access.gesis.org and download the Eurobarometer SME microdata (paused research) | GESIS | Cyprus-specific evidence for research |
| 9 | EAC / TSO curtailment and tariff data; 3–5 pilot SMEs; licence check for grouping upgrade finance | EAC, TSO Cyprus, CERA, a lawyer | Grid Surplus and Upgrade Club research ideas |

## Legal note on the CBAM signature

Approving "Sign the 2026 CBAM declaration" records your signature on that exact draft in Vuneli (fingerprinted). It does **not** submit anything to the EU CBAM Registry. Submission still needs the importer's own authorised-declarant account (applied for through the Cyprus Customs Department). Decide with a lawyer how you describe this to customers.


## 2026-09-26 (Insights rebuild)
- Nothing new to set up. Grid data comes from Energy-Charts (free, no key). Advice uses the same AI key (`LOVABLE_API_KEY`) already listed; without it the page says so.
- There is no honest industry benchmark source yet, so no comparison with other companies is shown. If you get access to real sector data for Cyprus (CYSTAT or an industry body), tell me and I can add it.

## 2026-09-26 (Monthly footprint rebuild)
- Optional: `CLIMATIQ_API_KEY` in Cloudflare gives live factors. Electricity already resolves live for Cyprus in preview; gas, waste and car travel fall back to published DEFRA factors, and the page says which were used.

## 2026-09-26 (Report Visuals rebuild)
- Making images needs the same AI service key (`LOVABLE_API_KEY`) and the image storage bucket `generated-media`. Without the key the page says so and charges nothing.

## 2026-09-26 (Learn rebuild)
- Course creation needs the AI service key (`LOVABLE_API_KEY`) on the live site. Without it the generator says so and charges nothing.
- New courses stay private to their creator. To share one with every account, an admin must publish it, so give at least one real person the admin role (see scripts/sql/0022).

## 2026-09-26 (shared workspace, phase 3)
- QuickBooks connect now needs QB_CLIENT_ID set in Cloudflare to work; without it the button says QuickBooks is not connected yet (nothing breaks).
- Nothing else new for you.

## 2026-09-26 (shared workspace, phase 2)
- Nothing new for you. Analytics, Grant alerts, Settings and Privacy now use the one shared workspace data.

## 2026-09-26 (shared workspace, phase 1)
- Nothing new to set up outside the app this turn. Earlier items (database update 0022, admin grant, CRON_SECRET, email account, Registry XSD) are still open.

## Integrations page (2026-09-26)
- QuickBooks: set `QB_CLIENT_ID`, `QB_CLIENT_SECRET`, `QB_ENVIRONMENT` in Cloudflare and register the redirect `https://vuneli.com/api/oauth/quickbooks/callback` in the Intuit developer app. Until then the card honestly says "Not set up yet" and shows no button.
- No key needed for the live grid feed (Energy-Charts, Fraunhofer ISE). Industry benchmarks stay off until real Cyprus sector data is licensed.

## Agents and CBAM pages (2026-09-26)
- Nothing new to set up. Every app page now shares one copy of the workspace data.

## 2026-09-26 (Dashboard connections and CBAM deletions)

- Nothing new to do outside the app. Dashboard connections now show only QuickBooks and imported customs lines, from real data. Old sample connection rows are no longer read, so there is no need to delete them.
- **Production database:** run `scripts/sql/0023_remove_sample_rows.sql` once (after 0020–0022). It removes seeded sample agent runs, tasks, figures and connection rows, and the unused demo workspace. Already applied to preview.
- **Production database:** also run `scripts/sql/0024_workspace_revenue.sql` (adds yearly revenue; applied to preview).

## Startup Visa re-evaluation checklist (official guide, DMRID Dec 2024, section 11)
Source: https://www.gov.cy/media/2024/06/Practical-Guide-Startup-Visa.pdf. Apply 2 months before the permit expires.
- [ ] **Growth (hardest):** audited statements for year N-1 or N-2 showing revenue up at least 15%, OR at least €150k invested during operation in Cyprus. Book an auditor now. Invoice real revenue this year, even small, so there is a base to grow from.
- [ ] **Contribution (any ONE):** 3 new jobs in Cyprus, OR joining a local incubator/accelerator, OR launching at least 1 new product/service. The live CBAM agent may count as the new product; ask DMRID to confirm.
- [ ] **Digital skills:** individual visa needs 2 recognised certificates (IT, digital marketing, data/ML, design/UX, project management, new product development); team visa needs 1 per member.
- [ ] Email DMRID to confirm the rule version that applies to your permit and whether a first year with no revenue can use the investment route.

## Accelerators to check before the March 2027 Startup Visa re-evaluation (added 27 Sep 2026)
Verify each date on the official page before you apply.
- [ ] Founder Institute Cyprus (Nicosia) – rolling 2026/27 intake. https://fi.co/insight/build-a-great-startup-in-2026-with-the-fi-cyprus-startup-accelerator
- [ ] EUC Startup Programme powered by Microsoft – 5th call opened May 2026; watch for the next call. https://euc.ac.cy/en/grow-your-start-up-may26/
- [ ] Plug and Play Cyprus – ask about the next batch. https://www.plugandplaytechcenter.com/innovation-services/our-programs/cyprus-accelerator-program
- [ ] Women TechEU 2 (EIC) – deadline 14 Jun 2027 (only if a woman leads the company). https://www.climate-kic.org/get-involved/open-calls/
- [ ] EIT Jumpstarter 2027 – expect a spring call (2026 closed 17 May).
- [ ] Startups4Peace 2027 – expect a June call (2026 closed 10 Aug).
- [ ] CyEC Accelerator 2027 – expect June.
- [ ] RIF PRE-SEED / SEED 2027 – expect May–June.
- [ ] Ask DMRID which accelerator or grant evidence counts for renewal.

## Startup Visa re-evaluation (March) - revenue plan (added 2026-09-27)
- [ ] Email DMRID now: ask in writing how the growth test (>=15% revenue growth in audited N-1/N-2 accounts, or >=EUR150k invested in Cyprus) applies to a company incorporated late 2026 with no prior-year accounts. Ask if management accounts, signed contracts or a new-company exemption are accepted.
- [ ] Incorporate ASAP; open a Cyprus business bank account; hire a Cyprus auditor early so accounts can be audited fast.
- [ ] Record every euro spent in Cyprus from your own funds as a founder loan or share capital, with receipts (can count toward the EUR150k investment route).
- [ ] Before SLUSH: get 3-5 paid pilots (CBAM report service for Cyprus importers, fixed price e.g. EUR500-1,500), invoiced by the Cyprus company.
- [ ] Record monthly revenue from launch so growth from month to month can be shown alongside the audited figures.

## WikiEXPO partnership and Section 12 (added 2026-09-28)
- [ ] WikiEXPO Cyprus (November 2026): get the partnership in writing (letter or agreement on letterhead, with dates and what each side does). A signed partnership and any leads or pilots from the event can go in the DMRID evidence pack.
- [ ] Plan WikiEXPO and SLUSH together: one CBAM pilot offer, one demo, one way to capture leads for both events.
- [ ] Section 12 checked against the official guide (DMRID, Dec 2024, sections 11-12): the 'no registered company' case applies only AFTER a positive re-evaluation. It does not skip the section 11 tests. Section 11 still asks for the company's audited N-1 or N-2 accounts (15% revenue growth or EUR 150k invested). Without a company there are no company accounts, so this route does not help with the growth test. With or without a company, self-employed founders get a 1-year renewal (Regulation 12, 1972 Aliens and Immigration Regulations); paid employees of a registered company can get 2 years. Plan: incorporate soon and pay yourself as an employee of the company if you want the 2-year permit. Ask DMRID to confirm.

- [ ] At/after SLUSH: pursue angel/pre-seed or grant money (RIF) paid into the Cyprus company to strengthen the investment route.

## No-company route for March (added 2026-09-28)
- [ ] Put the founder's reading to DMRID in writing: "I received my permit 7 months before re-evaluation and had no activity before. Can the re-evaluation be positive without a registered company, using evidence such as letters of intent, pilots and the launched product, instead of audited N-1/N-2 accounts?" Keep the reply as evidence.
- [ ] Until DMRID answers: do not incorporate. Register as self-employed (Tax Department + Social Insurance) so you can invoice small paid pilots cheaply; this gives real revenue without company costs.
- [ ] Collect signed letters of intent and pilot agreements (WikiEXPO, SLUSH, Cyprus CBAM importers), dated and on the other party's letterhead.
- [ ] Download the official guide (https://www.gov.cy/media/2024/06/Practical-Guide-Startup-Visa.pdf) and upload it in chat so it can be saved in the repo under docs/sources/.
- [ ] Self-employed status: the scheme gives "the right to economic activity" and Section 12 mentions self-employed founders, but no official text found says you may register as a sole trader outside a company. Add this question to the DMRID email and ask the Migration Department too; register only after a written yes.

## Self-employed registration under the Startup Visa (researched 2026-09-28)
Official guide now saved at docs/sources/Practical-Guide-Startup-Visa.pdf (+ .txt).
- Allowed: guide section 3 gives founders the "right to self-employment or paid employment in their registered company"; section 12.a.ii covers re-evaluation with no registered company (self-employed founder, 1-year renewal).
- Steps: (1) Tax Department TIC via Tax For All (free); (2) Social Insurance self-employed registration, form ΥΚΑ 1-008, choosing your occupation category (sets minimum contributions: 16.6% SI + 4% GESY on that category's minimum insurable income); (3) optional business-name registration at the Registrar of Companies if trading as "Vuneli"; (4) VAT only above EUR 15,600 turnover; (5) separate bank account.
- [ ] Get the 2026 minimum-contribution table for your category from Social Insurance (mlsi.gov.cy, "Self Employed Persons Categories") before registering; this is the real monthly cost.
- [ ] Take your residence permit and Initial Approval letter to Social Insurance and ask them to confirm they will register you on it. Still confirm with DMRID that sole-trader revenue counts at re-evaluation.
- Official 2026 table saved at docs/sources/Occupational_categories_and_ins_earnings_of_SE_2026.xlsx (valid 5.1.2026-3.1.2027). Minimums are WEEKLY; you cannot declare below your category's minimum. Tech founder likely category 2a/15/16: EUR 485.67/week (~EUR 2,105/month) -> social insurance 16.6% ~= EUR 349/month (~EUR 4,190/year) even with zero income. Avoid category 3 "Directors (Entrepreneurs)": EUR 982.38/week -> ~EUR 707/month. GESY 4% is on actual income. Ask Social Insurance which category applies before registering.

## Finland (Schengen) visa for SLUSH, 14-21 Nov 2026 (added 2026-09-28)
- [ ] Field 24: keep "RIF delegate / government approved" ONLY if RIF or the Deputy Ministry gives you a signed letter saying so. Otherwise write "Attending Slush 2026 as founder of a startup approved under the Cyprus Startup Visa scheme".
- [ ] Field 22: say "Self-employed founder under Cyprus Startup Visa scheme (company not yet incorporated)". Do not imply a registered company.
- [ ] Replace missing employment proof with: Startup Visa Notification of Initial Approval, residence permit (valid to 14-05-2027), Nicosia lease, WikiEXPO partnership letter, any LOIs, March re-evaluation date.
- [ ] Get the Slush visa invitation letter / ticket confirmation; get the RIF letter that says who pays travel costs (must match field 32).
- [ ] 3 months of Cyprus bank statements, no unexplained large deposits; paid return flight; confirmed hotel; EUR 30,000 Schengen insurance.
- [ ] Write a one-page cover letter (who you are, why Slush, why you will return to Cyprus). Apply now.

## INSPIRE 2026, Nicosia, 7-8 Oct 2026 (added 2026-09-28)
Registration confirmed by email (Makarios Avenue). Use it as a lead source before WikiEXPO and SLUSH.
- [ ] Save the confirmation email as a PDF (DMRID evidence of Cyprus ecosystem activity; also useful for the Finland visa pack).
- [ ] Check the speaker line-up; pick 5-10 people to meet (banks, importers, accountants, customs brokers, investors, CyEC/RIF people).
- [ ] Bring a one-line pitch and a short CBAM pilot offer (fixed price) with a QR code to a contact form or calendar.
- [ ] Goal: 2-3 follow-up meetings and at least 1 letter of intent. Send follow-ups within 48 hours.
- [ ] Take dated photos at the event and write down who you met (name, company, next step).

## SLUSH 2026 approved by RIF (added 2026-09-29) — DEADLINE 5 OCT
Letter saved at docs/sources/SLUSH_Participation_Approval.pdf. RIF covers the EUR 395 ticket + EUR 300 expenses subsidy (de minimis aid). Slush company profile already approved (email 23 Sep).
- [ ] Create the Enterprise Europe Network (EEN) Partnership Profile.
- [ ] By 5 Oct 2026, email Stavros Kambanellas (skambanellas@research.org.cy, cc mchilimindri@research.org.cy): forward the Slush 23 Sep approval email + EEN profile confirmation.
- [ ] Do NOT buy a ticket yourself — RIF issues it.
- [ ] Finland visa: this letter is official proof. Field 24 can now truthfully say "Selected by the Research and Innovation Foundation (RIF) of Cyprus to attend Slush 2026"; field 32: RIF covers ticket + EUR 300, you cover the rest. Slush dates are 18-19 Nov.
- [ ] Add the RIF letter to the DMRID evidence pack (government-backed selection).

## Integrations tiles wired — added 30 Sep 2026
- **WikiRate:** sign up free at wikirate.org → your profile → Account → Generate key. Add it in Cloudflare as `WIKIRATE_API_KEY`. Until then the tile says "Not set up yet". Untested with a real key.
- **EAC bills:** upload works through the AI reader (needs the AI key already used by the app). Please upload one or two real EAC bills (Greek and English if you have both) and check the kWh, period and amount it reads. Not yet tested with a real bill.
- **Climate TRACE and CyStat:** no action. Both are public and answered with real Cyprus figures on 30 Sep 2026.

## Nango (accounting connections) — added 30 Sep 2026
1. Create a free account at https://app.nango.dev (EU data region if offered).
2. Environment Settings → copy the **Secret key** (dev environment first).
3. Tell the agent when ready; it will open a secure form to save it as `NANGO_SECRET_KEY`.
4. Later, per provider (Xero, QuickBooks/Intuit and others that ask): create your own developer app and paste its client ID/secret into Nango, not into Vuneli.
Note: SoftOne is not in Nango's catalogue (checked 30 Sep). It would need a custom connection or a CSV import.
5. In Nango, create one integration per system the app offers, using exactly these integration keys (the app sends them): `sage-intacct`, `sap-business-one`, `netsuite`, `microsoft-dynamics-365`, `quickbooks`, `xero`, `zoho-books`, `freshbooks`. If Nango gives a system a different key, tell the agent so the app list matches.
6. (30 Sep) QuickBooks and Xero now link only through Nango. You can delete any `QB_*` and `XERO_*` secrets from Cloudflare, and remove the old redirect address from the Intuit developer app; use Nango's redirect address there instead.

## Salt Edge (other Cyprus banks) — added 30 Sep 2026
The bank picker lists only what Salt Edge's Cyprus coverage page shows today: Eurobank (former Hellenic Bank online banking), Eurobank (former Eurobank Cyprus digital banking) and Alpha Bank Cyprus. AstroBank (now Alpha Bank) and Ancoria are gone; Bank of Cyprus stays on its direct link.
- [x] Create a Salt Edge account and copy the App ID and Secret; saved as `SALTEDGE_APP_ID` / `SALTEDGE_SECRET` in Cloudflare. (Done)
- [ ] In the Salt Edge dashboard, look up the exact provider code for each of the three banks and send them to the agent. The app currently uses `hellenic_bank_cy`, `eurobank_cy`, `alpha_bank_cy` as placeholders.

## Bank of Cyprus developer access — added 30 Sep 2026
**Status 30 Sep:** sandbox app created; `BOC_CLIENT_ID` / `BOC_CLIENT_SECRET` saved in the preview.
- [x] Also add both as secrets in Cloudflare (Workers → vuneli → Settings → Variables) so the live site has them. (Done)
- [ ] Delete the screenshot of the keys from your phone and chat apps, or regenerate the secret in the BoC portal if it was shared anywhere else.

1. Register at the Bank of Cyprus developer portal (developer.bankofcyprus.com) and create a sandbox app.
2. Subscribe it to the Accounts (AIS) API; payments are not needed.
3. Note the **client ID** and **client secret**. Tell the agent when ready; they are saved as `BOC_CLIENT_ID` / `BOC_CLIENT_SECRET` (never pasted in chat).
4. Live (non-sandbox) bank data under PSD2 needs a licensed provider (AISP) or a partner that holds one. Ask BoC how a startup can pilot without its own licence.
Use: read business account transactions to find fuel, electricity and freight spend automatically.

### EAC bill reader — real-bill test (2026-09-30)
- Tested with a real (redacted, 2009) EAC bill: kWh 1,467 and period 15/09/2009–16/11/2009 read correctly. The amount payable was redacted, so it was left blank (not guessed). A Nicosia Water Board bill was correctly refused.
- Still needed: 2–3 recent, unredacted EAC bills (current layout, incl. a photo taken on a phone) to confirm the amount and account number are read on today's bills.
- Water bills are not read yet. Say if you want a Water Board reader (Nicosia first).

### WikiRate key + water bills (2026-09-30)
- WIKIRATE_API_KEY is saved in the preview. Add the same value in Cloudflare (Workers → Settings → Variables, as a secret) before deploying. It now shows the 26 Cyprus companies on WikiRate (earlier filter was wrong and showed global companies).
- Water bill reader added (Nicosia, Limassol, Larnaca, Paphos). Tested on the Bank of Cyprus sample set: Nicosia sample read correctly (1 m³, 27/11/2009–01/02/2010, €20.43). The other water samples are blank forms and were correctly refused. Sewerage and EAC bills were correctly refused.
- Still needed: 1–2 real, recent water bills (any board) to confirm on today's layout.

## Government & payments access (researched 2026-10-01)
- **CY Login (gov.cy sign-in):** email the Digital Services Factory (dsf.dmrid.gov.cy) asking to join as a private-sector relying party for "Sign in with CY Login". Expect 2–6 months for approval.
- **Companies Registrar:** nothing to apply for. The company register is published free on data.gov.cy. Optional: a paid live-lookup service (~$5 per 1,000 lookups) if we want real-time checks.
- **Payments (Stripe, your own account):** the app side is built (subscriptions monthly/yearly, VAT, SEPA, invoices, bank-transfer billing for bigger customers). To switch it on:
  1. Create the Stripe account with country **Cyprus**. In Settings > Tax, turn on Stripe Tax, set your origin address and add your Cyprus VAT number.
  2. Settings > Payment methods: turn on **SEPA Direct Debit** and **Bank transfers**. Settings > Invoices: add your company details and turn on emailing finalised invoices and receipts.
  3. Settings > Billing > Customer portal: turn on plan switching (Pro and Enterprise, monthly and yearly), payment method updates, invoice history and cancel at period end.
  4. In Cloudflare, add `STRIPE_SECRET_KEY` (start with the `sk_test_...` key).
  5. Developers > Webhooks: add `https://vuneli.com/api/public/payments/webhook` with events `customer.subscription.created/updated/deleted`, `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `invoice.paid`, `invoice.payment_failed`, `invoice.overdue`. Put its signing secret in Cloudflare as `STRIPE_WEBHOOK_SECRET`.
  6. Create the prices once: `STRIPE_SECRET_KEY=sk_test_... bun scripts/stripe-setup.ts` (or ask me to run it).
  7. Run `scripts/sql/0042_stripe_billing.sql` on the live database.
  8. Do one test purchase with card `4242 4242 4242 4242`. Then repeat steps 4–6 with the live key and live webhook.
  - To bill a bigger customer by invoice: an admin calls `POST /api/admin/billing/invoice-subscription` (email, plan, interval, company name, address, VAT number). Stripe emails the invoice; it is due in 30 days.
  - Confirm the marketplace fee (set to 10% for now) before any listing goes live.
  - The old Lovable payments variables (`STRIPE_SANDBOX_API_KEY`, `PAYMENTS_*_WEBHOOK_SECRET`, `NEXT_PUBLIC_PAYMENTS_CLIENT_TOKEN`) are no longer used and can be removed.
- **WikiRate:** add WIKIRATE_API_KEY to Cloudflare secrets.

## Company register link and WikiRate checks (added 2026-10-01)
- [x] Apply `scripts/sql/0027_registry_and_goals.sql` on the live database (Done).
- [x] Add `WIKIRATE_API_KEY` to Cloudflare secrets so supplier checks and peer comparison work live (Done).
- No key needed for the Registrar of Companies: it reads the official open register on data.gov.cy (updated monthly, CC BY 4.0).

## 2026-10-01 — Funding inside the Action plan
- The hourly funding scan now runs only when `CRON_SECRET` is set in Cloudflare (the old built-in fallback key was public and has been removed). Set it if you have not.
- Funding no longer needs `SUPABASE_SERVICE_ROLE_KEY`; nothing new to add.

## Suppliers page (added 1 Oct 2026)
- [x] Run `scripts/sql/0028_suppliers.sql` on the live database before deploying (Done).
- Spend per supplier appears only once the live bank connection is working (see Bank of Cyprus callback above).

## Home redesign (1 Oct 2026)
- Nothing to set up outside the app. Verde company fill-in uses the existing AI key.

## 2026-10-01 — Company logos and simpler set-up
- [x] Run `scripts/sql/0029_company_website.sql` on the live database before deploying (Done).
- Optional: add a Logo.dev secret token as `LOGO_DEV_TOKEN` in Cloudflare for sharper logos. Without it, logos come from each company's own site icon.

## Proven-tools follow-ups (2026-10-01)
- Download the official CBAM declaration XML format (XSD) from the CBAM Registry (needs your EU Login with 2FA) and send it to me so the export can be checked against it.
- Supplier sanctions check now uses the free official EU sanctions list; no key or payment needed.
- Electricity CBAM default factors are IEA data under a non-commercial licence, so the app does not include them; electricity imports need the supplier's own value.

## PDFs (2026-10-01)
- Nothing to set up. Cover photographs are AI-generated illustrations and say so in small print on the cover; swap in your own photography any time by replacing the files in public/pdf-art/.

## Document check page (added 1 Oct 2026)
- [x] Run `scripts/sql/0031_document_fingerprints.sql` on the live database before deploying (Done).
- PDFs load the typesetting engine from cdn.jsdelivr.net; if a Content-Security-Policy is added later, allow it in `connect-src`.
- PDFs downloaded before this release are not in the register.

## EU tenders + law feeds (2026-10-01)
- [x] Live database: apply scripts/sql/0032_eu_feed_items.sql (Done).

## Next batch (2026-10-01)
- [x] Live database: apply scripts/sql/0033_home_tour.sql and scripts/sql/0034_supplier_sanctions.sql (Done).
- [x] Live database: apply scripts/sql/0035_eu_sanctions_names.sql (Done).

## Learn check (needs you)
- Sign in to the preview with your real account, open Learn → Generate, create one course and open a lesson. The automated test login can't open Learn (it is sent to the sign-in page), so this one check needs a real account.

## Funding matching (Grant scout)
- [x] Run `scripts/sql/0036_funding_matching.sql` on the live database (Done).
- [x] Then run `scripts/sql/0037_funding_pdf_reread.sql` once (Done).
- Live Cloudflare needs `LOVABLE_API_KEY` set so the daily funding scan can read call rules (max 40 calls/day).

- [x] Run `scripts/sql/0038_default_obligations.sql` on the live database (Done).

## Deadlines that know the business (1 Oct 2026)
- [x] Run `scripts/sql/0039_obligation_rules.sql` on the live database (Done).
- The daily EU feed cron now also checks EUR-Lex for changes to the laws behind each deadline. It needs the same `CRON_SECRET`.
- Open review: EUR-Lex lists Regulation (EU) 2026/2102 (13 Jul 2026) amending the deforestation rules. It appears to change the product list (Annex I), not the dates, but confirm with a lawyer, then mark it reviewed:
  `UPDATE law_watch SET reviewed_at = now(), reviewed_note = '...' WHERE amending_celex = '32026R2102';`
- Before relying on deadlines with customers, have a lawyer check the rulebook against `docs/research/DEADLINES_2026-10-01.md`.


## AI provider: Groq (2026-10-01)
- Done by founder: `GROQ_API_KEY` added to Cloudflare. All text AI now uses it: Verde, the planning agents, Grant scout rule reading, Greek translations, Deadlines, course creation, weekly news notes and bill reading.
- To do: redeploy the Worker so the new secret is picked up, then open Verde and ask one question to confirm.
- Bill reading with Groq only: photos and normal PDFs work. Scanned PDFs (pictures inside a PDF) are refused with a clear message, because Groq cannot read PDF files directly.
- Still needs `LOVABLE_API_KEY` (or stays switched off): image creation in Studio and text embeddings. Without it those screens say so and charge nothing.
- Optional: `GROQ_MODEL` changes the text model. Leave empty to use `openai/gpt-oss-120b`.
- Check usage limits in the Groq console. On the free tier, busy times return "AI service is busy", and the daily agent and funding jobs retry on their next run.

## Verde redesign (2026-10-01)
- [x] Run `scripts/sql/0040_copilot_parts.sql` on the live database before deploying (Done).
- Uses the same `GROQ_API_KEY`. No other setup.

## Content (2026-10-01)
- Review the rewritten CBAM Cyprus guide and new EUDR and EU greenwashing guides on /en/learn before publishing; confirm the Department of Environment CBAM contact on gov.cy.
- Batch 2 (CSRD rewrites, green loans guide): have your accountant sanity-check the CSRD thresholds wording once the final Omnibus text is published in the Official Journal.
- CBAM Registry file: the UI manual and the CarbonOps sample are not enough. Still needed: the official definitive-period CBAM declaration XSD + code lists (ask the CBAM helpdesk or Department of Environment).
- Live errors seen on vuneli.com (Oct 1): Verde returns 500 and Home summary 503 — run pending live SQL migrations (incl. 0040_copilot_parts.sql) and redeploy; the compliance "Generate report" button no longer needs a Gemini key.

## Approval and Deliverables fix (1 Oct 2026)
- Redeploy to pick up the fix. Approving an old "VSME draft" task now writes the draft and links it from Deliverables. Clicking a task that was already decided no longer shows an error.
- If Deliverables stays empty after approving a VSME draft, check that the live database has the `reports` table (migration list in this file) and send the error reference shown in the app.

## Verde document drafter (2026-10-01)
- Nothing to set up. Redeploy, then ask Verde e.g. "write our supplier code of conduct", approve, and check it opens in Deliverables.

## Search visibility (2026-10-01)
- After the next deploy, re-run the Ahrefs site audit. Don't run it while a deploy is still going: pages crawled mid-deploy can report "broken JavaScript" for files that are being replaced.
- The deploy now pings IndexNow (Bing and others) on its own. Optional: add vuneli.com in Bing Webmaster Tools and import it from Google Search Console.

## Site audit score drops after a deploy (Oct 2026)

Ahrefs reports "broken JavaScript/CSS" on almost every page when it crawls while a new version is being deployed: pages fetched before the switch point to script/style files that the new version has replaced. The live site checked clean afterwards (no failed scripts, styles or fonts on 7 key pages).

What to do:
1. Deploy first, wait ~5 minutes, then start the Ahrefs crawl (or schedule the crawl at a time you don't deploy).
2. Re-run the crawl now; the JavaScript/CSS errors should clear.
3. Optional, permanent fix (keeps older files available during deploys — "skew protection", experimental in OpenNext): create a Cloudflare API token with "Workers Scripts: Read", then tell Vuneli's builder so it can be switched on. Needs: CF_WORKERS_SCRIPTS_API_TOKEN, CF_ACCOUNT_ID, CF_WORKER_NAME, CF_PREVIEW_DOMAIN (your workers.dev subdomain) as build variables.
4. The short glossary descriptions (English and Greek) are fixed in the code and checked: all 104 now fall between 110 and 158 characters. They go live with the next deploy.

## Add data page (Oct 2026)
- No new keys or migrations needed. After deploy, sign in and drop the EAC bill, the water bill and a bank CSV on **Add data** to check them.
- Scanned (picture-only) PDFs are refused until the image-capable AI key (Gemini/Lovable gateway) is added; photos work with Groq.

## Bill inbox (bills.vuneli.com) — 2 Oct 2026
- Deploy the latest code: the app now forwards non-bill vuneli.com mail to your Gmail, and Worker logging stays on.
- After deploying, the catch-all email rule is switched from "drop" to the app (done from chat once deploy is confirmed). Optional: set `MAIL_FALLBACK_TO` on the Worker to change where non-bill mail goes.
- Bill receipts: the app now emails the sender a "we received your bill" note. It only sends once `RESEND_API_KEY` and `EMAIL_FROM` are set on the Cloudflare Worker (neither is set as of 2 Oct 2026).
