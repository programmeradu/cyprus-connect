# VerdeIQ, Under The Hood

*A companion to the business overview, written for the person who has to evaluate VerdeIQ on a spreadsheet: the CFO, the IT director, the procurement lead, the accountant thinking about standardising forty clients on one tool, the investor trying to understand the moat.*

**One-line version:** The overview told you what VerdeIQ does. This document tells you how it does it, why the pieces fit together, and why the whole is harder to copy than it looks.

---

## Why This Document Exists

The business overview sells relief. This one sells confidence.

If you have been asked to sign the contract, defend the choice in a procurement meeting, or explain the technology to a board that has seen too many "AI-powered" pitches, you need the layer underneath. Same warm tone, no acronym-dumping, but the actual moving parts on the table.

We will walk through four things: the integrations that feed the platform, the agents that do the work, the learning surface that turns strangers into buyers, and the marketplace that turns numbers into action. Then we will explain why those four together are a defensible product, not a feature list.

---

## 1. The Integrations, Or: How The Data Gets In Without You Typing It

The single biggest reason sustainability projects fail is data entry fatigue. Someone volunteers to be "the sustainability person" in January, spends four months chasing bills across six inboxes, and by May the project is dead.

VerdeIQ removes that job. Not by asking you to type faster, but by connecting to the systems where the data already lives.

**What VerdeIQ pulls from, in Cyprus specifically:**

- **EAC (electricity).** Monthly consumption, tariff class, and billing period, pulled from the customer portal. Scope 2 becomes a background job, not a chore.
- **JCC and Cyprus banks (PSD2 open banking).** Read-only access to transaction descriptions and merchant categories. Fuel spend, travel spend, and supplier spend become emission estimates without a single receipt uploaded.
- **QuickBooks and Xero.** The chart of accounts is already a rough emissions taxonomy. We map account codes to emission categories once, then keep them in sync.
- **Cyprus Customs and TARIC.** CBAM-covered imports and exports are detected from the CN codes already on your invoices. You do not maintain a second list.
- **Registrar of Companies.** Entity data, ownership structure, and filing calendar picked up automatically so you never mis-classify who has to report what.
- **Ariba, Coupa, and SAP procurement feeds.** For firms selling into large EU buyers, supplier questionnaires arrive as structured data, not PDFs.
- **IMO and EU MRV.** For Limassol shipping agents, bunker fuel and voyage data flow in from existing reporting channels.
- **Cyprus Meteorological Service and ENTSO-E.** Real-time grid carbon intensity, weather-normalised energy baselines, and hourly matching for anyone claiming clean-energy consumption.

**What that means in practice:** a typical Cyprus SME onboarding takes about ninety minutes of connection work, spread over two sessions. After that, roughly eighty percent of the data flows on its own. The remaining twenty percent (the odd receipt, the cash purchase, the one supplier that still emails PDFs) is where the human touches the system.

**Why this is hard to copy:** each of those connectors is a small piece of unglamorous engineering. The EAC portal changes its markup twice a year. The Cyprus bank PSD2 endpoints have local quirks. TARIC updates monthly. A global tool will not do this work for a market of one million people. We already have.

---

## 2. The Agents, Or: Software That Does The Job, Not Just Displays It

Most sustainability tools are dashboards. You log in, you look at a chart, you close the tab, nothing has changed. VerdeIQ is built the opposite way: the platform does work while you sleep, and the dashboard is where you review what it did.

We call these agents. Think of each one as a specialist junior colleague who never forgets a deadline and never gets bored of paperwork. The human stays in charge; the agent handles the tedious part and asks for a signature at the end.

**The agents that are live or shipping in the next two quarters:**

**The CBAM Autopilot.** Watches your import and export invoices. When a CN code covered by CBAM appears, it opens a draft report for that quarter, pulls the embedded emissions from the supplier (or applies the default value if the supplier has not answered yet), fills the EU form, and puts it in your review queue three weeks before the deadline. You read it, you sign it, it files.

**The EAC Bill Whisperer.** The moment a new EAC bill posts to the portal, it is read, validated against the previous month, converted to Scope 2 using the correct Cyprus grid factor for that billing period, and logged. If consumption jumps more than fifteen percent, you get a note explaining likely causes (weather, occupancy, equipment fault).

