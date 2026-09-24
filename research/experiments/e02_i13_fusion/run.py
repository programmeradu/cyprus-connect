"""E02: I-13 hierarchical fusion of EXIOBASE sector prior with sparse SME documents.
Pre-registration: research/prereg/I-13.md (sha256 c5cf15f8...). Synthetic ground truth only.
Run: /path/venv/bin/python run.py  -> results.json
"""
import json, os, sys, time
from pathlib import Path
import numpy as np, pandas as pd
os.environ.setdefault("XLA_FLAGS", "--xla_force_host_platform_device_count=2")
import jax, jax.numpy as jnp
import numpyro, numpyro.distributions as dist
from numpyro.infer import MCMC, NUTS
from sklearn.ensemble import GradientBoostingRegressor
from mapie.regression import SplitConformalRegressor

numpyro.set_host_device_count(2)
SEED = 20260924
R = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
PRI = pd.read_csv(R / "data/processed/i13_cy_sector_priors.csv")
SECT = list(PRI.group); S = len(SECT)
PROXY = PRI.total_t_per_meur.values            # t CO2e per M EUR
ESH = np.clip(PRI.elec_share.values, 0.03, 0.97)
P_ELEC, P_FUEL = 6, 12                          # bi-monthly EAC bills, monthly fuel
KAPPA = 20.0

# ---- turnover calibration (Eurostat SBS CY, size 0-9, 2023) ----
sbs = json.load(open(R / "data/raw/eurostat_sbs_sc_ovw_CY_micro.json"))
def sbs_get(ind, n, t="2023"):
    ids, size, d = sbs["id"], sbs["size"], sbs["dimension"]; flat = 0
    for k, sz in zip(ids, size):
        v = {"indic_sbs": ind, "nace_r2": n, "time": t}.get(k)
        pos = 0 if v is None else d[k]["category"]["index"][v]
        flat = flat * sz + pos
    return sbs["value"].get(str(flat))
NACE = {"accommodation_food": "I", "retail": "G47", "wholesale": "G46", "motor_trade_fuel": "G45",
        "construction": "F", "food_manufacturing": "C10", "land_transport": "H49", "business_services": "M"}
TURN, WEIGHT, SBS_USED = [], [], {}
for s in SECT:
    code = NACE[s]
    tur, ent = sbs_get("NETTUR_MEUR", code), sbs_get("ENT_NR", code)
    if tur is None or ent is None:
        code = code[0]; tur, ent = sbs_get("NETTUR_MEUR", code), sbs_get("ENT_NR", code)
    SBS_USED[s] = dict(nace=code, nettur_meur=tur, ent_nr=ent)
    TURN.append(tur * 1e6 / ent); WEIGHT.append(ent)
TURN = np.array(TURN); WEIGHT = np.array(WEIGHT, float) / sum(WEIGHT)
TURN_SD = 1.0  # assumed lognormal spread of micro-firm turnover (no per-firm CY data)

def generate(rng, n, misspec=False):
    sd_bias = 0.5 if misspec else 0.3
    bias = rng.normal(0, sd_bias, S)
    sig = rng.uniform(0.45, 0.75, S)
    sec = rng.choice(S, n, p=WEIGHT)
    turn = TURN[sec] * np.exp(rng.normal(-TURN_SD**2 / 2, TURN_SD, n))
    z = rng.standard_t(3, n) / np.sqrt(3) if misspec else rng.normal(0, 1, n)
    eta = np.log(PROXY[sec]) + bias[sec] + sig[sec] * z
    E = turn / 1e6 * np.exp(eta)
    phi = rng.beta(KAPPA * ESH[sec], KAPPA * (1 - ESH[sec]))
    amp = rng.uniform(0, 0.4, n); peak = rng.uniform(0, 1, n)
    return dict(sec=sec, turn=turn, E=E, phi=phi, amp=amp, peak=peak, n=n)

def make_docs(rng, f, k_per_firm, ocr=True):
    """k_per_firm: int array (docs per firm). Returns list of (firm, is_elec, value)."""
    docs = []
    for i in range(f["n"]):
        for _ in range(int(k_per_firm[i])):
            is_e = rng.random() < (0.6 if 0.1 < f["phi"][i] < 0.9 else (1.0 if f["phi"][i] >= 0.9 else 0.0))
            P = P_ELEC if is_e else P_FUEL
            p = rng.integers(P)
            w = (1 + f["amp"][i] * np.cos(2 * np.pi * (p / P - f["peak"][i]))) / P * np.exp(rng.normal(0, 0.1))
            src = f["phi"][i] if is_e else 1 - f["phi"][i]
            v = f["E"][i] * src * w
            if ocr and rng.random() < 0.05:
                v = v * 10 if rng.random() < 0.5 else v * (1 + rng.choice([-0.03, 0.03]))
            docs.append((i, is_e, v))
    return docs

