# S2 on external suggestions I-10/I-11/I-12 + literature gap mining

Date: 2026-09-24. Runs: S2-PA-08, S2-PA-09, S2-PA-10, S1-MINE-10.
Source of I-10 to I-12: another AI model's note (unproven). That note also wrongly called I-07 "validated". It is not: S4-E01-07 was synthetic, H2 failed, and the generator did not pass validation.

## I-10 Zero-knowledge footprint proof: KILLED
- Prior art: Man, Jaffer, Ferris, Kleppmann, Madhavapeddy, "Emission Impossible", ACM e-Energy 2026 (arXiv:2506.16347); Heiss et al. (TU Berlin) "Verifiable Carbon Accounting in Supply Chains"; Kiesel & Heiss, EDOC 2025 (arXiv:2509.20300); Babel et al., Energy Informatics 2022 (shielded NFTs); Udokwu & Crass, Electronics 2026 15(4):745.
- Patent application: Cisco US 2025/0117807 A1, "Zero Knowledge Attestations for Carbon Footprint Metrics" (FTO risk).
- No authenticity root: Cyprus B2B e-invoicing mandate NO (EC eInvoicing country sheet 2025); ViDA digital reporting from 1 Jul 2030, cross-border only.
- No demand: VSME asks only for totals; PACT uses named-party exchange, not ZK.
- Residual (not pursued): zkTLS against the EAC customer portal as a provenance root. Needs a portal inspection and bank interviews.

## I-11 Physics/constraint-bounded document interpretation: MERGED into I-07
- Hemmer et al., IJDAR 2025 (arXiv:2512.09666): constraint-validated LLM extraction from transactional documents, with public code. Uppsala thesis 2020: invoice extraction as a CSP.
- Tank-capacity checks: FleetCor US 9,563,893; Samsara, WEX SecureFuel.
- Data reconciliation: Tamhane & Mah 1985; Narasimhan & Jordache 2000.
- "Provable intervals auditors accept": no such category. ISAE 3410 was withdrawn May 2025; ISSA 5000 is judgement-based.
- Kept only as an I-07 implementation variant (physical constraints as likelihood terms).

## I-12 Island-grid marginal factors: KILLED
- GHG Protocol Scope 2 Guidance 2015 p.53: "shall not use marginal emission factors". The 2025 revision keeps consequential methods in a separate track.
- WattTime MOER already covers about 210 countries; Electricity Maps withdrew marginal signals (2024).
- CY data: on ENTSO-E hourly only since mid-2025; EAC smart-meter rollout runs about 3 years, with no customer interval-data export found.

## Gap mining (S1-MINE-10): documented unsolved problems
Ranked by evidence strength:
1. EBA/REP/2025/06: a common ESG-exposure methodology for SME/retail exposures is "not currently feasible"; SME data is the least available. (Regulator)
2. Banco de España, IFC Bulletin 66 (2024): firm-by-firm econometric proxy, because no SME data exists.
3. Phillpotts et al., J. Industrial Ecology 2025 (Lloyds co-authored): UK SME Scope 1/2 from transactions, R² 0.89 / 0.72. The residual error is at firm level.
4. Baret, Lucotte, Tokpavi, INFER WP 2025.12: firm-level Scope 3 estimation validated only against large reporters.
5. Schoenauer & Trompke, FEBRI WP 2026001: product-matching proxy for 7,885 SMEs; "differences are inherent to methodological choices", with no ground truth.
6. Omnibus I, Directive 2026/470: the value-chain cap forces large buyers to estimate SME suppliers by law.
7. EUDR smallholder geolocation verification: open remote-sensing problem, out of Vuneli scope.
8. DPP data availability: specification still moving; weak.

Reading: gaps 1-5 are one structural problem. Banks and buyers must give a firm-level number for an SME they have no documents for, so they use proxies (PCAF data quality 4-5) with no calibrated firm-level error. None of these papers reports calibrated uncertainty per firm, or fuses a proxy with a few real documents. This is a problem statement, not a proven gap. It overlaps I-07.

## New candidate (S0 only, not a claim)
- I-13: calibrated per-firm fusion of a sector proxy prior with sparse SME documents, giving a calibrated interval and a measured shift from PCAF DQ 5 toward DQ 2-3 per document added. Next: S2 prior-art screen (Bayesian updating of proxy estimates, PCAF DQ improvement methods, bank vendors such as Cogo, Sweep, Greenomy, Normative). Real test data: needs pilot documents or a bank partner dataset.

## Scorecard
Killed 10 (I-01, I-02, I-03, I-03b, I-04, I-05, I-06, I-08, I-10, I-12); merged 1 (I-11 into I-07); parked 1 (I-09); alive 1 (I-07, S4 synthetic); new 1 (I-13, S0).
