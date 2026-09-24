"""SBC (simuk, PyMC) on a reduced I-13 model: 3 sectors, 12 firms each, 2 docs per firm, one source.
Pass rule (prereg): chi-square uniformity of rank histograms p > 0.01 for mu, tau, sigma.
"""
import json
from pathlib import Path
import numpy as np, pymc as pm, simuk
from scipy.stats import chisquare

SEED = 20260924
S, NF, ND = 3, 12, 2
prox = np.log(np.array([200.0, 80.0, 20.0]))
sec = np.repeat(np.arange(S), NF)
firm = np.repeat(np.arange(S * NF), ND)
with pm.Model() as m:
    y_obs = pm.Data("y_obs", np.zeros(S * NF * ND))
    tau = pm.HalfNormal("tau", 0.5)
    mu = pm.Normal("mu", prox, tau, shape=S)
    sigma = pm.HalfNormal("sigma", 1.0, shape=S)
    sdoc = pm.HalfNormal("sdoc", 0.3)
    z = pm.Normal("z", 0, 1, shape=S * NF)
    eta = mu[sec] + sigma[sec] * z
    pm.Normal("y", eta[firm] - np.log(6), sdoc, observed=y_obs)

sbc = simuk.SBC(m, num_simulations=100, seed=SEED, progress_bar=False,
                sample_kwargs=dict(draws=199, tune=300, chains=1, target_accept=0.95, progressbar=False))
sbc.run_simulations()
post = sbc.simulations.posterior_sbc if hasattr(sbc.simulations, "posterior_sbc") else sbc.simulations.posterior
out = {}
for v in ("mu", "tau", "sigma"):
    r = np.asarray(post[v]).reshape(-1) if v == "tau" else np.asarray(post[v]).reshape(-1)
    hist, _ = np.histogram(r, bins=10, range=(0, 200))
    p = float(chisquare(hist).pvalue)
    out[v] = dict(hist=hist.tolist(), chi2_p=p, verdict="pass" if p > 0.01 else "fail")
json.dump(out, open(Path(__file__).parent / "sbc_results.json", "w"), indent=1)
print(json.dumps(out))
