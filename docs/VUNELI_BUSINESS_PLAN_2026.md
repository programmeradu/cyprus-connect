# Vuneli Ltd

## Business Plan 2026 - 2030

**Sustainability compliance software for Cypriot small and medium enterprises**

Prepared for: Cyprus Startup Visa Scheme (Deputy Ministry of Research, Innovation and Digital Policy), Research and Innovation Foundation calls PRE-SEED/0526 and SEED/0525, and seed-stage equity investors.

Version 1.0 - master document. Date of drafting: February 2026.
Product: https://verdeiq.stauniverse.tech

---

### How to read this document

This is the master plan. It runs to roughly fifty pages and carries the full evidence base, the five-year model and the assumption register.

The Cyprus Startup Visa Annex II business plan has a hard limit of ten to fifteen pages in PDF. That submission document is a separate file, `VUNELI_STARTUP_VISA_ANNEX_II.md`, distilled from this one. Every figure in the short version is taken from this master without change. Where an evaluator asks for the working behind a number in the short version, the answer is in this document at the section named in the cross-reference.

Evidence in this plan is labelled by tier:

- **T1** - our own data: interviews we ran, product usage, signed documents.
- **T2** - named primary third-party data: CYSTAT, Eurostat, the European Commission, the Cyprus Registrar of Companies, EU legal texts.
- **T3** - analyst or vendor market reports.
- **T4** - analogy from a comparable market, labelled as analogy.
- **T5** - founder assumption, with stated basis and a sensitivity range.

Where a source could not be verified to our satisfaction before drafting, the claim carries the marker **[verify]** and is excluded from the financial model. We would rather show the gap than round it away.

---

## Table of contents

| # | Section | Page |
|---|---|---|
| 1 | Executive summary | 3 |
| 2 | Problem and regulatory context | 5 |
| 3 | Solution and product | 9 |
| 4 | Market analysis | 14 |
| 5 | Competitive landscape | 19 |
| 6 | Business model and pricing | 22 |
| 7 | Go-to-market | 25 |
| 8 | Product roadmap and technology | 29 |
| 9 | Team and organisation | 32 |
| 10 | Operations, data protection and Cyprus compliance | 36 |
| 11 | Financial plan | 38 |
| 12 | Risk register | 46 |
| 13 | Funding ask and use of funds | 49 |
| 14 | Milestones and long-term view | 51 |
| A | Assumption register | 53 |
| B | Cyprus Startup Visa requirement map | 55 |
| C | Sources | 57 |

---

# 1. Executive summary

Vuneli is a Cyprus company that builds sustainability reporting software for Cypriot small and medium enterprises. The product turns the data a company already has, its electricity bills, its fuel purchases, its supplier invoices, into a disclosure that a bank, a large customer or an auditor will accept.

We are pre-revenue. The product is built and running at https://verdeiq.stauniverse.tech with a working console, an agentic copilot, a VSME report drafting engine and seven Cyprus-relevant data connectors. We have not yet taken a paying Cypriot customer. The first four months of the plan exist to fix that, and every projection after Month 4 depends on what those months teach us.

**The problem.** From 2025 onward, large EU companies subject to the Corporate Sustainability Reporting Directive must report emissions across their value chain. They cannot do that without data from their suppliers. In Cyprus, most of those suppliers are firms with ten to sixty employees, a part-time finance person and no sustainability function. The same firms face the Carbon Border Adjustment Mechanism if they import cement, steel, aluminium, fertiliser, hydrogen or electricity, and the definitive CBAM regime started in January 2026. The obligation arrives as a customer email with a spreadsheet attached, and the recipient has no idea what to put in it.

Cyprus makes this harder than the EU average in one specific, measurable way. The national grid runs at roughly 610 gCO2 per kWh against a European average near 230. A Cypriot firm that copies a generic European emissions factor understates its Scope 2 figure by a factor of more than two, and any buyer who checks will reject the number.

**The product.** Vuneli holds Cyprus-specific emission factors, connects to the data sources Cypriot firms actually use, and drafts the disclosure itself. A person reviews and approves every output. The copilot proposes; it never files. Approved actions write to an audit ledger, which is what makes the output defensible when a buyer or an assurance provider asks how a number was produced.

**The market.** Cyprus has roughly 55,000 to 60,000 active enterprises, of which almost all are SMEs [T2, CYSTAT and the European Commission SME Performance Review]. Applying employee-size, sector-exposure and digital-readiness filters, we reach an addressable count of 6,194 firms and a Cyprus serviceable market of 7.17 million euro in annual contract value. The funnel and every filter are shown in section 4. We do not claim a percentage of that market. The five-year customer count is derived from the sales headcount in section 11 and the close rates in section 7, and the arithmetic is shown.

**The financial position.** Base case revenue reaches 62,560 euro in 2026, 693,986 euro in 2028 and 2,121,962 euro in 2030, with exit ARR of 1,968,600 euro. Gross margin moves from 52.0 per cent to 77.8 per cent as onboarding is automated. EBITDA turns positive in 2030 at 140,726 euro. The customer acquisition cost payback shortens from 27.6 months to 8.6 months. Twenty-four people are employed in Cyprus by the end of 2030, up from six at the end of 2026.

**The ask.** 900,000 euro to cover the period to the end of 2027: 600,000 euro of seed equity, 180,000 euro from Cyprus Research and Innovation Foundation SEED, and 120,000 euro from RIF PRE-SEED, on top of 90,000 euro of founder capital already committed. This funds the milestone that matters: forty paying Cypriot customers and a demonstrated retention curve by the end of Month 12, and 454 paying customers with 302,280 euro of ARR by the end of Month 24. A Series A of 2.0 million euro is planned for 2028 and is not part of this request. The cash low point before the seed closes is 41,020 euro in Month 2 of 2026.

**Why this is a Cyprus company and not a company that happens to be in Cyprus.** The defensible part of Vuneli is not the model calls. It is the Cyprus data layer: the Electricity Authority of Cyprus consumption formats, the grid intensity series, the Registrar of Companies identifiers, the sector factors from CYSTAT, and the Greek-language disclosure templates. That asset can only be built by a team living in the market, and it does not transfer to a competitor by copying a screen. Both founders relocate to Cyprus in Month 1 and the first four hires after them are Cyprus-resident.

**What we do not yet know.** We have not validated the 45 euro per month price against a Cypriot buyer with a signed contract. We have no retention data. Our churn assumption of 2.5 per cent monthly in year one is a benchmark for vertical SMB software, not an observation about our own product. Section 12 lists this first, and the low case in section 11 shows what happens if we are wrong by a third on volume and by a third on churn at the same time: ARR at the end of 2028 falls from 711,240 euro to 415,476 euro and the Series A becomes a requirement rather than a plan.

---

# 2. Problem and regulatory context

## 2.1 What changed in European law

Three instruments create the demand this company serves. They are not equally binding on Cypriot SMEs, and the difference matters for how we sell.

**The Corporate Sustainability Reporting Directive (Directive (EU) 2022/2464)** obliges large EU undertakings and listed companies to report against the European Sustainability Reporting Standards. Reporting entities must disclose material Scope 3 emissions, which are the emissions of their suppliers and customers. The directive binds the large company. It does not bind the Cypriot supplier. It transmits to the supplier commercially, as a condition of remaining on an approved vendor list.

The 2025 Omnibus package altered the scope and timing of CSRD waves and reduced the number of directly obliged companies. That reduction changed who files, not who is asked. A Cypriot firm supplying a German manufacturer is still asked for its emissions figure, because the German manufacturer still needs a Scope 3 total. Section 12 treats the possibility that this pressure weakens as a real risk and not a rhetorical one.

**The VSME standard**, the voluntary standard for non-listed small and medium undertakings published by EFRAG, is the instrument written for our customer. It defines a Basic Module, disclosures B1 to B12, that a small company can complete without a sustainability department. Its status is voluntary. That is a commercial problem for us and we say so plainly: a voluntary standard produces slower, weaker urgency than a legal deadline. What gives VSME force is that it has become the format large buyers and Cypriot banks ask for, because it is the only standard proportionate to the size of the company being asked.

**The Carbon Border Adjustment Mechanism (Regulation (EU) 2023/956)** is the hard one. Its transitional reporting period ran from October 2023. The definitive regime, with certificate surrender, began in January 2026. It covers cement, iron and steel, aluminium, fertilisers, electricity and hydrogen. A Cypriot importer of steel reinforcement or aluminium profiles now has a filing obligation with a financial consequence attached, enforced by a national competent authority, on a quarterly and annual cycle. This is a deadline with a penalty behind it, and it is the wedge we sell first.

## 2.2 Why Cyprus is not an average EU market

Four features of the Cypriot economy make the generic European product a poor fit.

