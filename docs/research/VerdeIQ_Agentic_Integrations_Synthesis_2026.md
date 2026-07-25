# VerdeIQ — Agentic × Integrations Synthesis
### The "Unfair Advantage" Playbook: What Happens When Cyprus's Deepest Data Fabric Meets an Agent Swarm

**Version:** 1.0 · **Date:** 2026-07-25 · **Classification:** Strategic — Founder / Board / RIF Grant Annex
**Reads with:** `VerdeIQ_Agentic_AI_Strategy_2026.md` + `CYPRUS_INTEGRATIONS.md` + `VerdeIQ_Vision_2026.md`

---

## 0. Thesis in one paragraph

Neither an agent swarm without local data, nor a Cyprus integrations layer without cognition, is defensible on its own. Greenly has agents but no EAC bill parser. SoftOne has EAC data but no agent. **The moat is the intersection.** Every Cyprus-native connector (EAC PDF, CERA bulletin, TSOC XLSX, WDD bill, SoftOne journal, Bank of Cyprus PSD2, CY Login, Green Dot portal, CBAM registry) becomes a **tool** in the MCP contract. Every agent (CBAM Report Agent, Scope 3 Chaser, Regulatory Horizon Scanner, Grant Matcher, Verifier) *calls those tools as if they were native functions*. The result is not "software with AI features" — it is a **fleet of Cypriot-Greek-speaking digital employees** with hands on every meter, ledger, and registry in the country.

This document is the map of that intersection. It names every fusion, the workflow it enables, the customer wedge it creates, and the sequence to build it.

---

## 1. The Fusion Model — one diagram to memorise

```text
                         ┌──────────────────────────────┐
                         │   AGENT LAYER (AI SDK v5)    │
                         │   Planner / Executor / Judge │
                         │   Gemini 2.5/3 Pro reasoning │
                         └──────────────┬───────────────┘
                                        │  MCP tool calls
                                        ▼
              ┌──────────────────────────────────────────────┐
              │   MCP CONTRACT — internal tool bus           │
              │   every connector = one namespaced tool set  │
              │   eac.*  cera.*  tsoc.*  wdd.*  softone.*    │
              │   psd2.*  cbam.*  cylogin.*  greendot.*  ... │
              └──────────────────────────────────────────────┘
                                        │
        ┌───────────────┬────────────────┼─────────────────┬───────────────┐
        ▼               ▼                ▼                 ▼               ▼
  ┌───────────┐   ┌───────────┐   ┌────────────┐    ┌────────────┐  ┌───────────┐
  │ Utilities │   │ Accounting│   │  Banking   │    │ Compliance │  │  Identity │
  │ EAC CERA  │   │ SoftOne   │   │ BoC HB     │    │ CBAM ESRS  │  │ CY Login  │
  │ TSOC WDD  │   │ Epsilon   │   │ Alpha PSD2 │    │ CDP EMAS   │  │ Google MS │
  │ LPG PV    │   │ Sage Odoo │   │ AISP feeds │    │ Travelife  │  │ Entra ID  │
  └───────────┘   └───────────┘   └────────────┘    └────────────┘  └───────────┘
                                        │
                       Signed evidence • RoPA-auto • el-CY parsers
```

**Design invariant:** an agent never talks to a Cypriot data source directly. It talks to the MCP tool, which talks to the connector, which enforces auth, idempotency, source-hash, GDPR RoPA, and Greek/comma-decimal parsing. Agents get **capability without responsibility**; the tool layer carries the compliance load. This is what makes the swarm safe to ship to a CySEC-supervised customer.

---

## 2. The 20 Fusion Plays

Each play = **one agent × the connectors it consumes × the compressed workflow it collapses × the customer wedge it opens.** Ordered by defensibility × time-to-revenue, not by build order.

---