**The Scope 3 Supplier Chaser.** Your ten largest suppliers get a friendly, branded questionnaire in their language. Replies are parsed automatically. Non-responders get one reminder, then a fallback estimate is used and flagged. What used to be a three-month project becomes a two-week background task.

**The Regulatory Horizon Scanner.** Reads the Official Journal of the EU and the Cyprus Government Gazette every morning. When something lands that affects a business like yours, you get a plain-language brief: what changed, when it applies, what to do. No mailing lists, no consultant retainers.

**The Grant Radar.** Scans EU Funding and Tenders, Research and Innovation Foundation calls, and Invest Cyprus announcements. When a grant matches your profile, you get an alert with the deadline and a draft first page of the application already populated from your VerdeIQ data.

**The Report Composer.** Assembles the annual CSRD, VSME, or ESRS pack from the year's data. Produces the narrative sections in your voice using the notes you have already written elsewhere on the platform. You edit, you approve, you file.

**The Audit Companion.** For the week the auditor is in the building. Every number on every report links back to the source document, the calculation, the emission factor version, and the person who approved it. The auditor asks a question, you click twice, they have the answer.

**Fifteen agents are on the roadmap.** The seven above are the ones that pay for the subscription on their own.

**The rule that keeps this out of trouble:** every agent operates under a human-in-the-loop contract. Nothing goes to a regulator, a customer, or a bank without a named person clicking approve. The EU AI Act is not a problem for us because we designed for it before it was law.

**Why this is hard to copy:** agents are not chat wrappers. Each one is a durable workflow with retries, audit trails, tool contracts, and domain logic. Building one is a two-month project. Building fifteen that share a common tool layer is a two-year project. We are eighteen months into it.

---

## 3. The Learning Surface, Or: Why Every Company Gets Its Own School

Most sustainability platforms treat "learn" as a blog. VerdeIQ ships two Learn surfaces, and the second one is the real story.

### 3a. Public Learn (the SEO funnel)

A bilingual library of twenty-six long-form pillar guides and fifty-one glossary terms, each on its own routable URL with JSON-LD, hreflang (EN and el-CY), and a canonical link. Written in ASD-STE100 Simplified Technical English so the same paragraph is legible to an auditor, a translator, and Google's crawler. Sixteen of the pillars ship with a working calculator embedded in the article itself (CBAM cost estimator, Scope 1-2-3 calculator, CSRD vs VSME scoping tool) with per-user state, so a reader can go from "what is CBAM" to "here is my indicative 2026 liability" without leaving the page.

That is the funnel. It is cheap to run and it compounds. But it is not the moat.

### 3b. The Automated Course Generator (the "your company has its own academy" surface)

Inside the app, at `/app/learn`, every tenant has a private, AI-generated course catalogue that rebuilds itself as the tenant's data changes. This is what nobody else in the Cyprus market has, and it is what turns Learn from a marketing channel into a product surface.

**How it works, end to end.**

1. **A trigger fires.** The generator listens for four kinds of signals: a new recommendation from the insights agent ("switch fleet to electric by Q3"), a compliance gap the CSRD/VSME checker flagged ("no Scope 3 category 1 data"), an emissions hotspot crossing a threshold (electricity above forty percent of the footprint, transportation above twenty-five), or a manual "generate for us" click from the sustainability lead.
2. **Gap analysis runs.** The generator queries the tenant's existing course catalogue (filtered by industry) and asks: for each recommendation, gap, or hotspot, is there already a course that covers it? If yes, do nothing. If no, add it to the queue, tag it with a priority (high for compliance and recommendations, medium for hotspots), and cap the run at the top three most important courses so we never dump twenty half-baked modules on one user.
3. **Course structure is generated.** For each queued topic, a prompt goes to Gemini with the tenant's industry, company name, difficulty target (beginner, intermediate, advanced), and the source context that triggered the course. Gemini returns a JSON scaffold of three to four modules, four to five lessons per module, mixing four content types: text (eight hundred to fifteen hundred words per lesson, with H2/H3 structure, examples, and case studies), video, quiz (four to six questions with explanations), and multi-step exercise.
4. **Media is generated.** For each lesson marked `needsImage`, an image goes into the queue with a lesson-specific prompt. For each lesson marked `needsVideo`, an eight-second explainer video is generated. A sixteen-by-nine course thumbnail is also generated from the course title and industry. All of it is inlined into the lesson HTML before persistence.
5. **The course is persisted and published.** Course, modules, and lessons land in Postgres with ordering, estimated minutes, and content JSON. The course is published immediately (subject to the human-in-loop note below) and a notification is created for the user with a deep link to `/app/learn/[courseId]`.
6. **Enrollment, progress, certificate.** The user enrolls, works through lessons at their own pace, progress is tracked per-lesson, and on completion the certificate endpoint issues a signed completion certificate they can attach to their CSRD social disclosures or hand to their bank.