**Grid carbon intensity.** Cyprus generates most of its electricity from heavy fuel oil and gasoil. The resulting grid factor sits near 610 gCO2 per kWh, against a European Union average in the region of 230 [T2, Electricity Maps and national energy statistics; the figure moves year to year and the product tracks it as a series rather than a constant]. Scope 2 is the largest single line for a Cypriot services or light-manufacturing firm. A tool that applies a European default to a Cypriot electricity bill produces a number that is wrong by more than a factor of two in the direction that flatters the company. That error is the exact thing an assurance provider looks for.

**Firm size distribution.** The Cypriot economy is dominated by micro and small firms. The median target firm has between ten and sixty employees, one finance person who also handles payroll and VAT, and no one whose job title contains the word sustainability. Any product that assumes a dedicated ESG manager fails here on the first screen.

**Language.** Board minutes, supplier contracts and utility bills are in Greek. Disclosures to EU buyers are in English. A product that does not handle both directions creates translation work that the customer then pays a consultant to do, which removes the reason to buy the product.

**Sector concentration.** Tourism and hospitality, construction and building materials, food and beverage manufacturing, shipping and ship management, and professional services account for most Cypriot commercial activity. Shipping brings its own reporting regimes. Construction brings CBAM exposure through imported steel, cement and aluminium. These are not the sectors a generic European ESG platform optimises for.

## 2.3 What the current alternative costs

The incumbent is not a software product. It is a spreadsheet plus a consultant.

The pattern we observed in preparatory conversations is consistent: the customer sends a questionnaire, the Cypriot firm forwards it to its accountant or to a sustainability consultant, and the consultant produces a document. A single VSME-shaped report prepared this way is quoted in the low thousands of euro in the Cypriot market, and it is a one-off. The following year the work repeats from the start, because nothing was retained in a system.

This matters for our pricing argument in section 6. We are not asking a Cypriot SME to add a new cost. We are asking it to convert an irregular consulting cost into a smaller recurring software cost with a retained data trail.

**Evidence limitation, stated plainly.** Our characterisation of the current alternative comes from preparatory discussions and from published Cypriot advisory service descriptions. It is not a structured survey with a documented sample. We have not run one. The first six weeks after funding include a structured interview programme with thirty named Cypriot firms across construction materials, food manufacturing and hospitality, and the output of that programme replaces this paragraph with T1 evidence. Until then this claim is T5, and no revenue line in section 11 depends on the specific consulting price we heard.

## 2.4 The failure mode we are designing against

When a Cypriot SME does produce a sustainability figure today, three things usually go wrong with it.

The number cannot be traced. Someone typed a total into a cell and the working is gone. When the buyer's auditor asks how the figure was produced, there is no answer, and the buyer discards the submission.

The factor is wrong. A European or a global average factor was applied to Cypriot electricity, which understates the result substantially.

The work does not compound. Next year the same effort is spent again, because no boundary definition, no factor set and no prior-year comparison was kept.

Everything in section 3 is a response to one of these three failures. The audit ledger answers traceability. The Cyprus factor layer answers accuracy. The retained workspace answers repeatability.

---

# 3. Solution and product

## 3.1 Value proposition

Vuneli turns a Cypriot SME's existing operational records into a sustainability disclosure that a buyer, a bank or an auditor will accept, and keeps the evidence trail that makes the disclosure defensible.

## 3.2 What is built and running today

The following is in the product now, not on the roadmap. It is deployed and it can be demonstrated.

**The console.** A workspace for one company, showing current metric readings, obligations with due dates, and the tasks that need a human decision. Data is scoped to the workspace at the query layer and at the row-security layer.

**The Cyprus factor layer.** Grid intensity for the Cypriot zone as a time series rather than a fixed constant, so a 2025 report and a 2026 report use the correct factor for their own period. Fuel, refrigerant and transport factors are held against the same period model.

**Metric ingestion.** Electricity, fuel, water, waste and travel readings, each carrying a period, a source, a unit and a confidence value. A reading logged by a person and a reading logged by an integration are distinguishable in the record for the life of the workspace.

**The VSME drafting engine.** Given the readings and the company profile in a workspace, the engine drafts the B1 to B12 Basic Module disclosures as narrative text with the figures placed in them. Output is a structured document, editable in the application and exportable to PDF.

**The copilot.** A workspace-aware assistant that reads the workspace and proposes actions. It can propose four things: draft a report, create a task, update an obligation, and log a reading. It cannot execute any of them. Each proposal is a record with a payload, and it stays inactive until a person approves it. On approval, the payload is re-validated against the workspace before the action runs, so a stale or altered proposal cannot reach another workspace, and an activity event is written.

**The audit ledger.** Every approved action writes an actor, a verb, an object and a timestamp. This is the mechanism that answers the traceability failure in section 2.4.

**The tool set.** Seven public calculators are live and indexed: a GHG calculator, a CBAM report generator, a VSME template builder, a double materiality matrix, an EU taxonomy checker, an SBTi target setter and a report visuals tool. These serve a marketing function described in section 7 and a product function as the entry point for a first workspace.

**The learning library.** Fifty-one glossary terms and twenty-five long-form guides, each a routable page, in English with Greek in progress.

## 3.3 What is not built

Stating this precisely is more useful than a feature list.

There is no live connection to the Electricity Authority of Cyprus. Bills are handled by upload and by optical character recognition, not by an authenticated feed. Building the authenticated feed is the first engineering milestone after funding and is the single largest driver of the gross margin improvement in section 11, because it removes the manual data-entry support cost.

There is no accounting-system integration in production for the Cypriot market. QuickBooks and Xero are scaffolded. SoftOne, which matters more in Cyprus, is not started.

There is no Greek-language disclosure output. The interface is bilingual; the generated report is English only.

There is no third-party assurance relationship. We describe our output as assurance-ready, which is a claim about structure and traceability, not a claim that an assurance provider has signed anything. Section 8 sets the milestone at which that claim is tested with a named Cypriot audit firm.

## 3.4 Architecture

The application is a Next.js system on the Node runtime with a PostgreSQL database. Model calls run server-side through a single gateway module so that no key reaches the browser and every call passes one accounting point. Report drafting is deterministic where the calculation is deterministic: the model writes the narrative, the arithmetic is done in code. This division is the reason a Vuneli figure can be reproduced, and it is a deliberate constraint rather than a limitation we have not yet removed.

Data is held in the European Union. Section 10 sets out the data protection position.

## 3.5 Where the model is used and where it is not

The model drafts narrative, classifies uploaded documents, extracts figures from bills for human confirmation, and suggests next actions. The model does not calculate emissions, does not choose an emission factor, and does not approve anything.

This matters for the EU AI Act position. A system that computes a regulated disclosure autonomously invites a different classification than a system that drafts text for human approval. We have designed for the second, and the approval gate is not a setting a customer can switch off.

## 3.6 Why now

The definitive CBAM regime started in January 2026, which converts an information request into a filing with a financial consequence. VSME reached a stable published form, which gives small companies a target to aim at that did not exist two years ago. Model costs for the drafting task fell far enough that a 45 euro monthly price can carry the inference cost, which section 11 shows at 26 euro per account per year. None of these three was true in 2023.

## 3.7 Environmental and societal dimension

The direct environmental effect of this company is not the software's own footprint, which is small. It is whether measurement changes behaviour in the firms that measure. We are careful about claiming this. Measurement is a precondition for reduction and not a substitute for it, and a plan that claims tonnes avoided per subscription would not survive scrutiny.

What we can commit to is a measurable intermediate outcome, and we will report against it: the number of Cypriot SMEs that hold a complete, factor-correct baseline and a second consecutive year of comparable data. A firm with two comparable years can be asked by a buyer or a bank to improve, and cannot be asked before that. Our 2028 target is 1,062 Cypriot and near-region firms holding a first baseline in the product.

On the societal side, the specific effect is that a Cypriot firm of thirty people can answer a large buyer's questionnaire without hiring a consultant, which is the difference between staying on the vendor list and being removed from it.

On the gender dimension, we set a concrete and checkable commitment rather than a statement of intent: at least 40 per cent of hires in Cyprus across the first ten roles, with the composition reported in the Startup Visa re-evaluation submission. We are two male founders and we do not present that as balanced.

---

# 4. Market analysis

## 4.1 Method

We build the market from a count of real Cypriot firms and apply filters that a sceptical reader can test. We do not start from a global ESG software forecast, because no path leads from that number back to a Cypriot invoice.

## 4.2 The universe

Cyprus has in the region of 55,000 to 60,000 active enterprises registered with the Registrar of Companies and captured in CYSTAT business demography, of which more than 99 per cent are small and medium enterprises by the European Commission definition [T2]. The great majority are micro firms with fewer than ten employees.

Micro firms are outside our first market. A five-person firm is rarely asked for a sustainability disclosure, and when it is, the request is a one-page questionnaire that does not justify a subscription. We therefore filter on employee count before anything else.

## 4.3 The funnel

Each step below removes firms and states the basis for removing them.

