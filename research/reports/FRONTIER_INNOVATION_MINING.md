# Frontier Innovation Mining — Round 1

Date: 2026-09-24. Method: primary regulatory sources and peer-reviewed literature. Every problem below cites a source. Every hypothesis is **unproven and has not passed S2 prior art**. Nothing here is a feature decision.

Rule applied: a problem counts only if (a) a law or supervisor creates a dated obligation, (b) today's tools cannot meet it, and (c) the gap is structural, not missing plumbing.

## A. Regulatory friction (banks)

**F-01. Bank ESG risk measurement goes live, SME data does not exist.**
EBA Guidelines on ESG risk management (EBA/GL/2025/01) apply from 11 Jan 2026, and to small and non-complex institutions at the latest from 11 Jan 2027. They require identification and measurement of ESG risks through "exposure-, portfolio- and sector-based" methods (EBA final report, Jan 2025; EBA GL page). The EBA itself (EBA/REP/2025/06, cited in S2-I10) says a common SME estimation method is "not currently feasible".
- Structural? Yes. Obligation is dated. Micro-borrowers produce no reports (Omnibus value-chain cap).
- Already covered: this is I-07+I-13. No new idea, but it confirms the buyer and the date.

**F-02. Nobody can check whether an emissions estimate is right.**
ECB May 2026 good-practice report on climate stress testing has four boxes on how banks *estimate* emissions (PCAF, G-SIB, universal bank, external vendor). The literature shows vendor estimates diverge. Nguyen et al. (PLOS Climate 2023) find large divergence across Bloomberg, Refinitiv and ISS on Scope 3. Aswani, Raghunandan & Rajgopal (Rev. Finance 2024) find vendor-estimated emissions track financial fundamentals, not disclosed emissions. Swinkels & Markwat (2023) state: "because 'true' carbon emissions are not known, the authors cannot investigate which provider has the most accurate carbon data".
- Structural? Yes. Credit-risk models must be backtested (Basel traffic-light for VaR; PD backtesting). No equivalent exists for emissions estimates. Banks buy estimates they cannot validate.
- **→ Hypothesis I-14 (strongest new candidate): Calibration backtesting for emissions estimates.** A statistical test with a regulatory-style traffic-light: it checks whether a vendor's or bank's stated intervals cover the realised values when a borrower later reports actuals (for example when VSME data or a real bill arrives). It works only if estimates carry intervals. Point estimates are unfalsifiable, which is itself a finding.
  - Why it could be category-defining: it makes every data vendor (MSCI, Trucost, Cogo, Persefoni) *testable*. Supervisors need it, and vendors would have to integrate it to prove quality. It uses I-13's interval output as the first compliant input.
  - Kill risks: (1) prior art in forecast verification (proper scoring rules, Gneiting & Raftery 2007) and conformal coverage testing is mature. Novelty would be the application plus the design of a legally usable test under sparse, delayed, biased-selection realisations. (2) Selection bias: firms that later report are not random. That is the hard research problem, and it may be unsolvable. (3) A vendor or supervisor may already backtest privately.
  - Research question: under non-random, delayed realisation of true values, can a coverage test keep a controlled false-alarm rate with n < 200 realised firms?

**F-03. ETS2 moves a carbon cost into SME fuel bills from 2028. Banks cannot see which borrowers are exposed.**
ETS2 is fully operational from 2028 (European Commission DG CLIMA). It was postponed from 2027. Auctions are expected in 2027, and there is a price-stability mechanism near €45/t (bpv Braun Partners, Mar 2026; CarbonUnits, Jun 2026). Suppliers pay upstream and pass the cost down.
- Structural? Partly. The shock is known per litre. What is unknown is each micro-firm's fuel dependence and its ability to pass the cost on.
- **→ Hypothesis I-15: Per-borrower ETS2 cost-shock exposure with a calibrated interval** (fuel litres from sparse slips × pass-through × margin), used as a transition-risk overlay on PD. It reuses the I-07 fuel ambiguity layer.
  - Kill risks: likely engineering (multiplication) unless pass-through estimation per sector from Cyprus price data is itself uncertain research. Probably fails Frascati novelty. Rated WEAK.