### Fusion 1 — CBAM Autopilot (the flagship)
- **Agents:** CBAM Report Agent (planner) + Supplier Chaser (executor) + Verifier (judge).
- **Connectors consumed:** SoftOne / Epsilon (purchase invoices with CN codes) → EAC (electricity intensity for embedded emissions if manufactured in CY) → CERA fuel-adjustment (for indirect factor) → CBAM Transitional Registry (XML submission) → CY Login (SP identity to registry) → Email-in (supplier PCF replies).
- **What collapses:** the 40-hour quarterly CBAM ritual (extract invoices → classify CN → chase suppliers → compute default vs actual → generate XML → upload) becomes a **90-minute human review** on a pre-filled draft with every number linked to its source hash.
- **Wedge:** every Cypriot importer of iron, steel, aluminium, cement, fertiliser, hydrogen, electricity is legally forced into this workflow from Jan 2026. There is no competitor with SoftOne + Epsilon + registry XML in one loop.
- **Pricing:** €499/mo standalone; €0 as growth bait inside the Compliance plan.

---

### Fusion 2 — EAC Bill Whisperer
- **Agents:** OCR Agent → Tariff Classifier → Anomaly Judge.
- **Connectors:** EAC PDF parser + CERA fuel-adjustment history + TSOC grid-mix (for S2 factor) + accounting connector (post the reconciled bill to the right GL account).
- **What collapses:** a shoebox of 12–36 monthly EAC PDFs (Greek and English variants, tariff codes 08/56/06/…) becomes a fully classified Scope 2 baseline **in the first onboarding session**. The Anomaly Judge flags tariff mis-classification (a €200–€1,200/yr saving per site — pays for VerdeIQ) and PSO/RES levy over-charges.
- **Wedge:** every SME onboards in minutes, not weeks. This is the **year-1 ROI** the sales deck needs.
- **Sub-agent kicker:** the Judge produces a "Tariff Switch Recommendation" letter, ready to send to EAC — an **actionable output**, not a dashboard.

---

### Fusion 3 — Grid-Intensity-Aware Load Shifter
- **Agents:** Load-Shift Optimiser (planner) + PV Forecast Agent.
- **Connectors:** TSOC hourly generation-mix (RES share → real grid gCO₂/kWh) + rooftop PV vendor cloud APIs (SolarEdge, Huawei, SMA, Fronius, Enphase) + BMS/IoT bridge (Siemens/Schneider/Honeywell) + weather API.
- **What collapses:** hotel/factory HVAC and pool-heating schedules re-planned nightly against tomorrow's forecast grid intensity and rooftop production. Output: a set-point CSV or a direct BACnet write.
- **Wedge:** first sustainability tool in CY that **actually reduces emissions** instead of only counting them. Sells into Travelife-audited hotels where the KPI is €/room-night AND kgCO₂/room-night.

---

### Fusion 4 — Open Banking Activity Autopilot
- **Agents:** Transaction Classifier + Missing-Bill Detective.
- **Connectors:** PSD2 XS2A via AISP aggregator (Tink / Salt Edge / GoCardless BAD) across BoC / Hellenic / Alpha / Eurobank CY / Astrobank / Ancoria + SoftOne/Epsilon for cross-check + EAC/WDD/LPG parsers for the source doc.
- **What collapses:** ~80% of Scope 1/2/3.4/3.6 activity data enters VerdeIQ **without a human touching a spreadsheet**. Bank line "PETROLINA 47.32L" is auto-linked to fleet fuel card CSV; "EAC 342.10" triggers a bill-request email if no PDF is on file.
- **Wedge:** Greenly and Watershed do not have PSD2 access in CY. This is the **Cyprus-only differentiator** their EU sales team cannot replicate.

---

### Fusion 5 — Regulatory Horizon Scanner → Client Action Queue
- **Agents:** Horizon Scanner + Impact Translator + Deadline Router.
- **Connectors:** CERA bulletins (RSS/PDF scrape) + Dept. of Environment (CBAM/ESRS) + Cyprus government gazette + EU Official Journal + Tax For All (TFA) circulars + CY Login for authenticated pulls.
- **What collapses:** the daily 200-page reading job of a compliance officer becomes a **prioritised inbox per tenant**: "CERA raised the RES levy on 2026-08-01 by 0.32c/kWh — your 2026 budget is +€1,840; approve to update forecasts."
- **Wedge:** ICPAC accountants pay for this alone (€99/firm/mo × N clients). It becomes the practice-management gateway drug.

---

