# S2 Prior-Art Gate — I-14: Selection-Debiased Backtesting of Emissions Intervals (MNAR)

Date: 2026-09-24. Run ID: S2-PA-12. Status: **PASS to S3, conditional and narrowed.** Not a legal patent opinion.

## 1. Candidate as tested
A statistical test that tells a bank or supervisor whether the stated intervals on financed-emissions estimates (PCAF Scope 3 Cat 15) cover the true values, when true values arrive late and only for firms that *choose* to report (missing not at random, MNAR).

## 2. Verdict rule (set by the director before the search)
- KILL if a standard or vendor tool already gives an off-the-shelf MNAR-corrected interval backtest for bank financed emissions.
- PASS if the state of the art is qualitative review or naive (uncorrected) benchmarking.

## 3. Findings

### 3.1 Standards
| Source | What it does | Interval backtest? |
|---|---|---|
| PCAF Part A, 3rd ed., Dec 2025 (carbonaccountingfinancials.com) | Data quality score 1–5, attribution rules | No. No intervals, so nothing to backtest |
| UK Export Finance basis of reporting, Jul 2026 (gov.uk) | States "limited verification of data accuracy" | No |
| ISSA 5000 (IAASB, Nov 2024) + ACCA estimates case study 2026 | Assurance of estimates by judgement, method review | No statistical coverage test |
| ECB good-practice report on climate stress testing, May 2026 (round 1) | Describes how banks estimate | No validation test |

### 3.2 Vendors (naive benchmarking only)
- **MSCI, "Filling the Blanks", Jul 2016**: compared estimates with 277 first-time disclosers. EIO-LCA overstated by a median 208%. This is a one-off point-error comparison. It does not correct for why those 277 chose to disclose. **Naive benchmarking.**
- **MSCI GHG methodology, Jun 2024**: "Data quality assurance" section is process checks, not a coverage test.
- **S&P Trucost methodology, Nov 2025**: FAQ "comparisons made with other data sources". Point estimates, no intervals.
- **FTSE Russell "Mind the gaps"**: hierarchical multi-model point estimates; out-of-sample error on disclosers, no selection correction found in the overview.
- Moody's, Qontigo/Axioma, RiskFirst: no public page found that describes an emissions-interval backtest. **Not read in full; logged as a gap.**

### 3.3 Academic work — the closest threats
| Paper | What it does | Why it does not kill I-14 |
|---|---|---|
| **Chen, Lioui & Scaillet, "Green Silence", SSRN/UNIGE Sep 2025** | Heckman-style 3-step DML correction for strategic non-disclosure of emissions; rejects "no selection bias" on 3,444 US firms; finds systematic underestimation | Corrects the *estimates*. Does not test whether stated *intervals* are calibrated. Large listed US firms, not SMEs. **Closest prior art; the selection problem itself is now published.** |
| **Rongchen Li, Columbia WP, Jan 2025** | Model: high emitters abstain, so vendors calibrated on disclosers underestimate | Confirms the bias exists and is structural. No test statistic |
| **Aswani, Raghunandan & Rajgopal, Rev. Finance 2024** | Vendor estimates track fundamentals, not disclosures | No test |
| **Nature Climate Change 2025 (s41558-025-02494-9)** | 58% of US firms later revise self-reported emissions; understatement > 2× overstatement | Important *against* us: the "true value" we backtest against is itself noisy and biased |
| **Yi, Zhang, Tang & Wang, Statistica Sinica 2026** | Conformal prediction sets under nonignorable (MNAR) missing responses, via a propensity model | Builds MNAR-valid *intervals*, not a *test* of someone else's intervals. Needs a consistently estimated missingness model |
| Lee, Dobriban & Tchetgen Tchetgen, arXiv 2403.04613 (2025) | Conditional coverage under MAR | MAR only |
| Jin & Ren, arXiv 2403.03868 (2025) | Selection-conditional conformal coverage | Selection by the analyst, not self-selection by the unit |
| Manski 2003; Horowitz & Manski 1999; McClean, Branson & Kennedy arXiv 2405.08738 | Partial identification bounds; calibrated sensitivity models | General theory. Not applied to interval-calibration testing of emissions |
| Diebold–Mariano; Gneiting & Raftery 2007; Basel traffic-light | Forecast comparison, proper scoring, VaR exception counting | Assume realisations are observed for every forecast (no self-selection). Mature |

