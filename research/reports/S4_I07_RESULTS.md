# S4 results: I-07 experiment E01 (synthetic)

Date: 2026-09-24. Run: S4-E01-07. Prereg: research/prereg/I-07.md (sha256 896e9158..., commit 4b651445...).
Code: research/experiments/e01_i07_mixture/run.py (sha256 6b5ed450..., seed 20260924, runtime 41 s). Raw output: results.json.

## Bottom line
- H1 (calibration): PASS on synthetic data. Coverage 0.918-0.919 in-model, 0.862-0.882 misspecified.
- H2 (fewer questions): FAIL. With no missing bills, EIG needed only 8.8% fewer questions than the fixed checklist (fail line: < 15%).
- H3 (ablation): PASS. Removing the discrete layer drops coverage by 6.3-8.5 points in-model and 12.4-15.7 points misspecified.
- The generator FAILS the prereg validation rule (see section 2). By the prereg's own data rule, these results are "synthetic, generator not validated". They are not evidence of innovation. They are a working test bench and a first signal.

## 1. Setup
- 1,000 synthetic micro firms per scenario, sector mix weighted by Eurostat SBS 2023 CY micro-enterprise counts (M; G47+I; C). Mean turnover per sector matched to SBS 2023 (EUR 100,331 / 287,331 / 212,860).
- Documents per firm: 6 bimonthly EAC bills (some missing), 1-4 fuel payment records with no fuel label (diesel / petrol / shop), an optional heating receipt (gasoil / LPG), and an unknown single-or-dual meter. 3-11 documents per firm.
- Real inputs: CY weekly pump prices 2025 (EU Weekly Oil Bulletin); CY monthly generation 2021-2025 for bill seasonality; CY 2025 grid factor 0.582 kg/kWh (S1 data).
- Assumed inputs, NOT validated: energy and fuel per EUR of turnover, dual-meter rate (15-25%), shop-spend rate (15%), heating-fuel shares, emission factors (DEFRA-style, typed from memory), Ciroth 2016 pedigree factors (typed from memory).
- Models: B1 fixed-default point estimate; B2 pedigree lognormal Monte Carlo (10,000 draws; GSD 1.05 measured bill, 1.55 imputed bill, 2.07 spend-based fuel); candidate = discrete mixture over fuel type, meter and heating fuel, 4,000 posterior samples; ablation = candidate with each discrete component replaced by a lognormal with the same mean and variance.
- Scenarios: missing bills 0%, 25%, 50%. In-model = generator uses the model's priors. Misspecified = shop share 30% (model assumes 15%) and dual-meter rate x1.8.
- H2: first 300 firms per scenario (runtime); all three query orders judged by the candidate's own interval.

## 2. Generator validation (prereg rule: KS p > 0.05 or Wasserstein <= 0.1 against real marginals)
| Check | Result | Status |
|---|---|---|
| V1 diesel prices vs real CY 2022-2025 (independent years) | KS D = 0.43, p = 2e-29 | FAIL (generator uses 2025 prices only; 2022 price spike absent) |
| V1b same vs 2025 source | KS p = 1.0 | circular, sanity only |
| V2 bill seasonality vs national demand shape | W = 0.003 | pass, proxy only (national, not firm-level) |
| V3 mean turnover vs SBS | +1% to +3% | calibration target, not independent |
| V4 energy and fuel per firm | no real reference exists | UNVALIDATED |
Eurostat SBS publishes only sector totals, so a KS test of firm-level turnover or energy is impossible. No public firm-level energy data for CY micro firms exists. The generator cannot pass the prereg rule without real documents.

## 3. Results
| Scenario | Cov. candidate | Cov. ablation | Cov. B2 | Half-width cand. / abl. / B2 | B1 median error |
|---|---|---|---|---|---|
| in-model, 0% missing | 0.918 [0.899-0.934] | 0.833 | 0.935 | 0.24 / 0.15 / 0.30 | 1.7% |
| in-model, 25% | 0.919 | 0.848 | 0.953 | 0.25 / 0.16 / 0.35 | 2.7% |
| in-model, 50% | 0.919 | 0.856 | 0.976 | 0.25 / 0.17 / 0.45 | 4.1% |
| misspec., 0% | 0.877 [0.855-0.897] | 0.720 | 0.883 | 0.24 / 0.15 / 0.27 | 4.2% |
| misspec., 25% | 0.862 [0.839-0.883] | 0.731 | 0.912 | 0.24 / 0.15 / 0.34 | 5.1% |
| misspec., 50% | 0.882 | 0.758 | 0.942 | 0.25 / 0.17 / 0.44 | 6.1% |

H2 (mean questions to reach half-width <= 15%):
| Missing | EIG | GSA order | Checklist | Reduction vs GSA | vs checklist |
|---|---|---|---|---|---|
| 0% | 1.07 | 3.34 | 1.18 | 68% | 8.8% (FAIL) |
| 25% | 1.16 | 4.52 | 2.76 | 74% | 58% |
| 50% | 1.28 | 5.89 | 4.15 | 78% | 69% |

## 4. Critical reading (no optimism)
1. In-model H1 is expected by construction: the model knows the generator's priors. Only the misspecified run is informative. There, coverage (0.86-0.88) sits just inside the 0.85 line; the 25% case's 95% CI reaches 0.839.
2. The prereg also expected B2 coverage outside [0.85, 0.95]. At 0% missing, B2 is inside (0.935), and B2 stays reasonably calibrated at 0.88-0.94 when misspecified. B2's weakness is width (up to 0.45), not coverage.
3. The naive point estimate B1 has a median error of only 1.7-6.1%. In this synthetic world, electricity (well documented) dominates the total. The mix-ups matter for a minority of firms (dual meter, shop spend). That minority is set by assumed rates with no real data behind them.
4. The H2 win is shallow. EIG needs about 1 question (usually "one meter or two?"). The GSA order loses mainly because a continuous model cannot see the meter question at all. That is true by design, not a measured discovery. Against a sensible checklist with complete bills, EIG gives almost no gain.
5. The ablation is fair (same mean and variance), and it under-covers in every scenario. This is the one robust signal: when mix-ups exist, a unimodal error model gives intervals that are too narrow. The size of the effect depends on the assumed mix-up rates.
6. Deviation from prereg: "information gain" was approximated by the expected reduction in posterior variance, not Shannon entropy. The H2 sample was 300 firms, not 1,000. Both are logged here; neither changed the thresholds.

## 5. Status of I-07
- The mixture half (calibrated intervals under document mix-ups) has a first synthetic signal (H1, H3).
- The "ask the best next question" half failed H2 and is not supported.
- Nothing here counts as evidence to an evaluator until the rates (dual meter, shop spend, fuel mix) and ground truth come from real documents.

## 6. What would change the verdict
1. 3-5 pilot SMEs' real documents: measure real mix-up rates, then re-run the misspecified scenario with them.
2. Replace the variance-based question score with true entropy, and add a stronger baseline (greedy variance-share on a model that includes the meter question).
3. Check the emission factors and the Ciroth factors against the original sources.