### Fusion 6 — Grant Matcher × Company Profile Autopilot
- **Agents:** Grant Matcher (already shipped) + Company Enricher + Application Prefill Agent.
- **Connectors:** DRCIP company register (directors, filings) + Cystat NACE code + RIF Innovate portal + EU F&T API + SoftOne (turnover/headcount from payroll).
- **What collapses:** the 6–12 hour ritual of assembling a €10k RIF Innovation Voucher application to buy VerdeIQ **becomes one click**. The agent literally prefills the application to fund its own purchase.
- **Wedge:** unheard-of viral loop — the product sells itself by writing the grant that pays for it.

---

### Fusion 7 — VSME Report in a Weekend
- **Agents:** VSME Draft Agent + Evidence Gatherer + iXBRL Tagger.
- **Connectors:** EAC + WDD + Green Dot (packaging) + F-Gas + payroll (GESY/Social Insurance) + SoftOne journals + rooftop PV.
- **What collapses:** the EFRAG VSME Basic + Comprehensive modules become a **weekend deliverable** for a 15-person hotel. The agent writes the narrative in ASD-STE100, tags iXBRL, and outputs the PDF ready for the bank.
- **Wedge:** Bank of Cyprus and Hellenic are asking every SME borrower for VSME by 2027. First-mover wins the co-brand.

---

### Fusion 8 — Supplier Chaser Swarm (Scope 3.1 & 3.4)
- **Agents:** Chaser (writes bilingual EL/EN emails) + PCF Ingestor + Escalation Judge.
- **Connectors:** SoftOne supplier master + email-in (`suppliers@<tenant>.verdeiq.cy`) + Peppol AP (once live) + WhatsApp Business (Cypriot suppliers reply on WhatsApp, not email — this is the field truth).
- **What collapses:** the impossible task of getting Product Carbon Footprints out of 400 tier-1 suppliers becomes a **background swarm** that runs for weeks, tracks response rate, adapts tone, and escalates to the buyer only when the supplier is truly non-responsive.
- **Wedge:** WhatsApp is the killer local channel. No EU competitor talks to Cypriot suppliers on WhatsApp. We will.

---

### Fusion 9 — Tariff Optimiser + EAC Complaint Bot
- **Agents:** Tariff Optimiser (already surfaces from Fusion 2) + Complaint Drafter + CERA-Escalation Judge.
- **Connectors:** EAC bill parser (12-month history) + CERA published tariff table + Consumer Protection Service (CPS) template letters.
- **What collapses:** the awkward customer conversation with EAC becomes a **generated, signed, one-click letter** with the exact clause of the CERA decision that supports the switch or the refund claim.
- **Wedge:** produces visible €€ savings **in the customer's bank account within 60 days**. This is the testimonial engine.

---

### Fusion 10 — Travel Autopilot (Scope 3.6)
- **Agents:** Email Ingestor + Itinerary Parser + Radiative-Forcing Calculator + Policy Judge.
- **Connectors:** `travel@<tenant>.verdeiq.cy` + Cyprus Airways / Aegean / TUS / Ryanair / Wizz booking confirms + IATA airport DB + TMC CSVs (Salamis, Amathus, Top Kinisis, Louis).
- **What collapses:** the entire travel-emissions ledger fills itself. The Policy Judge flags flights that violated the sustainability policy **before** they are booked when hooked into Amadeus/Sabre.
- **Wedge:** the CFO gets a real number for the "how much did our travel cost the planet" board question — with radiative forcing baked in, not the fake 1.0× that most tools use.

---

### Fusion 11 — CY Login Federated Onboarding
- **Agents:** Onboarding Concierge.
- **Connectors:** CY Login (national SAML/OIDC) + DRCIP + TFA TIC verification + Cystat NACE.
- **What collapses:** signup goes from "create account, verify email, upload company docs, wait for KYC" to **"log in with CY Login → we already know who you are, your directors, your VAT number, your NACE code, your headcount band."** The company profile is pre-filled in 8 seconds.
- **Wedge:** this is a **trust signal** no EU competitor can replicate without a CY entity. Government-grade onboarding = enterprise-grade perception.

---

### Fusion 12 — Bank ESG Questionnaire Autopilot
- **Agents:** Questionnaire Mapper + Evidence Attacher + Human-Approval Router.
- **Connectors:** BoC / Hellenic ESG questionnaire templates + all upstream tenant data + Signed-evidence store.
- **What collapses:** the 60-question annual ESG survey the bank sends every corporate borrower becomes **auto-filled with source-linked answers**. Human approves; PDF ships.
- **Wedge:** the bank co-brand lever. Once BoC embeds VerdeIQ in their SME portal, we own distribution.