# ---- candidate model ----
def model(sec_d, turn_d, df_firm, df_elec, df_logv, tau_mode="learn"):
    if tau_mode == "learn":
        tau = numpyro.sample("tau", dist.HalfNormal(0.5))
    elif tau_mode == "fixed0":
        tau = 0.01
    else:
        tau = 3.0
    mu = numpyro.sample("mu", dist.Normal(jnp.log(PROXY), tau))
    sigma = numpyro.sample("sigma", dist.HalfNormal(jnp.ones(S)))
    sdoc = numpyro.sample("sdoc", dist.HalfNormal(0.3))
    nd = sec_d.shape[0]
    with numpyro.plate("firms", nd):
        z = numpyro.sample("z", dist.Normal(0, 1))
        phi = numpyro.sample("phi", dist.Beta(KAPPA * ESH[sec_d], KAPPA * (1 - ESH[sec_d])))
    eta = mu[sec_d] + sigma[sec_d] * z
    numpyro.deterministic("eta", eta)
    E = turn_d / 1e6 * jnp.exp(eta)
    src = jnp.where(df_elec, phi[df_firm], 1 - phi[df_firm])
    P = jnp.where(df_elec, P_ELEC, P_FUEL)
    loc = jnp.log(E[df_firm] * src / P)
    numpyro.sample("y", dist.Normal(loc, sdoc), obs=df_logv)

def fit(f, docs, tau_mode, key):
    firms_with = sorted(set(d[0] for d in docs))
    idx = {i: j for j, i in enumerate(firms_with)}
    sec_d = jnp.array(f["sec"][firms_with]); turn_d = jnp.array(f["turn"][firms_with])
    df_firm = jnp.array([idx[d[0]] for d in docs]); df_elec = jnp.array([d[1] for d in docs])
    df_logv = jnp.array([np.log(d[2]) for d in docs])
    mc = MCMC(NUTS(model, target_accept_prob=0.9), num_warmup=500, num_samples=500, num_chains=2, progress_bar=False)
    mc.run(key, sec_d, turn_d, df_firm, df_elec, df_logv, tau_mode)
    s = mc.get_samples()
    rhat = float(np.nanmax(numpyro.diagnostics.summary(mc.get_samples(group_by_chain=True))["mu"]["r_hat"]))
    rng = np.random.default_rng(SEED + 7)
    draws = np.empty((len(s["mu"]), f["n"]))
    for i in range(f["n"]):
        if i in idx:
            draws[:, i] = f["turn"][i] / 1e6 * np.exp(np.asarray(s["eta"][:, idx[i]]))
        else:  # zero-doc firm: posterior predictive from pooled sector parameters
            k = f["sec"][i]
            eta = np.asarray(s["mu"][:, k]) + np.asarray(s["sigma"][:, k]) * rng.normal(size=len(s["mu"]))
            draws[:, i] = f["turn"][i] / 1e6 * np.exp(eta)
    return draws, rhat

def hard_switch(f, docs):
    est = f["turn"] / 1e6 * PROXY[f["sec"]]
    by = {}
    for i, e, v in docs:
        by.setdefault(i, {True: [], False: []})[e].append(v)
    out = est.copy()
    for i, d in by.items():
        prox = est[i]; sh = ESH[f["sec"][i]]
        el = np.mean(d[True]) * P_ELEC if d[True] else prox * sh
        fu = np.mean(d[False]) * P_FUEL if d[False] else prox * (1 - sh)
        out[i] = el + fu
    return out

def features(f, docs):
    X = np.zeros((f["n"], S + 5))
    X[np.arange(f["n"]), f["sec"]] = 1; X[:, S] = np.log(f["turn"])
    ne = np.zeros(f["n"]); nf = np.zeros(f["n"]); se = np.zeros(f["n"]); sf = np.zeros(f["n"])
    for i, e, v in docs:
        if e: ne[i] += 1; se[i] += v
        else: nf[i] += 1; sf[i] += v
    X[:, S + 1] = ne; X[:, S + 2] = nf
    X[:, S + 3] = np.where(ne > 0, np.log(np.maximum(se, 1e-12) / np.maximum(ne, 1) * P_ELEC), 0)
    X[:, S + 4] = np.where(nf > 0, np.log(np.maximum(sf, 1e-12) / np.maximum(nf, 1) * P_FUEL), 0)
    return X

def metrics(true, lo, hi, point, mask):
    t, l, h, p = true[mask], lo[mask], hi[mask], point[mask]
    return dict(n=int(mask.sum()), coverage=float(np.mean((t >= l) & (t <= h))),
                median_rel_halfwidth=float(np.median((h - l) / 2 / p)),
                median_abs_rel_err=float(np.median(np.abs(p - t) / t)))