| Step | Filter | Firms remaining | Basis | Tier |
|---|---|---|---|---|
| 0 | All active Cypriot enterprises | 57,000 | CYSTAT / Registrar business demography, midpoint of the 55,000-60,000 range | T2 |
| 1 | 10 or more employees | 8,900 | Size-band distribution in the Commission SME Performance Review for Cyprus applied to step 0 | T2 |
| 2 | In an exposed sector: manufacturing, construction and building materials, food and beverage, wholesale and import, transport and logistics, accommodation and food service, professional and financial services | 7,400 | NACE sector shares from CYSTAT applied to step 1 | T2 |
| 3 | Exposed to a disclosure trigger: supplies an EU-obligated buyer, imports a CBAM good, holds bank debt subject to sustainability data requests, or bids for public contracts with environmental criteria | 6,882 | Estimated at 93 per cent of step 2 on the basis that exporters, importers and bank-financed firms overlap heavily in Cyprus | T5, sensitivity applied |
| 4 | Digitally ready: already uses accounting or ERP software, taken as the proxy for ability to adopt a subscription tool | 6,194 | 90 per cent of step 3, on the basis of near-universal accounting software use among Cypriot firms above ten employees | T5, sensitivity applied |

**Addressable Cypriot firms: 6,194.**

Steps 3 and 4 are assumptions, not measurements, and they are the two filters we would most expect a reader to challenge. Under a pessimistic reading, step 3 at 75 per cent and step 4 at 80 per cent, the addressable count falls to 4,440. That reduction does not change the plan, because our 2030 base case reaches 2,930 customers, which sits inside both readings. The market size is not the binding constraint on this business; our sales capacity is. Section 7 shows that.

## 4.4 From firms to euro

Applying our price book, weighting by size band, and including the service attach rate from section 6:

| Segment | Firms | Annual software value | Annual service value | Total |
|---|---|---|---|---|
| 10-49 employees, Pro at 540 euro per year | 5,140 | 2,775,600 | 1,708,050 | 4,483,650 |
| 50-249 employees, Enterprise at 2,220 euro per year | 1,054 | 2,339,880 | 350,455 | 2,690,335 |
| **Cyprus SAM** | **6,194** | **5,115,480** | **2,058,505** | **7,173,985** |

**Cyprus serviceable available market: 7.17 million euro per year.**

That is a small market by software standards, and we state it as such rather than inflating it. It is large enough to build a profitable company on, and it is deliberately too small to attract a well-funded European entrant as a primary target. That is the strategic point of starting here.

## 4.5 The second market

Greece, Malta and the Cypriot and Greek diaspora business community in the wider EU form a second layer, addressable from Cyprus in Greek and English with the same disclosure logic and a different factor set. We size it separately and we do not blend it into the Cyprus number.

Greece has a far larger SME base under the same EU instruments. Using the same size and sector filters, a working estimate is 70,000 to 85,000 addressable firms [T4, analogy from the Cypriot filter ratios applied to Greek enterprise counts; this is an analogy and not a measurement]. At the same price book, that is a second serviceable market in the range of 80 to 95 million euro per year.

We enter Greece in 2029, and the plan carries one Greece-based account executive from Month 9 of that year. No Greek revenue appears in the base case before 2029.

## 4.6 Demand signals we can and cannot show

What we can show: the definitive CBAM regime is live with a quarterly filing cycle and a financial consequence, which is a fact of law, not a forecast. VSME exists in published form. Cypriot grid intensity is public and is more than twice the European average, which is a measurable reason a generic tool produces a wrong answer here.

What we cannot show: we have no signed letters of intent, no paying customers and no pilot usage data. We have a live product and a public content presence that produces inbound interest, and we do not present that as demand. The first funded milestone is to convert it into evidence.

## 4.7 Traction to date

The honest statement of position: the product is built and public. Twenty-five long-form guides and fifty-one glossary pages are indexed and produce organic search arrivals. Seven public tools run without a login. The console, the copilot, the VSME engine and the report export work end to end.

Zero paying customers. Zero signed letters of intent. No pilot has been run.

We put that at the front rather than at the back, because a plan that buries it is a plan that expects not to be read carefully.

---

# 5. Competitive landscape

## 5.1 The real incumbent

The competitor that wins most Cypriot deals today is a spreadsheet prepared by an external consultant. It wins because it requires no adoption, it comes with a person who takes responsibility for the answer, and the buyer already has a relationship with the accountant who recommends it.

It has three weaknesses, and our whole commercial argument rests on them. It costs more per report than an annual subscription. It retains nothing, so the second year costs as much as the first. And it usually applies a generic emission factor, because the consultant is not maintaining a Cypriot factor series either.

We do not intend to displace Cypriot advisers. Section 7 makes them a distribution channel, because a consultant who uses Vuneli to produce the report keeps the client relationship and drops the delivery cost.

## 5.2 Software competitors

| Axis | Vuneli | Greenly | Plan A | Sweep | Local consultant plus spreadsheet |
|---|---|---|---|---|---|
| Entry price per year | 540 euro | Materially higher, four figures upward | Four to five figures | Five figures | 1,500-4,000 euro per report |
| Cyprus grid factor series | Yes, maintained as a period series | Generic EU or country default | Country default | Country default | Usually generic |
| VSME Basic Module drafting | Yes, B1-B12 | Partial | Yes | Yes | Manual |
| CBAM definitive-regime filing support | In build for Q3 2026 | Yes | Partial | Partial | Manual |
| Greek-language output | Q4 2026 | No | No | No | Yes |
| Cypriot accounting stack integration | SoftOne planned 2027 | No | No | No | Not applicable |
| Breadth of frameworks | Narrow: VSME, CBAM, GHG Protocol, EU Taxonomy screening | Broad | Broad | Broad | Whatever the adviser knows |
| Assurance and audit relationships | None yet | Established | Established | Established | Direct |
| Funding and brand | Pre-seed | Well funded, recognised across the EU | Well funded | Well funded | Local trust |
| Support in the buyer's own market and language | Yes, Cyprus-resident team | Remote | Remote | Remote | Yes |

## 5.3 Where competitors beat us today

Greenly, Plan A and Sweep each cover more frameworks than we do, have real assurance relationships, have brand recognition with the large EU buyers who send the questionnaires, and have engineering capacity we will not match. If a Cypriot company is large enough to need full CSRD-grade reporting across many standards, one of them is the correct choice and we will say so in the sales conversation.

We are also behind on CBAM today. Our CBAM generator produces a working pack; it is not yet wired to the definitive-regime quarterly cycle. That is a real gap and it is the second engineering milestone in section 8, not a footnote.

## 5.4 Where we win, and for how long

We win on the firm with ten to sixty employees that needs a correct, defensible, cheap answer to one buyer's question, in the right language, with the right Cypriot factor, this quarter.

The durable part is the Cyprus data layer and the local delivery relationship, not the software surface. A screen can be copied in a sprint. A maintained series of Cypriot grid factors by period, a parser for Electricity Authority of Cyprus bill formats, a mapping from the Registrar's company identifiers, a set of Greek disclosure templates reviewed by a Cypriot practitioner, and a working relationship with a Cypriot audit firm take a resident team years to assemble and produce no benefit to a competitor unless it also decides to serve a 7.17 million euro market.

The honest limit on that advantage: it protects Cyprus. It does not protect Greece, where a larger market will attract the same well-funded entrants. Section 12 carries that as a risk.

## 5.5 Barriers to entry we are building

Three, in order of how quickly they take effect.

The factor and format layer, described above, which begins to matter within twelve months.

The channel. An accountancy firm that has trained its staff on Vuneli and moved twenty clients onto it does not move again for a small price difference. This begins to matter from Month 18.

The retained data. A customer in year three holds three comparable years of disclosures in the product. Moving means re-establishing a baseline. This begins to matter from 2029.

---

# 6. Business model and pricing

## 6.1 How we charge

Recurring software subscription, billed monthly in euro, with an optional service engagement.

| Tier | Price | Target | Included |
|---|---|---|---|
| Free | 0 euro | Tool users, first workspace | 10 actions per month, 100 model credits, 1 seat, basic calculator, monthly report |
| Pro | 45 euro per month, 540 euro per year | 10-49 employees | Unlimited actions, 1,000 model credits, 5 seats, 3 integrations, advanced analytics, branded reports, API access |
| Enterprise | 185 euro per month, 2,220 euro per year | 50-249 employees, groups, accountancy firms | Unlimited seats and integrations, white-label output, dedicated contact, 10,000 model credits, single sign-on, advanced compliance tools |
| Service engagement | 950 euro per engagement | Any tier | Reviewer-checked VSME pack or CBAM quarterly filing pack, prepared with the customer |

Cyprus VAT at 19 per cent is applied at checkout on the billing address. Prices shown to Cypriot customers include it. Model usage above the included credit allowance is sold in packs at 8.99 to 62.99 euro, which prevents a heavy user from eroding the margin on a flat tier.

## 6.2 Why these prices