---

### Fusion 13 — Green Dot / WEEE / AFIS Declarations
- **Agents:** Producer-Responsibility Filer.
- **Connectors:** Green Dot portal + WEEE Cyprus + AFIS batteries + SoftOne stock movements (packaging weights).
- **What collapses:** quarterly packaging declarations, currently a two-day spreadsheet job for the ops manager, become a **one-hour review**.
- **Wedge:** the "boring" workflow every FMCG SME dreads. Owning it means owning the ops manager, who is the daily user.

---

### Fusion 14 — F-Gas Compliance Copilot
- **Agents:** F-Gas Log Writer + Leak-Test Scheduler.
- **Connectors:** EU F-Gas Portal + BMS/IoT (chiller alarms) + maintenance-vendor invoices via email-in.
- **What collapses:** every hotel and cold-chain SME has to log HFC top-ups. Missed logs are a fine risk. Agent watches for chiller-service invoices, extracts refrigerant type + kg, files the register entry.
- **Wedge:** narrow but sticky. Hotels stop hand-writing the F-Gas book.

---

### Fusion 15 — Peppol Access-Point Ingestion (2027)
- **Agents:** Invoice Classifier + Activity Router.
- **Connectors:** OpenPeppol AP (Storecove / Pagero / B2Brouter).
- **What collapses:** once CY's B2B e-invoicing mandate is live, **every invoice becomes structured JSON**. VerdeIQ becomes the cleanest activity feed in the country **automatically**, without OCR at all. This is the endgame data channel.
- **Wedge:** we ship the Peppol client in 2026 so we own the switch-on the moment the mandate flips.

---

### Fusion 16 — Bilingual Compliance Copilot (EL/EN)
- **Agents:** Explainer Agent (ASD-STE100) + Cypriot-Greek Localiser.
- **Connectors:** all above + glossary + pillar pages (already ASD-STE100).
- **What collapses:** the language barrier between the EU directive (English/legalese) and the Cypriot factory owner who reads Greek. The agent explains the CBAM CN code in a two-sentence WhatsApp message in Cypriot Greek.
- **Wedge:** cultural moat. Copy this from London and you get the accent wrong. Cypriot users detect it in the first sentence.

---

### Fusion 17 — ICPAC Firm Dashboard (Accountant Channel)
- **Agents:** Portfolio Scanner + Client-Health Judge + Fee-Opportunity Suggester.
- **Connectors:** SoftOne / Epsilon / Wolters Kluwer CCH firm-level + every tenant beneath.
- **What collapses:** the accountant sees **one board** with 200 clients, each with a compliance score, a data-freshness score, and a suggested upsell ("Client 47 crossed the CSRD threshold last quarter — offer the €4k ESRS engagement now").
- **Wedge:** the accountant becomes a distribution partner because we hand them **fee opportunities**, not just software.

---

### Fusion 18 — RIF Innovate Grant Auto-Assembler
- **Agents:** Grant Matcher (shipped) + Application Drafter + Budget Justifier + Consortium Suggester.
- **Connectors:** RIF portal + DRCIP + Cystat + Horizon Europe partner search API.
- **What collapses:** the "we should apply for RIF" idea → "submitted proposal with 3 partners and a €120k budget" in **two working days** instead of two months.
- **Wedge:** VerdeIQ becomes the **grant-writing OS for Cypriot SMEs**, not only an ESG tool. This expands TAM 5×.

---

### Fusion 19 — Edge Telemetry × Anomaly Swarm
- **Agents:** Stream Watcher + Root-Cause Investigator.
- **Connectors:** VerdeIQ Edge (Raspberry Pi at customer) + Kamstrup / Landis+Gyr sub-meters + BMS (Siemens/Schneider/Honeywell) → `/api/public/telemetry` MQTT.
- **What collapses:** a chiller running out-of-hours because a maintenance tech forgot to reset the schedule — currently caught in the next quarterly review — becomes a **Slack ping at 03:14**.
- **Wedge:** we become **operational software**, not reporting software. Retention flips from annual-renewal-risk to embedded-in-daily-ops.

---