## B. Supply-chain bottlenecks

**F-04. EUDR plot geolocation.**
EUDR applies from 30 Dec 2026 to large/medium operators, and from 30 Jun 2027 to other micro/small operators. There is a simplified regime for micro/small primary operators (Loyens & Loeff, Jan 2026; Lexgo, May 2026). The practical bottleneck is polygon geolocation at smallholder/aggregator level for cocoa and coffee (Ideagen, Jul 2026).
- Relevance to Vuneli: **low**. Cyprus firms are downstream traders; due diligence moved to the first placer. The bottleneck sits in producing countries and is contested by satellite firms (Meridia and others). **Parked. Not our fight.**

**F-05. CSDDD trickle-down.**
Omnibus I (2026) narrowed CS3D scope and the value-chain information requests (Lexgo, May 2026). Demand pressure on Cypriot SMEs has *fallen*. **No structural gap for us. Dropped.** (Exact thresholds not verified against the Official Journal.)

## C. Autonomous compliance primitives

The question: what would Xero, SoftOne and fleet platforms be *forced* to integrate?

- **Product-level data exchange already has a standard.** PACT (WBCSD) carries pedigree-style data quality indicators and a primary data share, not calibrated intervals (see TOOLING_SURVEY). An integration layer is plumbing (see rule "integration is not innovation").
- **→ Hypothesis I-16: "Calibrated emissions claim" record.** A minimal data object {value, interval, coverage level, evidence hashes, calibration certificate from I-14}. It is useful only if I-14 exists: the calibration certificate is what makes it more than a schema. **Not research on its own.** It is the distribution vehicle for I-14 and I-13, and can be proposed as a PACT extension.
- Cryptographic provenance: dropped earlier (I-10) and not reopened. There is still no authenticity root in Cyprus until ViDA (2030, cross-border only).

## D. Honest summary

| ID | Status | Strength |
|---|---|---|
| F-01 → I-07+I-13 | Existing programme; buyer and date confirmed | Medium (synthetic only) |
| F-02 → **I-14** calibration backtesting | New; S2 required next | **Strongest new candidate** |
| F-03 → I-15 ETS2 exposure | New; likely engineering | Weak |
| F-04 EUDR | Parked, out of Cyprus scope | — |
| F-05 CSDDD | Dropped, demand shrank | — |
| I-16 claim record | Vehicle only, not research | — |

Programme narrative that the evidence supports (not a proven result): *"Emissions estimates for SMEs are unfalsifiable today. We build (1) estimates that carry calibrated intervals and (2) the test that proves whether anyone's intervals are honest."* This is a measurement-science claim, not a carbon calculator. It passes the RIF/DMRID "research, not assembly" bar only if I-14 survives S2 and the selection-bias question is shown to be genuinely open.

## E. Next gates (not started)
1. S2 on I-14: forecast-verification literature, conformal coverage tests under covariate shift, PCAF/ECB/EBA text on validation, vendor methodology pages (MSCI, Trucost, ISS), patents on "emissions estimate validation".
2. Primary-source check of Omnibus I CS3D thresholds and the ETS2 price mechanism before any external quote.

## Sources
- EBA GL/2025/01 page and final report: eba.europa.eu (application 11/01/2026; SNCI by 11/01/2027)
- ECB, Report on good practices for climate and nature-related risk stress testing, May 2026; ECB blog, Elderson, 8 May 2026
- DG CLIMA ETS2 page; bpv Braun Partners 9 Mar 2026; CarbonUnits 17 Jun 2026
- EC Green Forum EUDR; Loyens & Loeff 13 Jan 2026; Lexgo 20 May 2026; Ideagen 23 Jul 2026
- Nguyen et al., PLOS Climate 2023, doi:10.1371/journal.pclm.0000208
- Aswani, Raghunandan, Rajgopal, Review of Finance 28(1) 2024
- Swinkels & Markwat, Managerial Finance 2023, doi:10.1108/mf-02-2023-0077
- Eurostat nrg_bal_c (CY 2022), for the Section 4 check in the unified-core report