The 45 euro tier is set against the alternative, not against other software. A Cypriot firm that pays a consultant somewhere between 1,500 and 4,000 euro for a one-off report is being asked to spend 540 euro a year instead and keep the data. That comparison is the whole pitch, and it is why the price is not 20 euro; a price that low would signal a tool rather than a compliance system and would not carry the reviewer cost in the service line.

The 185 euro tier is set by seat count and integration need rather than by feature withholding. A fifty-person firm with three sites and a group parent needs unlimited seats, and the price is the point at which our support cost for that account is covered at the target margin.

The 950 euro service engagement exists because a first-year customer does not trust its own first baseline. It is deliberately priced well under the consultant alternative and it is deliberately not free, because free delivery destroyed the margin of several vertical software companies before us. It carries a 42 per cent direct delivery cost in our model, which is shown in the cost of sales table in section 11.

## 6.3 The service attach assumption

We assume 35 per cent of paying accounts buy one service engagement in 2026, falling to 22 per cent by 2030 as the product does more of the work unaided. This declining attach is deliberate: a service line that grows as a share of revenue would signal that the software is not working.

This is a T5 assumption. It carries 21,280 euro of 2026 revenue, which is 34 per cent of that year. If attach is half our estimate, 2026 revenue falls to 51,920 euro and the milestone in section 14 is unaffected, because the milestone is stated in customer count and retention rather than in revenue.

## 6.4 Contract terms

Monthly rolling by default, with two months free on an annual prepayment. We do not lock a thirty-person Cypriot firm into twelve months at the point where it has no evidence we are useful. The cost of that choice is that our churn shows up immediately rather than at renewal, which is the correct trade for a company that needs a true retention signal in its first year.

## 6.5 Revenue mix over time

| Year | Pro subscriptions | Enterprise subscriptions | Services | Total |
|---|---|---|---|---|
| 2026 | 32,400 | 8,880 | 21,280 | 62,560 |
| 2027 | 145,800 | 46,620 | 82,935 | 275,355 |
| 2028 | 378,000 | 128,760 | 187,226 | 693,986 |
| 2029 | 737,100 | 251,970 | 337,098 | 1,326,168 |
| 2030 | 1,201,500 | 416,250 | 504,212 | 2,121,962 |

Services fall from 34.0 per cent of revenue in 2026 to 23.8 per cent in 2030. Recurring software revenue rises from 66.0 per cent to 76.2 per cent.

---

# 7. Go-to-market

## 7.1 The order of channels

We run four channels, and they start at different times because they mature at different speeds.

## 7.2 Channel one: the accountancy and advisory channel

This is the primary channel and it starts in Month 2.

Cypriot SMEs take financial and regulatory advice from their accountant. There are several hundred accountancy and audit practices in Cyprus, and a practice with sixty clients above ten employees is now receiving sustainability questions from a growing share of them. The practice does not want to build a sustainability service line and does not want to refuse the work.

The offer to the practice: an Enterprise workspace with unlimited client sub-workspaces, white-label output, training for two staff, and a revenue share of 20 per cent of the first-year subscription value of clients it introduces. The practice keeps the client relationship and bills its own advisory fee on top.

Target: eight signed practices by the end of 2026, twenty-four by the end of 2027. A practice that activates ten clients contributes 5,400 euro of Pro subscription value per year.

Why this channel first: it converts a fragmented market of 6,194 firms into a market of a few hundred practices, which one Cyprus-based sales lead can actually cover.

## 7.3 Channel two: the CBAM wedge

Starts in Month 4, once the definitive-regime filing pack ships.

CBAM importers are identifiable. They import specific commodity codes, they are concentrated in construction materials and metals distribution, and they now have a quarterly filing obligation with a financial consequence. This is a small, addressable, urgent list. We estimate 300 to 500 Cypriot firms carry meaningful CBAM exposure [T5, based on the concentration of steel, cement and aluminium importation in the Cypriot construction supply chain; to be replaced with customs-based evidence in the first funded quarter].

The motion is direct and specific: a named list, a filing deadline, an outbound approach that leads with the deadline and not with sustainability. The CBAM pack is the entry sale; the VSME workspace is the expansion.

## 7.4 Channel three: search and the content library

Running now, unfunded, and compounding.

Twenty-five long-form guides and fifty-one glossary pages are indexed. Seven public tools run without a login and each ends in a workspace prompt. This channel produces the Free tier population from which Pro conversions come. It is slow, it costs almost nothing at the margin, and it is the reason our blended acquisition cost falls from 770 euro to 375 euro across the plan.

Greek-language versions of the top twenty pages ship in Q4 2026, which is the point at which this channel begins to reach the Cypriot buyer in the buyer's own language rather than reaching an English-reading intermediary.

## 7.5 Channel four: institutions

Starts Month 6, and is a credibility channel rather than a volume channel.

The Cyprus Chamber of Commerce and Industry, the Employers and Industrialists Federation, and sector associations in construction materials and food manufacturing run member briefings. A workshop delivered to forty members produces few direct sales and a large amount of the trust that the other three channels then convert.

We name these bodies as intended engagement, not as existing relationships. We have no agreement with any of them today.

## 7.6 The sales arithmetic

This is where the customer numbers in section 11 come from. They are not a share of the market.

**2026.** One sales lead from Month 6, one founder selling from Month 1. Capacity: 320 qualified conversations in the year across direct outbound, channel-introduced and inbound. Close rate 26 per cent on inbound and channel-introduced, 12 per cent on cold outbound, blended 20 per cent. That is 64 direct closes. Self-serve conversion from the Free tier and the public tools adds 64 more at a 2.6 per cent conversion on the Free population. Total 128 new logos, against 128 in the model.

**2027.** Sales lead plus one account executive plus one channel account executive from Month 4. Capacity 1,050 qualified conversations, blended close 21 per cent, 220 direct closes. Self-serve adds 136. Total 356 new logos, against 356 in the model.

**2028.** Three quota-carrying people for the full year. Capacity 1,900 conversations, close 23 per cent, 437 direct. Self-serve and channel-driven self-activation add 264. Total 701, against 701 in the model.

**2029 and 2030.** Four then five quota carriers, with Greece opening in Month 9 of 2029. 1,030 and 1,349 new logos respectively, on the same capacity-times-close-rate basis with close rates held flat at 23 per cent and self-serve growing with the content library.

Gross logo churn is applied at 2.5 per cent monthly in 2026, improving to 1.5 per cent by 2030. The customer counts in section 11 are net of that churn.

## 7.7 What would make this arithmetic wrong

Two things, both of them plausible.

If the blended close rate is 14 per cent rather than 20 per cent, 2026 new logos fall to about 90 and the Month 12 milestone of forty paying customers still holds, because that milestone is set well below the base case on purpose.

If the sales cycle for a Cypriot SME runs to nine months rather than the three to four months we assume, 2027 closes slip roughly two quarters and the Series A timing moves from 2028 into late 2027. This is the single assumption we intend to test first, and it is why the first-quarter interview programme in section 2.3 asks about the buying process and not only about the pain.

---

# 8. Product roadmap and technology

## 8.1 Principle

Each item below is tied to a hire in section 9 and a cost line in section 11. Nothing appears here that is not funded there.

## 8.2 2026

**Q1. Cyprus data foundation.** Electricity Authority of Cyprus bill parsing hardened across the current bill formats, with the grid factor series versioned by period so that a report drafted in 2027 for the 2025 period uses the 2025 factor. Owner: senior full-stack engineer, hired Month 3.

**Q2. CBAM definitive-regime pack.** Quarterly filing workflow against the definitive regime that began in January 2026: goods and CN code selection, embedded emissions with default and actual values, importer and installation records, and a submission-shaped export. Owner: sustainability lead, hired Month 4, with the senior engineer.

**Q3. Assurance readiness.** A per-figure evidence chain from a disclosure line back to the source document, exposed in the export. This is what a Cypriot audit firm needs in order to look at our output at all. We run a structured review with one named Cypriot audit practice in this quarter, and the outcome of that review is reported honestly in the Startup Visa re-evaluation submission whether or not it is favourable.

**Q4. Greek output.** Greek-language disclosure templates and Greek versions of the twenty highest-traffic library pages, reviewed by the Cyprus-resident sustainability lead rather than machine translated and shipped.

## 8.3 2027

Authenticated data feeds replace upload where the source permits it, starting with the accounting stack. SoftOne integration is the priority for Cyprus; QuickBooks and Xero are completed for firms using them. Owner: data engineer, hired Month 2 of 2027.

Multi-entity workspaces, so an accountancy practice manages sixty client workspaces from one console with role separation. This is the technical precondition for the channel in section 7.2 to scale past a few practices.

Supplier data requests, so a Cypriot firm can collect a figure from its own suppliers inside the product instead of by email.

A second reviewer joins in Month 9, which is what allows service delivery to grow without the founder in the loop.

## 8.4 2028 and beyond

Sector modules for construction materials and food manufacturing, being the two Cypriot sectors with the most consistent disclosure shape. Bank-facing export formats, because Cypriot banks are becoming a demand source in their own right. Greek market factor set and localisation ahead of the 2029 entry.

