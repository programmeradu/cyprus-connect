# Unified Technical Core: I-07 + I-13

Date: 2026-09-24. Status: **specification only. The unified model has not been run.** I-07 and I-13 were each tested separately on synthetic data. Nothing in this document is evidence that the combined model works.

## 1. What each part brings (measured, synthetic only)

| Source | Result carried forward | Result NOT carried forward |
|---|---|---|
| I-07 (S4-E01) | Discrete ambiguity layer: removing it drops 90% coverage by 6.3–8.5 pts in-model, 12.4–15.7 pts misspecified (H3 PASS) | "Ask the best next question" (H2 FAIL, 8.8% saving vs 15% line) |
| I-13 (S4-E02) | Calibrated prior (H13-1 PASS, 0.908/0.919); interval shrinks 61–67% with ≤3 documents at ~0.92 coverage (H13-2 PASS) | "Better point estimate than the hard switch" (H13-3 FAIL, 3–5% worse). Sector pooling adds nothing measurable (ablations equal) |

Known defect carried in: two I-13 runs did not converge (r-hat 1.78, 2.06) because ×10 OCR errors create a second mode. Layer 2 below is the proposed fix; it is untested.

## 2. Model specification

Notation: firm *i*, sector *s(i)*, document *d*, turnover *T_i*.

**Layer 1 — Macro prior with portfolio bias learning (from I-13)**

```text
log E_i  ~ Normal( log(T_i * k_s) + b_s , sigma_s )
b_s      ~ Normal(0, tau_b)        # sector bias of EXIOBASE vs this portfolio
sigma_s  ~ HalfNormal(sigma_0)     # firm-to-firm spread
```

`k_s` = EXIOBASE 3.9.6 Cyprus 2022 intensity (t CO2e per €M output), file `research/data/processed/i13_cy_sector_priors.csv`. `b_s` is learned from other firms' documents, not from labelled truth. Pooling of `b_s` across sectors is optional: the I-13 ablations showed no gain from it.

**Layer 2 — Discrete ambiguity likelihood (from I-07)**

Each document gives an observed amount `y_d`. A latent class `z_d` picks how the amount maps to emissions:

```text
z_d ~ Categorical(pi)      # e.g. {petrol, diesel, shop spend in fuel receipt};
                           #      {single meter, dual meter}; {correct read, x10 OCR error}
y_d | z_d, E_i ~ StudentT(nu, mu(z_d, E_i, period_d), s(z_d))
```

`z_d` is marginalised (summed out), so no hard threshold is applied. The Student-t tail and the explicit OCR-error class replace the Normal likelihood that caused the I-13 non-convergence. Class rates `pi` are assumptions (dual meter 15–25%, shop spend 15%) until real documents exist.

**Output**

Per firm: posterior `[lo90, hi90]` for annual Scope 1+2, recomputed when a document arrives. No labelled ground truth is used to fit it. Reporting rule (from S2-I13): report "interval at PCAF score level X". Never claim that the interval changes the PCAF score; under PCAF the score depends on the data type.

## 3. Claims we may make, and claims we may not

May (synthetic, labelled as such): calibrated per-firm intervals that narrow as sparse documents arrive; the ambiguity layer is what keeps coverage under document mix-ups.

May not: better point accuracy than standard methods; any real-data accuracy; that the unified model converges; that the question-selection works; patentability.

## 4. EXIOBASE hotel Scope 1 check against the official energy balance

Source: Eurostat `nrg_bal_c` (the energy balance CYSTAT supplies to Eurostat), Cyprus 2022, flow FC_OTH_CP_E (commercial and public services), queried 2026-09-24.

| Fuel | ktoe |
|---|---|
| Total | 286.5 |
| Electricity | 195.6 |
| Oil products (excl. biofuels) | 34.7 |
| Natural gas | 0.0 |
| Solar thermal/other RE | 4.0 |

Derived: 34.7 ktoe × 41.868 TJ/ktoe ≈ 1,452 TJ. At 63–74 t CO2/TJ (LPG to gasoil) this is **≈ 91–107 kt CO2** direct combustion for all commercial AND public services.

EXIOBASE direct (Scope 1) for our four service groups = accommodation/food 23.7 kt + retail 18.8 kt + wholesale 35.4 kt + business services 24.5 kt ≈ **102 kt**.

Reading:
- Totals are the same order of magnitude, but they are not like-for-like. The energy balance excludes vehicle fuel (booked under transport) and includes public administration, schools and hospitals. EXIOBASE includes vehicle fuel for these sectors.
- The energy balance has no NACE 55 (accommodation) split. **The hotel figure (6.85 t/€M) cannot be confirmed or refuted from public data.** It stays flagged as unverified.
- Electricity dominance is consistent: in the energy balance, electricity is 68% of services energy. At about 0.6 t/MWh it is about 93% of services CO2. EXIOBASE gives 97% for accommodation. That is plausible, possibly slightly high, because hotels use LPG for kitchens and hot water.

**Adjustment decision: none applied.** A widened prior (sigma_s × 1.5 on accommodation Scope 1) is recorded as a sensitivity case for the next run. The data needed to settle it is CYSTAT hotel energy survey microdata or Cyprus Energy Agency hotel audits. Logged as registry row S1-CYSTAT-13.

## 5. Intellectual property position

- The maths is textbook: Bayesian hierarchical models, finite mixtures, Student-t likelihoods. **This is not patentable as a method**, and no novelty in the maths is claimed.
- What can be protected as a trade secret: the calibrated Cyprus class rates, the document-type likelihood library, the EXIOBASE-to-Cyprus bias estimates learned from real portfolios, and the validation data set. None of these exist yet. All need real documents.
- Recorded as Vuneli's core technical asset *in specification*. Its value to an evaluator depends on one real-data calibration result.

## 6. What would turn this into evidence

1. Pre-register the unified model (H-U1: coverage 85–95% on real firms; H-U2: convergence r-hat < 1.01 with ×10 OCR noise).
2. Run once on synthetic data to fix convergence (not tweaking: one run, pre-registered).
3. Real ground truth: 3–5 pilot SMEs or one bank portfolio slice.

Per the founder's instruction, iterative testing is paused. Items 1–2 are listed so the gap stays visible, not as work in progress.