def drop(rng, docs, rate):
    return [d for d in docs if rng.random() >= rate]

def run_scenario(name, misspec, key):
    rng = np.random.default_rng(SEED + (1 if misspec else 0))
    f = generate(rng, 1000, misspec)
    has = rng.random(1000) < 0.5
    k_main = np.where(has, rng.integers(1, 4, 1000), 0)
    docs_main = make_docs(rng, f, k_main)
    # labelled training set for conformal baseline (same generator, same sector biases)
    rng_tr = np.random.default_rng(SEED + 100 + (1 if misspec else 0))
    ft = generate(np.random.default_rng(SEED + (1 if misspec else 0)), 2000, misspec)  # same biases
    ft = {k: (v[1000:] if isinstance(v, np.ndarray) else v) for k, v in ft.items()}; ft["n"] = 1000
    kt = np.where(rng_tr.random(1000) < 0.5, rng_tr.integers(0, 4, 1000), 0)
    dt = make_docs(rng_tr, ft, kt); Xt = features(ft, dt); yt = np.log(ft["E"])
    scr = SplitConformalRegressor(GradientBoostingRegressor(random_state=SEED), confidence_level=0.9, prefit=False)
    scr.fit(Xt[:600], yt[:600]); scr.conformalize(Xt[600:], yt[600:])

    out = dict(scenario=name, runs={})
    def evaluate(tag, docs, tau_mode="learn"):
        nonlocal key
        key, sk = jax.random.split(key)
        t0 = time.time(); draws, rhat = fit(f, docs, tau_mode, sk)
        lo, hi, med = np.percentile(draws, 5, 0), np.percentile(draws, 95, 0), np.median(draws, 0)
        hs = hard_switch(f, docs)
        pr, iv = scr.predict_interval(features(f, docs))
        blo, bhi = np.exp(iv[:, 0, 0]), np.exp(iv[:, 1, 0]); bpt = np.exp(pr)
        gsd = 2.0; h_lo, h_hi = hs / gsd**1.645, hs * gsd**1.645
        ndoc = np.bincount([d[0] for d in docs], minlength=1000) if docs else np.zeros(1000, int)
        res = dict(rhat_mu_max=rhat, seconds=round(time.time() - t0, 1), groups={})
        for g, m in {"k0_in_portfolio": (ndoc == 0) & ~has, "k0_all": ndoc == 0,
                     "k1_3": (ndoc >= 1) & (ndoc <= 3), "eval_set": ~has}.items():
            if m.sum() == 0: continue
            res["groups"][g] = dict(C=metrics(f["E"], lo, hi, med, m), B1=metrics(f["E"], h_lo, h_hi, hs, m),
                                    B2=metrics(f["E"], blo, bhi, bpt, m))
        out["runs"][tag] = res
        print(name, tag, json.dumps({g: {m: round(v["C"]["coverage"], 3) for m, v in [("C", v)]} for g, v in res["groups"].items()}), flush=True)
        return res

    for rate in (0.0, 0.25, 0.5):
        evaluate(f"main_missing{int(rate*100)}", drop(np.random.default_rng(SEED + 5), docs_main, rate))
    evaluate("A1_tau_fixed0", docs_main, "fixed0")
    evaluate("A2_no_pooling", docs_main, "wide")
    base = [d for d in docs_main if has[d[0]]]
    for k in (1, 2, 3):
        extra = make_docs(np.random.default_rng(SEED + 50 + k), f, np.where(~has, k, 0))
        evaluate(f"eval_set_k{k}", base + extra)
    # clean k=3 (no OCR noise) for reference
    extra = make_docs(np.random.default_rng(SEED + 53), f, np.where(~has, 3, 0), ocr=False)
    evaluate("eval_set_k3_no_ocr", base + extra)
    # validation: only SBS means exist -> calibration target, not validation
    out["validation"] = dict(status="NOT VALIDATED",
        reason="Eurostat SBS gives only totals/means per NACE for CY size 0-9; no per-firm distribution, so KS/Wasserstein cannot be run. Turnover mean is matched by construction.",
        turnover_mean_rel_err={SECT[s]: float(f["turn"][f["sec"] == s].mean() / TURN[s] - 1) for s in range(S)})
    return out

if __name__ == "__main__":
    key = jax.random.PRNGKey(SEED)
    res = dict(prereg="research/prereg/I-13.md sha256:c5cf15f8b0911f7d5b575a0bd9188dd6423c98ef51d7c4e162b19597d8ce9350",
               seed=SEED, sbs_used=SBS_USED, priors=PRI.to_dict("records"), scenarios=[])
    for name, ms in (("in_model", False), ("misspecified", True)):
        key, k = jax.random.split(key)
        res["scenarios"].append(run_scenario(name, ms, k))
        json.dump(res, open(HERE / "results.json", "w"), indent=1)
    print("done")