Targeted search for a 2024–2026 paper in J. Banking & Finance, J. Financial Stability or J. Cleaner Production proposing a backtest statistic for PCAF Cat 15 under self-selection: **none found** (3 query variants, see registry). Journal full-text search not possible; logged as a gap.

### 3.4 Patents (keyword screen, not claim-level)
- US 12,725,117 B2 (Alfa Digital, granted 1 Sep 2026): recomputes an inventory item and checks equality. Deterministic recalculation. Does not anticipate.
- US 8,321,234 B2 / US 11,397,955 B2 (Thomson Reuters / Refinitiv): estimation under missing data with "error estimates". Does not claim coverage testing. **FTO flag for I-13, not I-14**: the claim language on estimates plus error estimates for incomplete data must be read claim-by-claim before any I-13 filing.

## 4. Verdict
**PASS to S3 under the director's rule.** No standard or vendor offers an MNAR-corrected interval backtest. The state of the art is naive benchmarking (MSCI 2016) and process review (ISSA 5000).

**But be honest about how thin the novelty is.** Every building block is published: the selection bias in emissions disclosure (Chen et al. 2025, Li 2025), MNAR-valid conformal intervals (Yi et al. 2026), partial-identification bounds (Manski), exception-count backtests (Basel). A combination of known parts is engineering unless the combination creates a problem that the parts do not solve.

**The one problem the parts do not solve (the surviving research question):**
MNAR is not identifiable from the data alone. So a backtest cannot give a single pass/fail. It can only give a *set* of coverage values consistent with the data under a bounded selection assumption. The open question:

> RQ-14: Can we build a coverage test whose traffic-light verdict is valid over a sensitivity-bounded set of self-selection mechanisms (Manski-style bounds, with the sensitivity parameter calibrated against *observed* selection on covariates, per McClean et al.), and that still has useful power with fewer than 200 realised SMEs and noisy, revision-prone "true" values?

If the answer is "the bounds are always too wide to reach red or green with n < 200", I-14 is dead on power grounds. That is a real, falsifiable outcome.

## 5. Kill risks carried into S3
1. **Power:** partial-identification bounds may be uninformative at SME sample sizes. Most likely failure.
2. **Noisy truth:** realised values are revised in 58% of large-firm cases (Nature CC 2025). The test must model measurement error in the realisation.
3. **No intervals to test:** vendors publish point estimates. The test applies only to interval-producing estimators (I-13, or vendors forced to add them). This limits the market until a supervisor asks for intervals.
4. **Unread sources:** Moody's, Qontigo, RiskFirst full methodology; journal full texts; unpublished patent applications (18-month window).

## 6. Draft hypotheses for S3 (NOT locked)
- H14-1: under a simulated MNAR mechanism inside the sensitivity set, the bounded test keeps the false-red rate ≤ 5% at nominal 90% intervals.
- H14-2: with n = 150 realised firms, the test flags intervals with true coverage ≤ 75% as red in ≥ 80% of runs.
- H14-3: the naive test (uncorrected exception count) gives a false green in ≥ 30% of runs under the same MNAR mechanism (shows the correction matters).
Thresholds to be fixed in `research/prereg/I-14.md` and hash-locked before code.

## 7. Queries run (also in registry S2-PA-12)
1. backtesting financed emissions estimates PCAF validation coverage test
2. accuracy of estimated emissions vs later disclosed, selection bias non-disclosing firms
3. conformal coverage test MNAR selection bias 2024–2025
4. MSCI / Moody's / S&P Trucost estimate accuracy backtest methodology
5. partial identification bounds calibration test missing outcomes
6. patent validating estimated GHG data vs reported values