**Why this is the moat, not the pillar articles.**

- **Every tenant gets a course catalogue nobody else can see.** A hotel in Paphos and a cement importer in Limassol will never see the same catalogue, because their emissions profiles, compliance gaps, and recommendations are different. That is not a content library, it is a personalized academy.
- **The training closes the loop the agents open.** When the CBAM Autopilot flags that the tenant is missing supplier emissions data, the generator ships a Scope 3 supplier-engagement course to the accountant the next morning. The recommendation and the training arrive together, so the accountant knows what to do and how to do it, from the same product, at the same price.
- **Certificates create a paper trail auditors like.** CSRD Article 29d requires "adequate training" for staff involved in sustainability reporting. A tenant-specific certificate stamped with the exact modules the accountant completed is the cheapest possible answer to that requirement. Nobody else in Cyprus is issuing them.
- **Content freshness is automated.** When the ESRS is amended or a new Cyprus grant window opens, the generator picks up the new context on the next trigger and produces updated modules. The platform's education layer does not go stale, because it is not maintained by hand.
- **It compounds the SEO funnel.** The public pillars pull the accountant in. The tenant-specific academy is what keeps their whole finance team logged in.

**What we still need to sharpen (told straight because it matters).**

- The topic extractor uses a hard-coded English keyword list. It misses CBAM, CSRD, ESRS, and Greek terms unless they are added. This is next quarter's work: replace the keyword match with an embedding-based classifier so the extractor speaks Greek and understands new regulations without a code deploy.
- Courses publish immediately. For high-stakes topics (compliance, tax) we will add a "draft, review, publish" gate so a human reviews the generated content before it lands in the tenant's academy.
- The prompt does not yet enforce ASD-STE100 the way the public pillars do. The next iteration adds a linter pass before persistence so the generated lessons read the same way the public library does.

**The unusual thing we do:** we treat internal training as an agentic output, not a content-marketing job. Global platforms give every customer the same LMS. VerdeIQ generates a fresh one, in the customer's language, for the customer's exact regulatory and emissions position, on the day the data changes. That is not a feature. That is a category the Cyprus market has not seen.

---

## 4. The Marketplace, Or: Where Numbers Become Action

Measuring emissions without changing anything is a very expensive way to feel guilty. VerdeIQ closes the loop by connecting each reduction opportunity to a vetted local provider.

**How the marketplace works:**

- Every recommendation in the Reduce module (install solar, switch to LED, replace the diesel generator, retrofit insulation, move to an EV fleet, buy a heat pump, right-size the air conditioning) links to two or three certified Cyprus-based providers.
- Providers are vetted on three criteria: proper licensing, verifiable past installations, and willingness to be reviewed publicly by their customers.
- The customer sees indicative pricing, typical payback in months, applicable Cyprus grants, and past customer notes before they contact anyone.
- VerdeIQ takes a small introduction fee from the provider on successful jobs. The customer pays what they would have paid the installer directly.

**Categories in scope for Cyprus:**

- Rooftop solar and battery storage
- Energy audits and thermal imaging
- LED retrofits and HVAC replacement
- EV fleet leasing and charging infrastructure
- Insulation, glazing, and shading retrofits
- Waste separation and organic composting
- Verified carbon offset projects (a small, cautious selection, offsets are not a substitute for reduction and we say so on every page)
- Green loan and green lease introductions through partner banks

**Why this changes the business model:** the subscription pays for the platform. The marketplace pays for the growth. A customer who acts on a recommendation generates ten to fifty times their subscription value in introduction fees, and gets a real reduction in their footprint that shows up on next year's report. Everyone is aligned.

**Why this is hard to copy:** a marketplace of vetted local providers is not a database. It is a curation practice. It takes years to build the provider trust, the customer reviews, and the reputation that makes an SME comfortable spending eighteen thousand euros on solar because VerdeIQ suggested the installer.

---