## 8.5 Technology position and the model layer

The system runs on Next.js with PostgreSQL, deployed in the European Union. Model calls pass through one server-side gateway module, which gives one place for cost accounting, one place for the key, and one place to change model choice without touching feature code. Inference is currently 26 euro per account per year at our usage profile, which is a cost line in section 11 rather than an unquantified risk.

Calculation is deterministic in code. The model writes prose and proposes actions. We have described this in section 3.5 and we repeat it here because it is a technology decision with a compliance consequence: an inspector can reproduce any Vuneli number without running a model.

## 8.6 Intellectual property

There is no patent and we do not intend to file one. Software patents in this field are slow, expensive and weak, and the money is better spent on the data layer.

What we hold and will hold: copyright in the source code, which is proprietary and not published; the compiled Cyprus factor series and its period history, which is our own compilation work over public inputs; the Greek disclosure template set; the bill-format parsers; and the Vuneli mark, for which a European Union trade mark application is budgeted in the general and administrative line in 2026.

Qualifying software copyright developed by Cyprus-based R&D staff falls within the Cyprus IP Box regime, which gives an 80 per cent notional deduction on qualifying IP income under the modified nexus approach. Following the 2026 increase of the headline corporate rate to 15 per cent, the effective rate on qualifying IP profit is approximately 3 per cent. We have not modelled any IP Box benefit in section 11, because the company is loss-making until 2030 and the benefit would be immaterial and would look like padding. We note it as a reason the R&D is done in Cyprus rather than as a line of income.

---

# 9. Team and organisation

## 9.1 Founders

Two founders, both third-country nationals, both relocating to Cyprus and Cyprus-resident from Month 1. Together they hold well above the 25 per cent shareholding required by the Team Startup Visa scheme.

**Founder and Chief Executive.** Responsible for commercial strategy, the accountancy channel, institutional relationships, fundraising and regulatory interpretation. Carries a personal quota through 2026 and 2027, because a two-founder company cannot afford a chief executive who does not sell.

**Founder and Chief Technology Officer.** Responsible for the platform, the Cyprus data layer, the model gateway, security and data protection engineering. Author of the working product described in section 3.2.

## 9.2 Honest statement of the gap

Neither founder has previously sold software to Cypriot SMEs, and neither is a Cypriot national. That is the largest single execution risk in this plan and it is listed first in section 12.

The mitigation is structural rather than aspirational. A Cyprus-resident sales lead with an existing accountancy network is hired in Month 6 of 2026 and is the fifth person in the company. A Cyprus-resident sustainability practitioner is hired in Month 4 and owns the correctness of every disclosure the product produces. We are also recruiting two Cyprus-based advisers, one from an audit practice and one from a business federation, on standard adviser terms of 0.25 per cent equity vesting over two years. Neither adviser is appointed as of this drafting and we do not name people we have not signed.

## 9.3 Hiring plan

Costs below are annual base salary. The model applies Cyprus employer social insurance and related employer contributions at 19.9 per cent on top, and part-year hires are pro-rated from their start month.

| Role | Start | Base salary | Cyprus-resident | Unlocks |
|---|---|---|---|---|
| Founder / CEO | 2026 M1 | 42,000 | Yes, relocating | Commercial and channel |
| Founder / CTO | 2026 M1 | 42,000 | Yes, relocating | Platform |
| Senior full-stack engineer | 2026 M3 | 46,000 | Yes | EAC data foundation, Q1 roadmap |
| Sustainability lead and VSME reviewer | 2026 M4 | 38,000 | Yes | CBAM pack, service delivery, Greek templates |
| Sales lead, Cyprus SME | 2026 M6 | 36,000 | Yes | Accountancy channel, direct quota |
| Customer success associate, Greek and English | 2026 M9 | 26,000 | Yes | Retention, onboarding cost reduction |
| Data engineer, Cyprus integrations | 2027 M2 | 44,000 | Yes | SoftOne, authenticated feeds |
| Account executive, accountancy channel | 2027 M4 | 34,000 | Yes | Channel quota |
| Product designer | 2027 M7 | 38,000 | Yes | Self-serve conversion |
| Second VSME and CBAM reviewer | 2027 M9 | 36,000 | Yes | Service capacity without founders |
| Backend engineer | 2028 M1 | 46,000 | Yes | Multi-entity, supplier requests |
| Account executive #2 | 2028 M3 | 34,000 | Yes | Direct quota |
| Compliance and data protection officer | 2028 M5 | 40,000 | Yes | Formal DPO role, ISO 27001 track |
| Support associate #2 | 2028 M8 | 26,000 | Yes | Support load at 1,062 accounts |
| Engineering manager | 2029 M1 | 58,000 | Yes | Team of six engineers |
| Two engineers | 2029 M3 | 92,000 combined | Yes | Sector modules |
| Marketing manager | 2029 M5 | 40,000 | Yes | Greek and Cyprus demand generation |
| Account executive #3, Greece | 2029 M9 | 36,000 | Cyprus-based, Greece-facing | Greece entry |
| Four-person delivery and engineering pod | 2030 M1 | 168,000 combined | Yes | Scale |
| Partnerships manager, EU | 2030 M4 | 46,000 | Yes | EU channel |

**Headcount in Cyprus at year end: 6 in 2026, 10 in 2027, 14 in 2028, 19 in 2029, 24 in 2030.** Eighteen of the twenty-four roles at the end of 2030 are Cyprus-resident hires rather than relocated founders.

Total payroll including employer contributions: 216,420 euro in 2026, rising to 1,146,844 euro in 2030.

## 9.4 Equity and option pool

| Holder | Holding at incorporation | After the seed round |
|---|---|---|
| Founder / CEO | 47.5% | 35.6% |
| Founder / CTO | 47.5% | 35.6% |
| Advisers | 0.5% reserved | 0.5% |
| Employee option pool | 4.5% | 10.0% |
| Seed investors | - | 18.3% |

The option pool is expanded to 10 per cent before the seed round closes, which is the market-standard sequencing and which we state because a reviewer will otherwise assume we have not thought about dilution. Founders remain above the 25 per cent combined shareholding required by the Team Startup Visa scheme throughout the plan, including after the 2028 Series A, where the modelled combined founder holding falls to approximately 53 per cent.

Employee options vest over four years with a one-year cliff. The first six Cyprus hires receive options; that is a deliberate cost, and it is the main non-salary reason a Cypriot engineer would choose a six-person company over a bank.

## 9.5 Board and governance

At seed stage: two founder directors and one investor director. One independent director with Cypriot regulatory or audit standing is added before the Series A.

Monthly management accounts from Month 1, audited annual accounts from the first full financial year, and a quarterly written report to shareholders whether or not anyone asks for one.

---

# 10. Operations, data protection and Cyprus compliance

## 10.1 Legal form

Vuneli Ltd, a private company limited by shares, registered with the Cyprus Registrar of Companies, with a registered office and operating premises in Nicosia. Tax residency in Cyprus, established through management and control being exercised in Cyprus: both founders resident, board meetings held in Cyprus, and the bank relationship held with a Cypriot institution.

Corporate income tax at the 15 per cent rate applying from 2026. VAT registration from the first taxable supply, with Cyprus VAT at 19 per cent applied to Cypriot customers at checkout. Employer registration with the Social Insurance Services before the first hire, with employer contributions accounted at 19.9 per cent in the model.

## 10.2 Data protection

The product holds commercial operating data, energy consumption records, supplier information and named workspace users. It does not hold special category data.

Data is stored and processed in the European Union. Personal data processing rests on contract performance for account data and on legitimate interest for product security telemetry, with consent taken separately for marketing communication. Standard contractual clauses are in place with any sub-processor outside the Union, and the sub-processor list is published rather than supplied on request.

Row-level security is enforced at the database, not only in the application, so a query defect cannot expose one workspace to another. Model calls carry workspace content, which means the model provider is a sub-processor and is disclosed as one; no customer content is used to train third-party models under our gateway terms.

A data protection officer role is formalised in 2028 when headcount and processing volume justify it. Until then the Chief Technology Officer holds accountability for it, which we state rather than implying a function exists that does not.

An ISO 27001 certification track begins in 2028. We do not claim certification before then, and our security page will not imply it.

## 10.3 EU AI Act position

The system uses a general-purpose model for drafting and classification under human review. It does not autonomously produce a regulated legal disclosure, and the approval gate described in section 3.5 is not a configurable option. Every proposal is recorded with its payload, its decision, its decider and its timestamp.

We monitor the classification question and we have designed the approval architecture so that a tightening of obligations for systems that produce regulated disclosures does not require us to rebuild the product. This is also why the arithmetic is in code rather than in the model.

## 10.4 Business continuity

Daily database backups with point-in-time recovery, retained thirty days. Infrastructure defined in code so that the environment can be rebuilt. A documented recovery objective of four hours for the console and twenty-four hours for report generation. Professional indemnity and cyber insurance placed before the first paying customer, budgeted in the general and administrative line.

