# S4 Results — I-14 sensitivity-bounded coverage backtest (E03)

Date: 2026-09-24. Run ID: S4-E03-14. Prereg: research/prereg/I-14.md (sha256 191b64e25c93222f7d007dd59aa4804552a4cfa8b32844a26870dc9e036fb01e, locked before code). Code: research/experiments/e03_i14_backtest/run.py (sha256 7b3e1df3658bf2f87e2caadab95d73cfbec39c5c44818b2f34edf16898ca7621). Seed 20260924, 2,000 runs per cell. Synthetic only.

## Verdicts
| H | Rule | Result | Verdict |
|---|---|---|---|
| H14-1 size | false RED <= 5% at c=0.90, G_true in [1/2,2] | 0.0% RED (96.7% AMBER) | PASS (trivially) |
| H14-2 power | RED >= 80% at c=0.75, n=150, G=2 | 20.4% RED | **FAIL** |
| H14-3 naive false green | >= 30% at c=0.75, G_true=2 | 3.1% GREEN | **FAIL** |

## Why it failed (structural, not tuning)
- The identified set does not shrink with n. Under a G=2 odds bound, reporter coverage of 0.75-truth firms can look anywhere from 0.60 to 0.86. The upper end of the c-set sits above 0.85 for most runs no matter how many firms report. Power at G=2: 0.22 (n=150), 0.27 (300), 0.33 (600). At G=1.5: 0.38 → 0.55 at n=1,000. It plateaus below 80%.
- n=1,000 at G=2 (0.09) is an artefact: target n equals N, reporting probabilities clip at 1. Ignore that cell.
- H14-1 "passes" only because the test almost never says anything: 97% AMBER. A test that is always amber has no value for a bank.
- H14-3 fails because with n=150 even the naive exact binomial interval rarely clears 0.85 at the lower end. The worry "naive tests give false comfort" is not reproduced in this setup.
- Power curve at G=2, n=150: RED 0.71 at c=0.60, 0.54 at 0.65, 0.37 at 0.70. The test catches only badly broken intervals.
- Noisy truth (10% in/out flips) moves c=0.75 RED to 0.35 — misclassification shifts coverage down, so noise here inflates RED; it is a bias, not help.

## Kill decision (per prereg kill rule)
H14-2 failed at G=2 and 80% power is not reached by n=1,000 at G=1.5 or G=2. **I-14 is dead on power grounds at SME scale** in this form (Manski-style odds bound, binary coverage).

## What could revive it (would be a new idea, new prereg — not a rescue of I-14)
- Point identification from an instrument for reporting (e.g. a mandated-disclosure threshold that forces some firms to report regardless of their numbers). Cyprus has none today.
- Using the size of misses, not just in/out, with bounds on the outcome range (tighter Horowitz–Manski bounds).
Both are logged as open-weak. Neither is started.

## Honest status of the programme
Alive: I-07 + I-13 (calibrated, shrinking per-firm intervals; synthetic only). Dead: I-14. The frontier search has not produced a second strong candidate.
