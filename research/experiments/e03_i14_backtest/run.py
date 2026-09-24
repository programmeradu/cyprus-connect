"""E03: I-14 sensitivity-bounded coverage backtest. Prereg: research/prereg/I-14.md"""
import json
import numpy as np
from scipy.stats import beta

SEED, N, RUNS, LINE = 20260924, 1000, 2000, 0.85
rng = np.random.default_rng(SEED)


def cp(k, n, a=0.05):
    lo = beta.ppf(a / 2, k, n - k + 1) if k > 0 else 0.0
    hi = beta.ppf(1 - a / 2, k + 1, n - k) if k < n else 1.0
    return lo, hi


def odds(p):
    p = np.clip(p, 1e-9, 1 - 1e-9)
    return p / (1 - p)


def verdict(k, n, G):
    lo, hi = cp(k, n)
    clo = odds(lo) / G; chi = odds(hi) * G
    clo, chi = clo / (1 + clo), chi / (1 + chi)
    return "GREEN" if clo >= LINE else ("RED" if chi < LINE else "AMBER")


def sample(c, g_true, n_target, flip=0.0):
    cov = rng.random(N) < c
    # reporting prob: uncovered firms report at base, covered at base*g (odds approx)
    base = n_target / (N * (c * g_true + (1 - c)))
    p = np.where(cov, base * g_true, base)
    rep = rng.random(N) < np.clip(p, 0, 1)
    obs = cov[rep]
    if flip:
        obs = obs ^ (rng.random(obs.size) < flip)
    return int(obs.sum()), int(obs.size)


def cell(c, g_mode, n_target, G, flip=0.0):
    out = {"GREEN": 0, "AMBER": 0, "RED": 0}
    for _ in range(RUNS):
        g = 2 ** rng.uniform(-1, 1) if g_mode == "unif" else g_mode
        k, n = sample(c, g, n_target, flip)
        out[verdict(k, n, G)] += 1
    return {v: out[v] / RUNS for v in out}


res = {}
res["H14-1"] = cell(0.90, "unif", 150, 2.0)
res["H14-2"] = cell(0.75, "unif", 150, 2.0)
res["H14-3_naive"] = cell(0.75, 2.0, 150, 1.0)
res["verdicts"] = {
    "H14-1": "PASS" if res["H14-1"]["RED"] <= 0.05 else "FAIL",
    "H14-2": "PASS" if res["H14-2"]["RED"] >= 0.80 else "FAIL",
    "H14-3": "PASS" if res["H14-3_naive"]["GREEN"] >= 0.30 else "FAIL",
}
sec = {}
for G in (1.0, 1.5, 2.0, 3.0):
    sec[f"power_c075_n150_G{G}"] = cell(0.75, "unif", 150, G)["RED"]
    sec[f"size_c090_n150_G{G}"] = cell(0.90, "unif", 150, G)["RED"]
for G in (1.5, 2.0):
    for n in (150, 300, 600, 1000):
        sec[f"power_c075_G{G}_n{n}"] = cell(0.75, "unif", n, G)["RED"]
sec["curve_G2_n150"] = {c: cell(c, "unif", 150, 2.0)["RED"] for c in (0.60, 0.65, 0.70, 0.75, 0.80)}
sec["noisy_truth_flip10_c090_G2"] = cell(0.90, "unif", 150, 2.0, flip=0.10)
sec["noisy_truth_flip10_c075_G2"] = cell(0.75, "unif", 150, 2.0, flip=0.10)
res["secondary"] = sec
json.dump(res, open(__file__.replace("run.py", "results.json"), "w"), indent=2, default=str)
print(json.dumps(res, indent=2, default=str))