---

# 11. Financial plan

All figures in euro. The model is a single computation and every table below is generated from it, so the summary figures and the detail figures agree by construction.

## 11.1 Profit and loss, base case

| Line | 2026 | 2027 | 2028 | 2029 | 2030 |
|---|---|---|---|---|---|
| Pro subscriptions | 32,400 | 145,800 | 378,000 | 737,100 | 1,201,500 |
| Enterprise subscriptions | 8,880 | 46,620 | 128,760 | 251,970 | 416,250 |
| Service engagements | 21,280 | 82,935 | 187,226 | 337,098 | 504,212 |
| **Revenue** | **62,560** | **275,355** | **693,986** | **1,326,168** | **2,121,962** |
| Cost of sales | 30,019 | 89,382 | 189,055 | 320,935 | 471,393 |
| **Gross profit** | **32,541** | **185,973** | **504,931** | **1,005,233** | **1,650,570** |
| Gross margin | 52.0% | 67.5% | 72.8% | 75.8% | 77.8% |
| Research and development | 126,538 | 225,774 | 337,895 | 475,267 | 642,359 |
| Sales and marketing | 98,597 | 181,724 | 275,790 | 385,452 | 506,116 |
| General and administrative | 89,284 | 140,375 | 202,421 | 276,180 | 361,369 |
| **Total operating expenses** | **314,420** | **547,873** | **816,106** | **1,136,899** | **1,509,844** |
| **EBITDA** | **-281,879** | **-361,900** | **-311,175** | **-131,666** | **140,726** |
| Exit ARR | 82,560 | 302,280 | 711,240 | 1,266,900 | 1,968,600 |

**What drives each year.**

2026 is a build-and-prove year. Revenue is small and gross margin is 52 per cent because onboarding is manual and the service line carries a 42 per cent delivery cost against only 128 new customers. The loss is the cost of building the Cyprus data layer and hiring the first four Cyprus employees.

2027 is the largest loss year in absolute terms, at 361,900 euro, because headcount rises from six to ten while revenue is still under 300,000 euro. That is intentional. The data engineer and the second reviewer hired this year are what make 2028 margins possible.

2028 is the inflection in margin rather than in profit. Gross margin passes 72 per cent because the authenticated feeds shipped in 2027 remove data-entry support, and customer acquisition cost payback drops below twelve months.

2029 brings the loss down to 131,666 euro on 1.33 million euro of revenue while opening Greece.

2030 is the first profitable year at 140,726 euro of EBITDA, with recurring software at 76.2 per cent of revenue.

## 11.2 Cost of sales detail

| Component | 2026 | 2027 | 2028 | 2029 | 2030 |
|---|---|---|---|---|---|
| Hosting and database | 5,504 | 8,001 | 13,138 | 21,064 | 31,338 |
| Model inference | 1,664 | 7,566 | 19,708 | 38,441 | 62,725 |
| Cyprus and EU data feeds | 3,600 | 7,200 | 11,000 | 14,000 | 17,000 |
| Payment processing at 2.1% | 1,314 | 5,782 | 14,574 | 27,850 | 44,561 |
| Service delivery, reviewer time | 8,938 | 34,833 | 78,635 | 141,581 | 211,769 |
| Support staff cost booked to delivery | 9,000 | 26,000 | 52,000 | 78,000 | 104,000 |
| **Total** | **30,019** | **89,382** | **189,055** | **320,935** | **471,393** |

We book support and service delivery labour into cost of sales rather than into operating expenses. Presenting a blended software gross margin above 80 per cent by keeping delivery people out of the calculation would flatter the early years and mislead on the true unit cost of a first-year customer.

## 11.3 Customers, retention and unit economics

| Metric | 2026 | 2027 | 2028 | 2029 | 2030 |
|---|---|---|---|---|---|
| Pro customers at year end | 120 | 420 | 980 | 1,750 | 2,700 |
| Enterprise customers at year end | 8 | 34 | 82 | 145 | 230 |
| New logos in year | 128 | 356 | 701 | 1,030 | 1,349 |
| Gross monthly logo churn | 2.5% | 2.2% | 1.9% | 1.7% | 1.5% |
| Blended annual revenue per account | 645 | 661 | 669 | 669 | 671 |
| Customer acquisition cost | 770 | 510 | 393 | 374 | 375 |
| Lifetime value | 1,118 | 1,692 | 2,133 | 2,486 | 2,898 |
| LTV to CAC | 1.5 | 3.3 | 5.4 | 6.6 | 7.7 |
| CAC payback, months | 27.6 | 13.7 | 9.7 | 8.9 | 8.6 |
| Gross margin | 52.0% | 67.5% | 72.8% | 75.8% | 77.8% |

Customer acquisition cost is fully loaded: it is the whole sales and marketing line, including salaries and employer contributions, divided by new logos in the year. It is not an advertising cost per lead.

Lifetime value is annual revenue per account times gross margin, divided by monthly churn, expressed over the implied life. We use this method rather than a cohort method because we have no cohorts yet, and a cohort figure would be invented.

The 2026 ratio of 1.5 is bad and we present it rather than hiding it in a blended five-year average. In the first year a company with two salespeople and 128 customers cannot have good unit economics. The number that matters is the trend and the mechanism behind it. Payback falls from 27.6 months to 9.7 months by 2028 for two specific reasons: the accountancy channel replaces individual outbound with practice-level introductions, so one conversation produces ten accounts instead of one; and the content library, which costs almost nothing at the margin, grows its share of new logos.

Churn is stated gross, on logos. We have not modelled expansion revenue from seat growth or tier upgrades, which means our net revenue retention is understated. Adding a plausible expansion assumption would improve every figure in this table, and we have left it out because we have no basis for it yet.

## 11.4 Cash flow and funding

| | 2026 | 2027 | 2028 | 2029 | 2030 |
|---|---|---|---|---|---|
| EBITDA | -281,879 | -361,900 | -311,175 | -131,666 | 140,726 |
| Capital expenditure | -12,000 | -10,000 | -12,000 | -14,000 | -16,000 |
| Working capital movement | -3,754 | -12,768 | -25,118 | -37,931 | -47,748 |
| Funding received | 810,000 | 180,000 | 2,000,000 | 0 | 0 |
| **Closing cash** | **512,368** | **307,700** | **1,959,407** | **1,775,810** | **1,852,788** |

Funding received in 2026 is 90,000 euro of founder capital, 600,000 euro of seed equity closing in Month 3, and 120,000 euro from RIF PRE-SEED in Month 7. 2027 is 180,000 euro from RIF SEED in Month 5. 2028 is a 2.0 million euro Series A, which is planned rather than committed and is not part of the present request.

**The cash low point is 41,020 euro at the end of Month 2 of 2026**, immediately before the seed round closes. That number is the reason the seed close date is a milestone rather than an aspiration, and it is why 90,000 euro of founder capital is in the company before Month 1 rather than alongside the round.

After the seed closes, the closing balance at the end of 2027 is 307,700 euro, which at the 2028 monthly burn rate carries the company to approximately Month 30 without the Series A. That is a ten-month margin against the planned Series A close in Month 7 of 2028.

Monthly cash is modelled for 2026 and 2027, quarterly for 2028, and annually thereafter. Working capital assumes a 6 per cent drag on revenue growth, reflecting monthly card collection with a small annual-prepayment offset. Debtor risk is low because the product is prepaid by card; the Enterprise and service lines invoice on thirty days.

## 11.5 Sensitivity

The plan is most sensitive to three assumptions: new logo volume, monthly churn, and realised price per account. We vary all three together rather than one at a time, because in reality they move together: a company that struggles to sell also discounts and also churns.

| Case | Assumptions | ARR end 2028 | ARR end 2030 | EBITDA 2030 | LTV to CAC 2028 |
|---|---|---|---|---|---|
| Low | Logos 65% of base, churn 1.35x base, price 0.9x base | 415,476 | 1,152,630 | -583,555 | 2.2 |
| Base | As modelled | 711,240 | 1,968,600 | 140,726 | 5.4 |
| High | Logos 1.25x base, churn 0.85x base, price 1.1x base | 976,734 | 2,708,046 | 783,265 | 9.0 |

In the low case the company does not reach profitability inside the plan period and requires a larger Series A on worse terms, or a deliberate reduction of the 2029 and 2030 hiring plan to hold cash. The low case remains a going concern through 2027 on the seed round, with a closing 2027 cash balance of 202,989 euro, which is the fact that matters for this funding request.

The seed round is sized so that the low case still reaches the Month 24 decision point with cash on hand. It is not sized so that the base case is comfortable.

## 11.6 Break-even

Base case break-even on an EBITDA basis occurs during 2030. Expressed in customers rather than in time, the company covers its 2030 cost base at approximately 2,540 paying accounts on the modelled mix, against 2,930 forecast.

---

# 12. Risk register

