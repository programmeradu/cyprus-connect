# Frontier Innovation Mining — Round 2

Date: 2026-09-24. Run ID: S1-FRONTIER-02. Every candidate below is **unproven** and has not passed S2 unless stated. Rule: a problem counts only if a dated obligation exists, today's tools cannot meet it, and the gap is structural, not plumbing.

## 1. ETS2 from 2028 — SME cost shock (I-15 deepened)

**Facts found**
- ETS2 is upstream: fuel suppliers surrender allowances; SMEs feel it through fuel, heating, transport and subcontractor prices (PaveNow, Jul 2026). Full operation 2028, not 2027.
- Full auctioning, no free allocation; a Finnish supplier case study found material exposure at every modelled price and negative operating performance even at partial pass-through (Pirojenko, Metropolia MBA thesis, May 2026, with Teboil).
- SMEunited (Jun 2025): fuel already exceeds 30% of turnover for transport SMEs.
- ECB Macroprudential Bulletin 32 (Nov 2025): transition risk enters bank credit models top-down, by sector. Banks most exposed to climate losses differ from those flagged in the general EU stress test.

**Where the real uncertainty sits**
The per-litre shock is known arithmetic (price × emission factor). The unknowns per firm are: (a) fuel volume (sparse slips — the I-07 fuel layer already handles this), and (b) the firm's ability to pass the cost to its own customers. (b) is the only research-grade part.

**Candidate I-15b: per-firm pass-through capacity inferred from the firm's own history of past fuel-price shocks** (2022 spike in Cyprus fuel prices, already in our S1 data), using bank-transaction or invoice margins before and after.
- Prior-art risk: HIGH. Fuel-tax and cost pass-through estimation is a mature econometrics field (sector and market level). Per-firm estimation from 1–2 shocks is probably too noisy to be useful — that itself is testable.
- Verdict: **open-weak**. Worth one S2 screen only because it reuses I-07/I-13 machinery and gives banks a PD overlay. Do not invest before I-14 S3.

## 2. CBAM definitive period — processed goods without plant data

**Facts found**
- Definitive-period calculation rules: Implementing Regulation (EU) 2025/2547 (10 Dec 2025); verification principles 2025/2546; Commission Guidance Document 3 for the definitive period, 14 Aug 2026 (taxation-customs.ec.europa.eu). Embedded emissions build on EU ETS MRR (2018/2066); precursor emissions are added from the precursor producer's data or defaults.
- The importer cannot see the plant. Actual values come from the non-EU operator and an accredited verifier; otherwise defaults with mark-up.

**Structural problem**
A Cypriot importer of steel articles (HS 73) receives a supplier figure it cannot check, from a chain of precursors it cannot see. The choice "accept actual vs pay default" is a financial decision under uncertainty.

**Candidate I-17: plausibility interval for a supplier-declared embedded-emissions value**, built from route benchmarks, precursor mass balance and default values, returning P(declared value is physically implausible).
- Prior-art risk: HIGH. EU ETS benchmarks, CBAM default values and verifier site checks already exist; commercial CBAM tools (round-1 survey) screen supplier data against defaults. A Bayesian version is likely engineering.
- Market risk: Cyprus volume is small (≤ 183,547 t covered imports in 2025, S1-CBAM). Not a Cyprus-scale research case.
- Verdict: **open-weak, low priority.** Kept as a problem record, not a research track.

## 3. Tamper-evident assurance chains without blockchain

**Facts found**
- ISSA 5000 (IAASB) sets evidence sufficiency by professional judgement. It does not require cryptographic provenance. Limited-assurance extracts published Aug 2025.
- US 12,725,117 B2 (Alfa Digital, Sep 2026) automates recalculation checks of inventory items — deterministic, and now patented.

**Assessment**
Tamper evidence without a blockchain is solved engineering: hash chains / Merkle trees, append-only transparency logs (RFC 6962 pattern), trusted timestamps (RFC 3161), content hashing of uploaded documents. None of this has technical uncertainty in the Frascati sense.

**Candidate I-18: hash-chained evidence ledger for SME emissions files.**
- Verdict: **killed as research (engineering).** It is still useful as the carrier for I-16 (calibrated claim record: value + interval + evidence hashes + I-14 calibration certificate). Build later only if I-14 survives.
- One open, non-crypto question noted: whether an auditor could *sample* documents using the I-13 posterior (audit sampling weighted by where the interval is most sensitive). Prior-art check needed: monetary-unit sampling and risk-based audit sampling are mature — likely killed. Logged as I-19, open-weak.

## 4. Portfolio after round 2

| ID | Candidate | Status | Strength |
|---|---|---|---|
| I-07+I-13 | Calibrated per-firm intervals from proxy + sparse, ambiguous documents | S4 synthetic partial | Medium (synthetic only) |
| **I-14** | Sensitivity-bounded MNAR backtest of emissions intervals | **S2 PASS (conditional)** | **Strongest; S3 next** |
| I-15b | Per-firm ETS2 pass-through capacity | open-weak | Weak |
| I-16 | Calibrated claim record | vehicle | — |
| I-17 | CBAM supplier-value plausibility interval | open-weak | Weak |
| I-18 | Hash-chained evidence ledger | killed (engineering) | — |
| I-19 | Posterior-weighted audit sampling | open-weak | Weak |

Programme story the evidence supports so far (not a proven result): *estimates that carry calibrated intervals (I-13), and the first test that can say whether anyone's intervals are honest when only self-selected firms ever report (I-14).* Both are measurement science, not carbon calculation.

## 5. Next gates
1. Pre-register I-14 (`research/prereg/I-14.md`), lock hash, then run a power simulation (H14-1..3).
2. Claim-level read of Refinitiv US 11,397,955 B2 against I-13 (FTO flag from S2-PA-12).
3. One S2 screen each on I-15b and I-19 before any time goes into them.

## Sources
PaveNow blog 24 Jul 2026; Pirojenko, Metropolia 21 May 2026; SMEunited 6 Jun 2025; ECB Macroprudential Bulletin 32, Nov 2025; Regulation (EU) 2025/2547 (OJ L 2025/2547); EC CBAM Guidance Document 3, 14 Aug 2026; EC CBAM legislation page; IAASB ISSA 5000 extracts Aug 2025 and implementation guide; US 12,725,117 B2.
