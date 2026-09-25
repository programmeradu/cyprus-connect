# S1 — EU-wide SME sustainability problem evidence (sourced, not guessed)

Date: 2026-09-25. Rule: every problem below cites a primary or institutional source. No synthetic data. Verdicts on candidate innovations are provisional (S1), not claims.

## 1. Sources processed

| ID | Source | Type | Sample |
|---|---|---|---|
| SRC-01 | Eurochambres & SMEunited for EC Platform on Sustainable Finance, "SME experiences with finance and sustainable investment" (Sep 2023) https://www.smeunited.eu/admin/storage/smeunited/20230927-gh-survey.pdf | Survey + interviews | 2,142 firms, 25 member states (≈60% DE, ≈25% RO — not representative) |
| SRC-02 | SMEunited × EBF lending expert group note (Oct 2023) https://www.smeunited.eu/news/sme-finance-challenges-sustainability-reporting-and-financing-transition | Institutional statement | — |
| SRC-03 | DG FISMA Q&A on the Omnibus I value-chain cap (6 May 2026) https://finance.ec.europa.eu/news/feedback-sustainability-reporting-standards-additional-explanatory-information-regarding-value-chain-2026-05-06_en | Official EU guidance | — |
| SRC-04 | EIB, "Unlocking energy efficiency investments by small firms and mid-caps" (Sep 2025) https://www.eib.org/en/publications/20250106-unlocking-energy-efficiency-investments-by-small-firms-and-mid-caps | EIBIS analysis | ≈12,000 EU firms |
| SRC-05 | EIB Working Paper 2025/05, energy prices and uncertainty vs climate investment https://www.eib.org/en/publications/20250134-economics-working-paper-2025-05 | Econometric paper | EIBIS 2019–2022 |
| SRC-06 | EIB Investment Survey 2025 https://www.eib.org/en/publications/20250216-econ-eibis-2025-eu | Survey | ≈13,000 firms |
| SRC-07 | Flash Eurobarometer 549, SMEs & green markets (Jun 2024), GESIS ZA8869 doi:10.4232/1.14493 | Survey microdata | Not yet downloaded — next step |

## 2. Evidenced problems (the same in Cyprus, Germany, Belgium)

P1. Fragmented demands. SMEs increasingly get sustainability requests from banks and large customers, and "the content of these reporting requests differ[s] significantly between banks" (SRC-02, SRC-01 §Trickle-down).

P2. Burden without payoff. Almost 60% of SMEs invested in sustainability. Only 35% used external finance for it, and only 16% of that finance counted as sustainable, mostly grants and subsidies. The EU Taxonomy "cannot be applied to SMEs" (SRC-01). The paperwork does not lead to cheaper money.

P3. New legal protection that nobody operationalises yet. Since Omnibus I (Directive 2026/470), CSRD reporters may not require more than the voluntary-standard "necessary" disclosures from partners with ≤1,000 employees. Firms with ≤10 employees get an even smaller cap. Anything above the cap must be flagged, and the SME must be told it has a statutory right to decline (SRC-03 Q1–Q3, Q5).

P4. Energy cost is the real pain, and small firms under-invest. Just under 50% of EU firms cite energy costs as a major barrier. About 40% of SMEs invest in energy efficiency, against about 60% of large firms, even though SMEs spend a larger share of turnover on energy (SRC-04).

P5. Uncertainty kills long-term climate investment more than price does (SRC-05, SRC-06).

## 3. What this says about Vuneli's current framing

Measured SME pain sits in P1–P4: repeated, inconsistent requests, no financing benefit, and high energy bills. No source ranks "a more accurate carbon number" as a pain point. That is consistent with the founder's rejection of the interval pitch, and it downgrades I-07/I-13 from being the product to being internal components at most.

## 4. Candidates derived from evidence (provisional, S1 only)

| ID | Candidate | Problem | Honest status |
|---|---|---|---|
| I-21 | Request firewall: every incoming bank or customer questionnaire is parsed, each item is classed as in-cap or above-cap against Annex II, in-cap items are auto-answered from one held record, and above-cap items get a legally-grounded decline | P1, P3 | Real, new and legally mandated need. **Prior art found the same day:** free guides and decline templates (csrd-tools.com/suppliers, envirly, csrdpro, Linklaters, EcoVadis). The classifier is mostly rule engineering, which is weak for Frascati R&D and strong as a product wedge. Needs S2 on automated questionnaire-to-Annex-II mapping |
| I-22 | Evidence to cheaper money: link one SME record to measurable loan-pricing or grant eligibility | P2 | Market need proven. Mechanism undefined. Needs bank interviews, not code |
| I-23 | Energy-bill-to-investment decision under uncertainty: turn bills into a bankable efficiency case that hedges policy and price uncertainty | P4, P5 | Strongest measured pain. Energy audit tools exist; novelty would have to come from the uncertainty-robust decision method. Needs S2 |

## 5. Not yet done (no claims made)

- Download the Eurobarometer 549 microdata (SRC-07) and quantify P1/P4 for Cyprus against the EU average.
- Read the Annex II disclosure list verbatim and test whether real questionnaires (CDP supply chain, EcoVadis, bank ESG forms) can be mapped automatically.
- Run S2 on I-21 and I-23. Neither is called an innovation until it passes the gates.