| # | Risk | Category | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|---|
| 1 | Neither founder has sold to Cypriot SMEs and neither is Cypriot. Local trust and network are missing at the point of sale. | Team | High | High | Cyprus-resident sales lead is the fifth hire, in Month 6 of 2026, recruited specifically for an existing accountancy network. Cyprus-resident sustainability practitioner in Month 4. Two Cyprus-based advisers under recruitment. Both founders resident in Cyprus from Month 1, not managing remotely. | CEO |
| 2 | VSME is voluntary. If large buyers relax supplier data requests after the Omnibus scope reduction, the urgency behind our main product disappears. | Market | Medium | High | Lead commercially with CBAM, which is mandatory with a financial consequence, and treat VSME as the expansion sale. Build bank-facing export formats, because Cypriot lenders are becoming an independent demand source. Accept the low case in section 11.5 as the planning consequence if this happens. | CEO |
| 3 | Zero validated demand. No paying customer, no letter of intent, no pilot. Every revenue assumption is untested. | Market | High | High | The first funded quarter is a structured interview programme with thirty named Cypriot firms plus a paid pilot with five, specifically to test the 540 euro price and the sales-cycle length before the 2027 hiring commitments are made. The Month 12 milestone is set at forty paying customers, well below the base case of 128. | CEO |
| 4 | Sales cycle is nine months rather than three to four, pushing 2027 revenue out by two quarters. | Market | Medium | High | Cycle length is a specific question in the interview programme. The 2027 hiring plan has two hires, the product designer and the second reviewer, that can be deferred by two quarters to hold approximately 55,000 euro of cash if the signal is bad. | CEO |
| 5 | A well-funded EU platform prices down into the Cypriot SME segment. | Competitive | Low in Cyprus, medium in Greece | Medium in Cyprus, high in Greece | The Cypriot market at 7.17 million euro is too small to be a primary target for a company with a large cost base. Our defence is the data layer and the channel, not price. In Greece this defence is weaker, which is why Greece is a 2029 entry with a local channel and not a 2027 land grab. | CEO |
| 6 | An incorrect figure reaches a customer's regulator or auditor and we are held responsible. | Regulatory / liability | Medium | High | Deterministic arithmetic in code with a reproducible factor series. A human approval gate on every action, which cannot be switched off. Per-figure evidence chains from Q3 2026. Professional indemnity insurance before the first paying customer. Terms that state the customer is the reporting entity. | CTO |
| 7 | EU AI Act obligations tighten for systems producing regulated disclosures. | Regulatory | Medium | Medium | The approval architecture, the model gateway and the code-based calculation already implement the controls such obligations would require. The likely cost is documentation rather than rebuild. | CTO |
| 8 | Model provider price increase or capability change breaks the drafting engine economics. | Financial / technical | Medium | Medium | All calls pass one gateway module, so a provider change is a configuration change rather than a rewrite. Inference is 26 euro per account per year, so even a threefold increase costs 3.9 per cent of gross margin in 2030. | CTO |
| 9 | Hiring six Cypriot technical and sustainability staff by 2027 in a small labour market with strong competition from banking and shipping. | Execution | Medium | Medium | Salary bands set at the upper half of the Cypriot range for the role, options for the first six hires, and remote-friendly terms for Greece-based engineering from 2029 if Cypriot supply is short. Two of the 2029 engineering roles are explicitly openable in Greece. | CEO |
| 10 | A data breach exposing customer commercial and consumption data. | Security | Low | High | Row-level security at the database and not only in the application. European Union data residency. Published sub-processor list. Cyber insurance from first customer. ISO 27001 track from 2028. | CTO |
| 11 | The Cyprus grid factor series or the EAC bill format changes and silently breaks ingestion or restates prior figures. | Technical | Medium | Medium | Factors held as a versioned period series so a prior report is never silently restated. Format changes are caught by parser tests against held sample bills, with a manual fallback path that already exists. | CTO |
| 12 | Startup Visa re-evaluation is not met at the end of the initial period. | Regulatory / company | Low | High | The renewal tests are three new Cyprus jobs, or 15 per cent revenue growth, or 150,000 euro of investment, plus digital skills certificates. The plan creates four Cyprus jobs in 2026 alone and raises 720,000 euro of external funding in the same year, so two of the three tests are met several times over. Certificates for both founders are scheduled in 2026 rather than in the month before renewal. | CEO |
| 13 | Concentration in the accountancy channel. Losing two large practices costs a large share of new business. | Commercial | Medium | Medium | No single practice may exceed 15 per cent of new logos in a year without a direct-channel offset. Direct and self-serve are maintained alongside the channel for exactly this reason. | CEO |

Risks 1, 2 and 3 are the ones we would want an evaluator to press us on. They are not comfortable and none of them is fully solved by anything in this plan.

---

# 13. Funding ask and use of funds

## 13.1 The request

**900,000 euro of external funding for the period Month 1 of 2026 to Month 24 of 2027**, alongside 90,000 euro of founder capital already committed.

| Source | Amount | Timing | Status |
|---|---|---|---|
| Founder capital | 90,000 | Before Month 1, 2026 | Committed |
| Seed equity | 600,000 | Month 3, 2026 | Sought |
| RIF PRE-SEED, non-dilutive | 120,000 | Month 7, 2026 | Application prepared for call PRE-SEED/0526 |
| RIF SEED, non-dilutive | 180,000 | Month 5, 2027 | Planned for call SEED/0525 or successor |
| **Total to end of 2027** | **990,000** | | |

The equity component is 18.3 per cent of the company at the price we are seeking. One third of the total is non-dilutive and is contingent on competitive grant decisions; the low case in section 11.5 assumes both grants and still closes 2027 with 202,989 euro of cash, because the RIF tranches are treated as upside rather than as the foundation of the runway. If both grant applications fail, the seed round alone carries the company to Month 21 rather than Month 30, and the Series A moves forward by one quarter.

## 13.2 Use of funds

| Use | Amount | Share | What it buys |
|---|---|---|---|
| Cyprus engineering payroll | 372,000 | 41% | Senior engineer, data engineer, backend contribution and founder CTO time. Delivers the EAC data foundation, the CBAM definitive-regime pack, authenticated feeds and multi-entity workspaces. |
| Cyprus commercial payroll | 205,000 | 23% | Sales lead from Month 6 of 2026, channel account executive from Month 4 of 2027, customer success from Month 9 of 2026. Delivers eight signed practices in 2026 and twenty-four in 2027. |
| Sustainability and delivery payroll | 132,000 | 15% | Two Cyprus-resident reviewers. Delivers correct disclosures, the Greek template set, and service revenue without founder involvement. |
| Demand generation | 110,000 | 12% | Greek-language content, CBAM outbound programme, federation workshops, and the paid pilot in Q1 2026. |
| Infrastructure, data feeds and model inference | 34,000 | 4% | Two years of hosting, Cyprus and EU data feeds and inference at the modelled volumes. |
| Legal, audit, insurance, trade mark and data protection | 47,000 | 5% | Cyprus company and employer setup, audited accounts, professional indemnity and cyber cover, EU trade mark, data protection documentation. |
| **Total** | **900,000** | **100%** | |

Every payroll figure above ties to the hiring table in section 9.3 and to the payroll line in section 11.1. Seventy-nine per cent of the money is spent on people employed in Cyprus.

## 13.3 The milestone this buys

The funding is not a reward for the plan. It buys one falsifiable result, and the result is stated so that failure is visible.

**By the end of Month 12 of 2026:** forty paying Cypriot customers, eight signed accountancy practices, a shipped CBAM definitive-regime filing pack used for at least one real quarterly filing, Greek-language disclosure output in production, and a documented twelve-month retention curve for the first cohort.

**By the end of Month 24 of 2027:** 454 paying customers, 302,280 euro of exit ARR, gross margin above 65 per cent, CAC payback under fifteen months, ten people employed in Cyprus, and audited 2026 accounts.

If the Month 12 result is missed by more than a third, the correct action is to reduce the 2027 hiring plan and extend the test rather than to raise more money against an unproven motion. We would rather write that here than discover it at a board meeting.

---

# 14. Milestones and long-term view

## 14.1 Twenty-four month milestone table

| Quarter | Milestone | Measured by |
|---|---|---|
| 2026 Q1 | Company registered in Cyprus, both founders resident, seed round closed, interview programme with 30 named firms complete | Registrar certificate, residence permits, bank statement, 30 written interview records |
| 2026 Q1 | EAC bill parsing and versioned Cyprus factor series in production | Deployed, with parser tests against held sample bills |
| 2026 Q2 | CBAM definitive-regime filing pack shipped; paid pilot with 5 Cypriot firms complete | 5 pilot invoices paid |
| 2026 Q2 | First 3 accountancy practices signed | Signed channel agreements |
| 2026 Q3 | 20 paying customers; per-figure evidence chain shipped; structured review with one Cypriot audit practice | Stripe records; written review outcome, favourable or not |
| 2026 Q4 | 40 paying customers; 8 practices; Greek disclosure output in production; RIF PRE-SEED decision | Stripe records; signed agreements; deployment; RIF letter |
| 2027 Q1 | 2026 accounts audited; SoftOne integration in build; second reviewer recruitment opened | Audit report |
| 2027 Q2 | 150 paying customers; multi-entity workspaces live; RIF SEED submitted | Stripe records; deployment |
| 2027 Q3 | 280 paying customers; supplier data requests live; 18 practices | Stripe records |
| 2027 Q4 | 454 paying customers; 302,280 euro ARR; 10 people employed in Cyprus; Startup Visa re-evaluation pack submitted | Stripe records; payroll records; DMRID submission |

