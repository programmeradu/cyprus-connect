# S2 — Prior art on I-21 (request firewall) and I-23 (energy bills to bankable case)

Date: 2026-09-25. Kill rule: a candidate is killed as *research* if existing products or papers already do its core mechanism. It may still survive as a *product feature*.

## I-21 Request firewall — KILLED as research, KEPT as product wedge

The core mechanism is: read any incoming ESG questionnaire, answer it from the firm's existing documents, and reuse those answers across requesters. Products already selling this:
- Briink ESG Questionnaire Pre-Fill: https://www.briink.com/solutions/esg-questionnaire-prefilling ("the questions keep changing, the answers don't")
- DitchCarbon Survey Responder (auto-completes CDP and EcoVadis): https://ditchcarbon.com/survey-responder
- SEQUESTO: https://sequesto.com/use-cases/esg-questionnaire-response
- ESG for Suppliers ("Documents in. Questionnaire out.", VSME-based): https://esgforsuppliers.com/
- Complezy: https://complezy.com/
- Free decline templates: https://csrd-tools.com/suppliers

The only piece not seen shipped is sorting each question into in-cap or above-cap under Delegated Regulation (EU) 2026/1560 Annex II (OJ L, 3 Jul 2026), plus an automatic legal decline. That piece is a rule table applied to text classification. It is standard engineering, not Frascati experimental development.

Verdict: build it as a product feature ("legally only answer what you must"), because it is a strong wedge for Cyprus SMEs. Do not pitch it as the innovation.

## I-23 Uncertainty-robust energy investment case — KILLED as method

Real-options and risk-integrated methods for energy investment under price uncertainty are already published:
- Real-options method for the energy sector: https://doi.org/10.1016/j.energy.2020.117226
- Risk-informed energy investment for industrial companies: https://doi.org/10.1016/j.egyr.2023.01.131
- Quantitative and qualitative risk analysis for industrial energy investment: https://doi.org/10.3390/su13126977

Applying these methods to SME utility bills is engineering. The measured pain (EIB: about 40% of SMEs invest in energy efficiency versus about 60% of large firms) remains real, which makes this a product value driver rather than research.

## Eurobarometer 549 Cyprus figures — BLOCKED

The Cyprus-level answers exist in GESIS dataset ZA8869 (doi:10.4232/1.14493; variable listing includes CY). Download requires a free GESIS account, which is personal. The Eurobarometer site's country factsheets load only through scripts and could not be fetched.

Blocker: the founder needs to register at https://access.gesis.org and download ZA8869 (CSV/SPSS), then upload it here. EU-level figures confirmed so far: 93% of SMEs take at least one resource-efficiency measure, and 25% have a carbon-reduction strategy.

## What this round proves

Every candidate derived from evidenced SME pain in this round was either a product feature or something already built. This is the third round with that outcome.

The pattern points to a hard conclusion: the SME-facing layer of sustainability is saturated. It is where the pain is and where product value lives, but it is not where research novelty sits.

Remaining unsaturated space seen across S1–S2 rounds:
- The bank/verifier side.
- Question-answer equivalence across different frameworks. Is an answer given to bank A provably valid for customer B's question? Existing tools do similarity retrieval; no reviewed source defines or measures formal equivalence.

This second point is logged as I-24 for the next S2 round.