### Fusion 20 — Verifier / Auditor Handoff Agent
- **Agents:** Assurance Packager + Auditor-Q&A Bot.
- **Connectors:** all evidence store + auditor's file-share (SharePoint/Drive) + iXBRL taxonomy.
- **What collapses:** the third-party limited-assurance engagement (mandatory under CSRD) goes from **"6 weeks and €18k"** to **"2 weeks and €7k"** because every number ships with its provenance chain. Auditor asks a question in a chat window; the bot returns the evidence + calculation trace.
- **Wedge:** the audit-firm partnership is the enterprise gateway. Once the auditor accepts the VerdeIQ trace, every one of their clients becomes a lead.

---

## 3. Fusion Matrix — what each connector unlocks

Read across: pick a connector; see every agent it powers. This is the **build-priority scoring table**.

| Connector | Tier | Agents unlocked | Cumulative wedge |
|---|---|---|---|
| EAC PDF parser | T0 | 2, 3, 5, 7, 9, 12, 20 | 7 agents |
| CERA bulletin | T0 | 2, 5, 9 | 3 |
| TSOC gen-mix | T0 | 3, 7 | 2 |
| WDD water | T0 | 4, 7, 12, 13 | 4 |
| SoftOne/Epsilon | T0 | 1, 4, 6, 8, 11, 13, 17, 18 | 8 |
| CY Login | T1 | 6, 11, 17 | 3 |
| PSD2 aggregator | T1 | 4, 6, 8, 9 | 4 |
| Rooftop PV cloud | T1 | 3, 7, 19 | 3 |
| Email-in / WhatsApp | T1 | 8, 10, 14 | 3 |
| CBAM registry | T2 | 1, 20 | 2 |
| Peppol AP | T2 | 15, 17 | 2 |
| Edge/BMS | T2 | 3, 14, 19 | 3 |

**Read the top row:** the EAC parser powers **seven** of the twenty agents. Ship it first, second, and third. It is the single highest-leverage engineering unit in the company.

---

## 4. The one-slide moat

Anyone can rent Gemini. Anyone can install AI SDK v5. **Nobody else has:**

1. Signed evidence from every Cypriot utility bill format (EL + EN, all tariff codes).
2. A CERA fuel-adjustment history parsed monthly since day one.
3. A live TSOC grid-intensity feed with rooftop-PV offset.
4. Read access to every major CY accounting product's chart of accounts.
5. PSD2 coverage of all six retail banks via one aggregator, in EUR.
6. A CY Login SAML/OIDC registration with DITS.
7. A WhatsApp Business channel wired to a supplier-chaser agent that writes Cypriot Greek.
8. A CBAM XML generator tied to Cypriot importer records with source hash back to the SoftOne invoice line.

That is the **data fabric**. The agents are the **surface area**. The MCP contract is the **glue**. Reproducing this from London takes 18–24 months and a Cypriot hire.

We have a 12-month lead if we start now. 18 if we ship Fusion 1, 2, 4 by Q4 2026.

---

## 5. Sequence — the only order that matters

**Q3 2026 — foundation (revenue-adjacent from day 1)**
- Fusion 2 (EAC Whisperer) → onboarding accelerator, first customer visible €€ saving.
- Fusion 11 (CY Login onboarding) → trust signal.
- Fusion 5 (Horizon Scanner) → ICPAC pilot.
- MCP contract v1 (`eac.*`, `cera.*`, `tsoc.*`, `softone.*` tools).

**Q4 2026 — flagship (the story)**
- Fusion 1 (CBAM Autopilot) → RIF grant narrative + press.
- Fusion 4 (Open Banking) → the differentiator vs Greenly.
- Fusion 6 (Grant Matcher × Prefill) → viral loop.

**Q1 2027 — moat deepening**
- Fusion 7 (VSME weekend report) + Fusion 12 (Bank ESG) → BoC/Hellenic co-brand pitch.
- Fusion 8 (Supplier Chaser Swarm, WhatsApp) → Scope 3 defensibility.
- Fusion 17 (ICPAC Firm Dashboard) → channel unlock.

**Q2 2027 — operational software**
- Fusion 3 (Load Shifter) + Fusion 19 (Edge Telemetry) → we become daily ops, not annual reporting.
- Fusion 20 (Auditor Handoff) → enterprise gate.