## 14.2 Cyprus Startup Visa re-evaluation

The re-evaluation tests are met as follows, with the evidence named.

Viability: revenue growth from 62,560 euro in 2026 to 275,355 euro in 2027 is 340 per cent, against the 15 per cent test. Separately, 720,000 euro of external investment is received in 2026, against the 150,000 euro test. Evidence: audited accounts and the shareholder register.

Contribution: four new Cyprus jobs are created in 2026 and four more in 2027, against the three-job test. A new product, the CBAM definitive-regime filing pack, launches in 2026, which satisfies the alternative test independently. Evidence: Social Insurance Services registrations and the product release record.

Digital skills: both founders complete two internationally recognised certificates each during 2026, across product management, data analytics and information security, which satisfies the two-certificate requirement for an individual applicant and the one-per-member requirement for a team application with margin. Evidence: certificates.

## 14.3 Three-year and five-year position

By the end of 2028 Vuneli is the standard way a Cypriot SME produces a sustainability disclosure, with 1,062 paying accounts, 711,240 euro of ARR and fourteen people in Cyprus. The Cyprus data layer is complete enough that a competitor entering the market would need eighteen months to match it.

By the end of 2030 the company is profitable at 140,726 euro of EBITDA on 2.12 million euro of revenue, employs twenty-four people in Cyprus, and has an established position in Greece as its second market.

## 14.4 What success without further funding looks like

This matters more than an exit paragraph, so it comes first.

If no Series A is raised, the company holds the 2027 hiring plan, does not enter Greece, and runs Cyprus and the accountancy channel with a team of twelve. On that shape, revenue reaches approximately 900,000 euro by 2030 with EBITDA break-even in 2029 rather than 2030. It is a smaller company and it is a sound one. The plan does not require an exit in order to be worth doing, and we would not present it here if it did.

## 14.5 Exit

The plausible acquirers are the European sustainability platforms named in section 5.2, for whom a Cyprus and Greece position with a maintained regional data layer is faster to buy than to build; a European accountancy or audit network buying delivery capacity; or a Cypriot or Greek financial institution buying the data relationship with its own SME lending book.

We are not planning around a specific acquirer, and no valuation assumption in this plan depends on one.

---

# Annex A. Assumption register

| # | Assumption | Value | Basis | Tier | Sensitivity applied |
|---|---|---|---|---|---|
| A1 | Active Cypriot enterprises | 57,000 | CYSTAT / Registrar business demography, midpoint of published range | T2 | No |
| A2 | Firms with 10 or more employees | 8,900 | Commission SME Performance Review size bands for Cyprus | T2 | No |
| A3 | Share in exposed sectors | 83% of A2 | CYSTAT NACE sector shares | T2 | No |
| A4 | Share with a disclosure trigger | 93% of A3 | Founder estimate from the overlap of exporters, CBAM importers and bank-financed firms | T5 | Yes, 75% tested |
| A5 | Digital readiness | 90% of A4 | Founder estimate proxied on accounting software use | T5 | Yes, 80% tested |
| A6 | Pro price | 45 euro per month | Set against the consultant alternative, not benchmarked to a signed Cypriot contract | T5 | Yes, 0.9x and 1.1x |
| A7 | Enterprise price | 185 euro per month | As above | T5 | Yes |
| A8 | Service engagement price and attach | 950 euro, 35% falling to 22% | Priced under the consultant alternative; attach is a founder estimate | T5 | Yes |
| A9 | Gross monthly logo churn | 2.5% falling to 1.5% | Vertical SMB software benchmark range of 3-7% early; we assume better than benchmark because the product holds compliance data, and we flag that this is optimistic | T3 and T5 | Yes, 1.35x |
| A10 | Blended close rate | 20-23% | Founder estimate from the channel-introduced mix; untested in Cyprus | T5 | Yes, via logo volume |
| A11 | Sales cycle | 3-4 months | Founder estimate; the first-quarter interview programme tests it | T5 | Yes, risk 4 |
| A12 | Cyprus employer contributions | 19.9% on base salary | Cyprus employer social insurance and related contributions; verify current rate at hire | T2 [verify] | No |
| A13 | Corporate income tax | 15% from 2026 | Cyprus tax reform | T2 | Not material, loss-making |
| A14 | Cyprus grid intensity | approx. 610 gCO2/kWh | Electricity Maps and national energy statistics; held as a period series, not a constant | T2 | Not a revenue driver |
| A15 | Model inference cost | 26 euro per account per year | Measured against current gateway pricing at our usage profile | T1 | Risk 8 |
| A16 | CBAM-exposed Cypriot firms | 300-500 | Founder estimate from construction supply chain concentration; to be replaced with customs evidence | T5 [verify] | Not in the model |
| A17 | Greek addressable firms | 70,000-85,000 | Analogy from Cypriot filter ratios applied to Greek enterprise counts | T4 | No Greek revenue before 2029 |
| A18 | Working capital drag | 6% of revenue growth | Card-collected subscription with 30-day invoicing on Enterprise and services | T5 | No |
| A19 | Expansion revenue | Not modelled | We have no basis; excluding it understates net revenue retention | - | Understates base case |

# Annex B. Cyprus Startup Visa requirement map

| Scheme requirement | Where addressed |
|---|---|
| Third-country nationals, team of up to 5 | Section 9.1. Two founders at application. |
| At least 25% of shares held by the applicants | Section 9.4. Combined founder holding 95% at incorporation, 71.2% after seed, approximately 53% after the 2028 Series A. |
| Innovative startup: unlisted, under 5 years, no profit distribution, not formed by merger | Company newly registered in Cyprus; no distributions; no merger. |
| Category A, business plan route, pre-revenue | Confirmed. Category B thresholds of 1M euro revenue and 10% R&D of operating cost do not apply at application. |
| Innovation under EU Regulation 651/2014, high technological or industrial risk | Sections 3.2 to 3.6 and 8.5. |
| Implementation: team capability, motivation, ownership, prior experience | Section 9, including the honest gap statement in 9.2. |
| Impact: business model, go-to-market, IPR management, financial soundness, scale-up and job creation | Sections 6, 7, 8.6, 11 and 9.3. |
| Excellence: innovation against the state of the art, feasibility, timing, unique selling point | Sections 3.6, 4 and 5. |
| Scaling to European or global markets | Section 4.5 and section 8.4. |
| Gender dimension, climate and societal benefit | Section 3.7. |
| Cap table with ESOP and equity breakdown | Section 9.4. |
| Three-year forecast with key metrics | Section 11, which carries five years including the required three. |
| Job creation and Cyprus employment | Section 9.3. Six Cyprus jobs by end 2026, twenty-four by end 2030. |
| Re-evaluation tests at renewal | Section 14.2. |
| Submission format: PDF, English, 10-15 pages | Delivered as the separate Annex II document, distilled from this master. |

**Open items to confirm with DMRID before submission**, carried forward from our research and not resolved here: the operative scheme mailbox, where two official pages differ; the initial permit duration, where the Practical Guide states three years plus two-year renewals and the Migration Department page still shows two plus one; and the full text of the fourth Annex III evaluation criterion, which the published excerpt does not name.

# Annex C. Sources

Primary legal and regulatory: Directive (EU) 2022/2464 on corporate sustainability reporting; Regulation (EU) 2023/956 establishing the Carbon Border Adjustment Mechanism; Commission Regulation (EU) No 651/2014; the EFRAG VSME standard for non-listed small and medium undertakings; the 2025 Omnibus simplification package.

Cyprus scheme documentation: DMRID Cyprus Startup Visa Practical Guide, December 2024; Annex I application form; Annex II guidelines for drafting a business plan; Annex III evaluation criteria; Annex IV external auditor certificate; the Migration Department Startup Visa notice of 28 January 2026; the Council of Ministers decision of 18 December 2024.

Statistics and market: Cyprus Statistical Service business demography; European Commission SME Performance Review, Cyprus country sheet; Cyprus Registrar of Companies; Electricity Maps and national energy statistics for grid carbon intensity.

Funding programmes: Research and Innovation Foundation calls PRE-SEED/0526 and SEED/0525; the Innovative Enterprises Certificate scheme administered by DMRID.

Company sources: Vuneli product repository and price book; the model in this plan, which is a single computation reproducible from the assumption register in Annex A.
