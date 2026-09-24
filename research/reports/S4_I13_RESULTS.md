# S4 results: I-13 (E02, hierarchical fusion of sector prior + sparse documents)

Date: 2026-09-24. Pre-registration: research/prereg/I-13.md, SHA-256 c5cf15f8b0911f7d5b575a0bd9188dd6423c98ef51d7c4e162b19597d8ce9350, locked 12:40:07 UTC before any E02 code was written. Git commit hash of the prereg: pending (founder to add to registry row S3-PREREG-13).
Code: experiments/e02_i13_fusion/run.py (SHA-256 52b14cb7...), sbc.py (605eb56d...). Raw output: results.json, run.log. Seed 20260924. N = 1,000 firms per scenario.

**All results are synthetic only. The generator is NOT validated (see Limits). No claim to an evaluator is allowed from these numbers.**

## Setup
- Proxy prior: EXIOBASE 3.9.6, 2022, ixi, Cyprus rows (zip SHA-256 0a14c05e...). Script: s1/exiobase_cy_priors.py. Output: data/processed/i13_cy_sector_priors.csv. Eight NACE groups; Scope 1 + Scope 2 intensity 18 (business services) to 375 (food manufacturing) t CO2e per EUR million. CY electricity sector: 6,386 t per EUR million of electricity output.
- Turnover: lognormal around Eurostat SBS CY size 0-9 mean turnover per NACE (2023).
- Truth: firm intensity = proxy x sector bias (sd 0.3; misspecified 0.5) x firm spread (normal; misspecified Student-t df 3). Documents: bi-monthly electricity bills, monthly fuel slips, seasonal profile, 10% reading noise, 5% OCR errors (half x10, half +/-3%).
- Portfolio: 50% of firms have 1-3 documents; the other 50% (eval set) have none in the main run and 1, 2 or 3 in the H13-2 runs.

## Pre-registered verdicts

| Hypothesis | Threshold | In-model | Misspecified | Verdict |
|---|---|---|---|---|
| H13-1 coverage, 0-doc firms | [0.85, 0.95] | 0.908 | 0.919 | PASS |
| H13-2 half-width shrink 0 -> 3 docs | >= 50%, coverage in band | 1.182 -> 0.386 (-67%), cov 0.921 | 0.954 -> 0.370 (-61%), cov 0.916 | PASS |
| H13-3 error vs hard switch, 1-3 docs | >= 20% lower | 0.130 vs 0.124 (C is 5% WORSE) | 0.119 vs 0.116 (C 3% worse) | **FAIL** |

H13-3 also fails without OCR noise (0.100 vs 0.105, 5% better; threshold 20%). Plain annualisation of bills is already as accurate as the fused point estimate. The "better number than the hard switch" claim is dead.

## Baselines (main run, 0% missing, in-model)

| Group | Model | Coverage | Median rel. half-width | Median abs. rel. error |
|---|---|---|---|---|
| 0 docs | C fusion | 0.908 | 1.18 | 0.362 |
| 0 docs | B1 hard switch (GSD 2.0 band) | 0.942 | 1.40 | 0.399 |
| 0 docs | B2 MAPIE conformal | 0.865 | 1.21 | 0.402 |
| 1-3 docs | C fusion | 0.933 | 0.48 | 0.130 |
| 1-3 docs | B1 hard switch | 0.958 | 1.40 | 0.124 |
| 1-3 docs | B2 MAPIE conformal | 0.919 | 1.21 | 0.338 |

What survives:
1. **Interval that shrinks with evidence.** C's interval narrows from about +/-118% to +/-39-48% as documents arrive, and coverage stays in band. B1 has no evidence-dependent interval (the pedigree band is the same width for every firm, and over-covers at 0.94-0.99). B2 split-conformal gives one fixed width in log space (1.21), 2.5-3x wider than C with documents, and under-covers 0-doc firms in-model (0.865).
2. **No labelled truth needed.** B2 was trained on 1,000 labelled firms from the same generator. C used none. A bank does not have labelled firm-level truth, so this is a practical advantage, not a statistical one.
3. **0-doc point error** is 9% lower (in-model) and 25% lower (misspecified) than the proxy. This is not a pre-registered hypothesis.

## Ablations (prereg kill clause)
- In-model: A1 (trust proxy, no pooling) and A2 (no cross-sector pooling) give almost the same coverage, width and error as C. **The pooling layer is not the source of value in this setting.**
- Misspecified (proxy bias sd 0.5): A1 is worse for 0-doc firms (half-width 1.39 vs 0.95; error 0.318 vs 0.246). A2 is about equal to C. So the value comes from learning the sector bias from other firms' documents, not from sharing strength across sectors.
- Conclusion: the value is "per-firm Bayesian update + sector bias learned from the portfolio". Cross-sector partial pooling adds nothing measurable here.

## Stress tests
| Missing docs | In-model cov (0 / 1-3 docs) | Misspec cov (0 / 1-3 docs) |
|---|---|---|
| 0% | 0.908 / 0.933 | 0.919 / 0.935 |
| 25% | 0.892 / 0.886 (INVALID: r-hat 1.78) | 0.914 / 0.936 |
| 50% | 0.898 / 0.941 | 0.902 / 0.927 |

OCR noise costs width: at 3 docs the half-width is 0.27-0.30 without OCR errors and 0.37-0.41 with them.

## Convergence problems (not hidden)
Two in-model runs did not converge: main_missing25 (r-hat 1.78) and eval_set_k1 (r-hat 2.06). Their numbers are invalid. Probable cause: x10 OCR errors create a second mode for single-document firms. H13-2 uses the k0 and k3 runs (r-hat 1.009 and 1.014), so the verdict stands, but the model needs a robust likelihood (e.g. Student-t or an explicit OCR-error mixture, which is the I-07 layer) before any real use. Any rerun is a new run with a new ID.

## SBC (simuk + PyMC, reduced model)
See sbc_results.json. Status at report time: see registry row S4-E02-SBC.

## Limits
- Generator NOT validated: Eurostat SBS gives only totals per NACE for CY micro firms, so KS/Wasserstein cannot be run. Turnover mean is matched by construction; firm spread (sd 1.0), sector bias sd, firm heterogeneity and document noise are assumptions.
- The truth is generated from the same model family as C in-model. Only the misspecified scenario tests robustness, and only against two chosen deviations.
- EXIOBASE hotel Scope 1 (6.8 t per EUR million) looks low for LPG/diesel-heavy Cyprus hotels; not checked against CYSTAT energy data.
- B2 gets an unfair advantage (labelled data with the same sector biases) and still loses on width with documents.

## Honest summary
Two of three pre-registered hypotheses pass on synthetic data; the point-accuracy hypothesis fails. The surviving claim is narrow: **calibrated per-firm intervals that shrink as sparse documents arrive, without labelled training data, where current practice gives either no interval (hard switch) or a fixed-width one (conformal)**. The pooling layer is not the source of value. Nothing here is evidence for an evaluator until real firms with known emissions are tested.

## Next
1. Founder: add git hash of prereg/I-13.md to S3-PREREG-13.
2. New prereg (I-13-v2 or joint I-07/I-13) with robust document likelihood; rerun the two failed-convergence runs under a new ID.
3. Real ground truth: one Cypriot bank or 3-5 pilot SMEs.
4. CYSTAT energy check of EXIOBASE CY hotel and retail Scope 1.