**Q3+ — endgame**
- Fusion 15 (Peppol) → auto-activity feed the day the mandate flips.
- Fusion 18 (RIF Auto-Assembler) → we become the OS for Cypriot innovation grants.

---

## 6. Governance non-negotiables (repeated because they will save us in year 2)

- Every agent tool call is logged to the tenant's RoPA. Auto-generated. Auditor-visible.
- Every mutating tool (`cbam.submit`, `eac.write_complaint`, `bank.pay`) is **human-approval-gated** until the tenant explicitly upgrades to full autonomy on that specific tool. Never a blanket "autonomy toggle."
- Every model call includes the source-hash of the evidence in the context, so hallucinations are cheap to catch.
- No agent talks to a customer's bank, registry, or gov portal on its own credentials; always the tenant's, always via the tool.
- Cypriot Greek is a first-class output language for every user-facing agent message, not an afterthought.
- EU AI Act: every agent card ships with its risk classification, its training data disclosure, and its human-oversight design (already scaffolded in the Agentic Strategy doc).

---

## 7. The pitch, compressed

> *VerdeIQ is a fleet of Cypriot-Greek-speaking digital employees with hands on every meter, ledger, bank account, and registry in the country. They read your EAC bill in seconds, chase your suppliers on WhatsApp, file your CBAM report to the EU registry, draft your RIF grant application, and warn you at 3 a.m. when your chiller is bleeding money. You approve. They ship.*

That is what the intersection of the two research documents produces. Everything in this file is downstream of that sentence.

---

**End of synthesis.**

---

## 8. Fusion 21: Compliance Gap → Auto-Generated Course → Certified Staff

The Automated Course Generator at `/app/learn` is the fusion play we already shipped and under-sold in earlier drafts. Restated cleanly so the roadmap treats it as a first-class agent, not a content feature.

**The loop:**

1. **Signal.** The insights agent, the CSRD/VSME checker, or an emissions-hotspot rule fires (electricity > 40% of footprint, missing Scope 3 category, new ESRS amendment, RIF window opening).
2. **Gap check.** The generator queries the tenant's course catalogue, filtered by industry, and skips anything already covered.
3. **Prioritise.** Compliance and explicit recommendations rank high; hotspots rank medium. Cap at three courses per run so we never spam.
4. **Generate.** Gemini produces a 3-4 module scaffold with 4-5 lessons each, mixing text (800-1500 words), video (8-second explainers), quiz, and multi-step exercise. Course thumbnail, per-lesson images, and per-lesson videos are generated inline.
5. **Persist and notify.** Course lands published in Postgres. A notification with a deep link fires to the sustainability lead and the tagged staff.
6. **Certify.** On completion, the certificate endpoint issues a signed PDF the accountant can attach to the CSRD Article 29d "adequate training" disclosure or hand to the bank at loan-review time.

**Why this is a fusion, not a standalone feature:**

- The **integrations layer** (EAC, JCC, SoftOne, Cyprus Customs) produces the emissions and invoice data that surfaces the gap.
- The **agent layer** (CBAM Autopilot, Supplier Chaser, Compliance Scanner) interprets that data and emits the trigger.
- The **learning layer** turns the trigger into training that the human on the other end of the recommendation can actually act on.
- The **marketplace layer** closes it: the course ends with a marketplace CTA ("book a certified installer" or "apply to the RIF window we just wrote a module about").

Without the integrations, the courses are generic. Without the agents, there is nothing to trigger them. Without the certificate, the auditor does not care. Without the marketplace, the training does not convert into revenue. Fusion 21 is the only one of the twenty-one plays that touches all four layers in a single loop.

**Sharpening backlog (already visible in the code):**

- Replace the English keyword extractor with an embedding classifier so Greek terms and new regulations are picked up without a code deploy.
- Add a draft-review-publish gate for compliance and tax topics before the course goes live in the tenant academy.
- Enforce ASD-STE100 in the generator prompt and add a linter pass before persistence.
- Version courses when the underlying regulation is amended, so completed certificates carry the ESRS revision they were trained on.

Fusion 21 is the play that most obviously answers "so what does the agentic stack actually do for my accountant on Tuesday morning." The answer is: it hands them a fifty-minute course, in Greek, on the exact gap the system found in their data last night, and a certificate at the end that their auditor will accept.