## 5. Why The Four Pieces Are Stronger Together Than Apart

Any competitor can build one of the four pieces. What they cannot easily build is the loop.

Here is the loop, on one page:

1. **Integrations** pull the data in with almost no human effort.
2. **Agents** turn that data into reports, alerts, and draft actions, on schedule, without prompting.
3. **The learning surface** brings new customers in for free and educates them to the point where they trust the numbers.
4. **The marketplace** turns the numbers into action, closes the sustainability loop, and funds the growth of the other three.

Each piece feeds the next. Integrations feed the agents. The agents produce the reports that make the numbers credible. Credible numbers make the marketplace recommendations trustworthy. Marketplace actions produce new data that flows back through the integrations. The learning surface pulls in the next customer, who plugs into the integrations, and the loop starts again.

Take out any one piece and the other three get weaker.

- Without integrations, the agents starve.
- Without agents, the integrations are just plumbing.
- Without the learning surface, customer acquisition is a paid-media grind.
- Without the marketplace, the numbers never turn into savings and the customer eventually asks what they are paying for.

A competitor arriving in Cyprus tomorrow would have to build all four in parallel, in Greek, against a team that has been at it for two years and already owns the search results. That is the moat.

---

## 6. What This Means For Different Buyers

**For the CFO.** The subscription is one line item. The savings are three: consultant fees you no longer pay, grants you now qualify for, and reduction actions with sub-five-year paybacks that your operations team can execute. Return on investment is measured in months, not years, and every number is auditable.

**For the IT director.** Everything runs on modern infrastructure, EU data residency, SSO, role-based access, full audit logs, granular data export, API access on business-tier plans and above. No on-premise install, no VPN, no consultant to keep the lights on.

**For procurement.** Transparent EUR pricing, no per-seat charges that punish adoption, twelve-month rolling contracts, exit with your data in one click, GDPR data processing addendum on file, insurance in place, references available on request from other Cyprus SMEs.

**For the accountant with forty clients.** Partner tier gives you a single console across every client, standardised workflows, white-label reporting, and revenue-share on marketplace referrals your clients act on. Sustainability becomes a service line, not an unpaid favour.

**For the investor or partner.** The moat is the loop above. The market is captive (CSRD, VSME, and CBAM are not optional). The unit economics of a fifty-article SEO corpus in a one-million-person market are unusually favourable. The marketplace turns a SaaS business into a two-sided one without changing the buyer experience.

---

## 7. The Honest Limits

We are not going to pretend the product is finished. It is not. Here is what we are still working on, publicly:

- **Direct EAC billing API.** We currently pull from the customer portal. A signed API agreement would remove the last piece of scraping. Conversations are ongoing.
- **Marketplace depth.** Solar and LED are well covered. EV fleet leasing has three good providers; we want six. Waste and composting has two; we want more.
- **Agent explainability.** Every agent shows its working, but the UX for "why did the agent do this" is still a v1 pattern. We are iterating.
- **The Greek-language corpus** covers pillars and glossary well but is still building depth on the news and commentary side. We publish weekly.
- **The Cyprus SME Sustainability Index.** Announced for Q3. Not shipped yet.

We publish a public roadmap. If something on it matters to your decision, we will tell you the current honest state of it on a call.

---

## 8. What Comes Next For You

If you have read this far, you are the person the sales call was designed for. The next useful step is not another document.

1. Send us the shape of your business: entity type, headcount, sector, main customers, reporting deadlines you are already worried about.
2. We will send back a one-page fit assessment with the specific agents and integrations that apply to you, and an honest estimate of ninety-day time-to-value.
3. If it looks right, we schedule a two-hour working session with your finance or operations lead and connect the first three integrations live. You leave with a real footprint on your screen.

No slide decks. No procurement dance. If it fits, it fits.

---

## In One Paragraph, For The Board Meeting

VerdeIQ is a four-part system: local integrations that pull data in without human effort, autonomous agents that turn that data into audit-ready reports and actions, a bilingual learning surface that brings new customers in for free, and a marketplace that turns recommendations into revenue-generating action. Each piece feeds the next, and the whole is defensible because a competitor would have to rebuild all four in parallel, in Greek, against a team already two years in. It is the operating system for Cyprus sustainability, priced for the SME, engineered for the auditor, and built for the regulator.

---

*"A dashboard shows you the problem. A system solves it. VerdeIQ is a system."*
