# Things only you can do (outside the app)

Updated after every build turn. Newest changes first. Tick items off here when done.

_Last updated: 26 September 2026 — error-leak cleanup turn (nothing new for you to do this turn)._

**This turn:**
- Run `scripts/sql/0022_sites_and_roles.sql` on the production database before deploying (after `0020` and `0021` if not done). The preview database already has it. It adds a site column to readings and a separate admin-role table.
- Nobody is an admin yet, so the marketplace admin page now refuses everyone. To make yourself admin, run the grant at the bottom of `0022` on production with your own account id (find it in the `user` table by your email). Do not grant the QA test account.
- Readings don't carry a site yet, so the Site filter shows "Whole workspace" only until bills or connections are tagged per site (Limassol, Nicosia...).

**Previous turn:**
- Run `scripts/sql/0021_cbam_suppliers.sql` (and `0020` if not done yet) on the production database before deploying.
- Create a Resend account, verify a sending domain, then set Cloudflare secrets `RESEND_API_KEY` and `EMAIL_FROM`.
- Get the official CBAM Registry XML format (XSD) so the export can be validated.

## Needed now

| # | What | Where | Why it matters | Blocks |
|---|------|-------|----------------|--------|
| 1 | Set `CRON_SECRET` (any long random value) | Cloudflare dashboard → Workers → vuneli → Settings → Variables (secret) | Without it the 15-minute heartbeat skips, so agents only run when you click "Run". | Evidence agent and CBAM agent running on their own |
| 2 | Set `GEMINI_API_KEY` | Cloudflare Worker secrets (same place) | Photo/scan bill reading and the copilot need it. | Bill photo OCR |
| 3 | Confirm the CBAM rules the agent uses, against the official texts: annual declaration due **30 September** of the following year; **50 tonne** yearly exemption (electricity and hydrogen not counted); default values still allowed in the definitive period | EUR-Lex: Regulation (EU) 2023/956 and amending Regulation (EU) 2025/2083; DG TAXUD CBAM page | The agent's deadlines and "below threshold" answer depend on these. I applied them from memory of the amendment; they must be checked before any customer relies on them. | Selling the CBAM agent |
| 4 | Get the Commission's **definitive-period default values table** (with mark-ups) and the full Annex I CN code list | DG TAXUD CBAM page (published implementing acts) | Our built-in defaults are the older indicative table and miss some steel codes (e.g. 7209, 7211, 7219–7229). Lines on defaults are flagged, but the numbers must be the official ones. | Accurate CBAM figures |
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

## Nango (accounting connections) — added 30 Sep 2026
1. Create a free account at https://app.nango.dev (EU data region if offered).
2. Environment Settings → copy the **Secret key** (dev environment first).
3. Tell the agent when ready; it will open a secure form to save it as `NANGO_SECRET_KEY`.
4. Later, per provider (Xero, QuickBooks/Intuit): create your own developer app and paste its client ID/secret into Nango, not into Vuneli.
Note: SoftOne is not in Nango's catalogue (checked 30 Sep). It would need a custom connection or a CSV import.

## Bank of Cyprus developer access — added 30 Sep 2026
1. Register at the Bank of Cyprus developer portal (developer.bankofcyprus.com) and create a sandbox app.
2. Subscribe it to the Accounts (AIS) API; payments are not needed.
3. Note the **client ID** and **client secret**. Tell the agent when ready; they are saved as `BOC_CLIENT_ID` / `BOC_CLIENT_SECRET` (never pasted in chat).
4. Live (non-sandbox) bank data under PSD2 needs a licensed provider (AISP) or a partner that holds one. Ask BoC how a startup can pilot without its own licence.
Use: read business account transactions to find fuel, electricity and freight spend automatically.
