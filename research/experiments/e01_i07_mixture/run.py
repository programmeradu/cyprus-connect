"""E01 / I-07 S4 computational experiment.
Pre-registration: research/prereg/I-07.md (sha256 896e9158..., commit 4b651445...).
Run: python research/experiments/e01_i07_mixture/run.py   (seed fixed, deterministic)
Outputs: results.json + results.md in this folder.

HONEST LIMITS (also in report):
- Synthetic data only. No real SME document set exists yet.
- In-model scenario: the generator and the candidate share the same structure
  and priors, so good H1 calibration there is expected, not a discovery.
  The misspecified scenario (generator priors differ from model priors) is the
  informative test.
- Expected information gain is approximated by expected reduction of posterior
  variance of total Scope 1+2 (deviation from the word "information gain" in
  the prereg; logged in the report).
- Emission factors and Ciroth pedigree factors are typed from memory of
  DEFRA 2024 / Ciroth 2016 and must be checked against originals. They scale
  results; they do not create the discrete-vs-continuous difference.
"""
import json, pathlib, time
import numpy as np, pandas as pd
from scipy import stats

HERE = pathlib.Path(__file__).resolve().parent
R = HERE.parents[1]
SEED = 20260924
N_FIRMS = 1000
S = 4000            # posterior samples per firm (candidate / ablation)
S_MC = 10000        # Baseline 2 Monte Carlo draws (prereg brief)
HALF = 0.15         # H2 target half-width / median

# ---------------------------------------------------------------- real inputs
ob = pd.read_excel(R/"data/raw/eu_weekly_oil_bulletin_history.xlsx", "Prices with taxes", header=None, skiprows=3)
hdr = pd.read_excel(R/"data/raw/eu_weekly_oil_bulletin_history.xlsx", "Prices with taxes", header=None, nrows=1).iloc[0].astype(str).tolist()
col = {h: i for i, h in enumerate(hdr)}
prices = pd.DataFrame({"date": pd.to_datetime(ob[0], errors="coerce"),
                       "petrol": pd.to_numeric(ob[col["CY_price_with_tax_euro95"]], errors="coerce")/1000,
                       "diesel": pd.to_numeric(ob[col["CY_price_with_tax_diesel"]], errors="coerce")/1000}).dropna()
p25 = prices[(prices.date >= "2025-01-01") & (prices.date < "2026-01-01")]
REAL_PRICE = {"diesel": p25.diesel.values, "petrol": p25.petrol.values}

grid = pd.read_csv(R/"data/processed/cy_monthly_grid_factor.csv")
grid["m"] = grid.month.str[5:7].astype(int)
g = grid[grid.month.str[:4].isin(["2021", "2022", "2023", "2024", "2025"])]
monthly = g.groupby("m").total.mean().values            # national CY demand shape (proxy)
SHAPE = monthly.reshape(6, 2).sum(1); SHAPE = SHAPE/SHAPE.sum()   # bimonthly
EF_GRID = float(g[g.month.str[:4] == "2025"].ef_mid.mean())      # kg/kWh, S1 data

sbs = json.load(open(R/"data/raw/eurostat_sbs_sc_ovw_CY_micro.json"))
def sbs_get(ind, n, t="2023"):
    ids, size, d = sbs["id"], sbs["size"], sbs["dimension"]
    flat = 0
    for i, k in enumerate(ids):
        v = {"indic_sbs": ind, "nace_r2": n, "time": t}.get(k)
        flat = flat*size[i] + (d[k]["category"]["index"][v] if v else 0)
    return sbs["value"][str(flat)]
SBS_TURN = {"office": sbs_get("NETTUR_MEUR", "M")*1e6/sbs_get("ENT_NR", "M"),
            "retail_hosp": (sbs_get("NETTUR_MEUR", "G47")+sbs_get("NETTUR_MEUR", "I"))*1e6/(sbs_get("ENT_NR", "G47")+sbs_get("ENT_NR", "I")),
            "light_ind": sbs_get("NETTUR_MEUR", "C")*1e6/sbs_get("ENT_NR", "C")}
SBS_WEIGHT = np.array([sbs_get("ENT_NR", "M"), sbs_get("ENT_NR", "G47")+sbs_get("ENT_NR", "I"), sbs_get("ENT_NR", "C")], float)
SBS_WEIGHT /= SBS_WEIGHT.sum()

# --------------------------------------------------------- assumed parameters
# (UNVALIDATED: no public firm-level energy data for CY micro firms)
EF = {"diesel": 2.66, "petrol": 2.34, "shop": 0.0, "gasoil": 2.76, "lpg": 1.56}   # kg CO2e / L
HEAT_PRICE = {"gasoil": 1.15, "lpg": 0.95}                                          # EUR / L
SECT = ["office", "retail_hosp", "light_ind"]
P = {  # kWh per EUR turnover, litres per EUR turnover, priors
 "office":      dict(kwh_per_eur=0.12, l_per_eur=0.012, p_diesel=0.40, p_dual=0.15, p_heat=0.5, p_lpg=0.3),
 "retail_hosp": dict(kwh_per_eur=0.14, l_per_eur=0.008, p_diesel=0.50, p_dual=0.25, p_heat=0.6, p_lpg=0.5),
 "light_ind":   dict(kwh_per_eur=0.25, l_per_eur=0.025, p_diesel=0.80, p_dual=0.25, p_heat=0.4, p_lpg=0.3)}
P_SHOP_MODEL = 0.15
TURN_SIGMA = 0.9
BILL_NOISE = 0.12

# Ciroth et al. 2016 pedigree uncertainty factors (from memory; verify)
CIR = {"rel": [1.00, 1.54, 1.61, 1.69, 1.69], "com": [1.00, 1.03, 1.04, 1.08, 1.08],
       "tmp": [1.00, 1.03, 1.10, 1.19, 1.29], "geo": [1.00, 1.04, 1.08, 1.11, 1.11],
       "tec": [1.00, 1.18, 1.65, 2.08, 2.80]}
def gsd(scores, ub=1.05):
    s2 = np.log(ub)**2 + sum(np.log(CIR[k][v-1])**2 for k, v in zip(CIR, scores))
    return float(np.exp(np.sqrt(s2)))
GSD_BILL, GSD_IMP, GSD_SPEND = gsd((1,1,1,1,1)), gsd((2,3,1,1,1)), gsd((4,3,2,1,3))

# ------------------------------------------------------------------ generator
def make_firm(rng, sector, p_miss, p_shop_true, dual_boost):
    pr = P[sector]
    mu = np.log(SBS_TURN[sector]) - TURN_SIGMA**2/2          # mean matches SBS
    turn = float(rng.lognormal(mu, TURN_SIGMA))
    kwh = turn*pr["kwh_per_eur"]*rng.lognormal(-0.08, 0.4)
    bills = kwh*SHAPE*rng.lognormal(-BILL_NOISE**2/2, BILL_NOISE, 6)
    miss = rng.random(6) < p_miss
    if miss.all(): miss[rng.integers(6)] = False if p_miss < 1 else True
    dual = rng.random() < min(0.95, pr["p_dual"]*dual_boost)
    f2 = rng.beta(2, 4) if dual else 0.0
    litres = turn*pr["l_per_eur"]*rng.lognormal(-0.1, 0.45)
    k = int(rng.integers(1, 5))
    split = rng.dirichlet(np.ones(k))
    fuel = []
    for j in range(k):
        u = rng.random()
        z = "shop" if u < p_shop_true else ("diesel" if rng.random() < pr["p_diesel"] else "petrol")
        price = float(rng.choice(REAL_PRICE["diesel" if z == "shop" else z]))
        if z == "shop":
            spend = float(litres*split[j]*price*rng.uniform(0.05, 0.4))  # shop basket
        else:
            spend = float(litres*split[j]*price)
        fuel.append(dict(spend=spend, z=z, price=price))
    heat = None
    if rng.random() < pr["p_heat"]:
        z = "lpg" if rng.random() < pr["p_lpg"] else "gasoil"
        lit = turn*0.004*rng.lognormal(-0.1, 0.45)
        pz = HEAT_PRICE[z]*rng.uniform(0.9, 1.1)
        heat = dict(spend=float(lit*pz), z=z, price=pz)
    truth = (bills.sum()*(1+f2))*EF_GRID + sum(f["spend"]/f["price"]*EF[f["z"]] for f in fuel) \
            + (heat["spend"]/heat["price"]*EF[heat["z"]] if heat else 0.0)
    return dict(sector=sector, turn=turn, bills=bills, miss=miss, dual=dual, f2=f2,
                fuel=fuel, heat=heat, truth=truth/1000.0)               # t CO2e

# ------------------------------------------------------------ candidate model
def queries(f):
    q = [("bill", i) for i in range(6) if f["miss"][i]] + [("meter", 0)]
    q += [("fuel", j) for j in range(len(f["fuel"]))]
    if f["heat"]: q.append(("heat", 0))
    return q

def sample(f, known, rng, n=S, discrete=True):
    """Posterior samples of total t CO2e and of each query variable.
    known: set of resolved queries. discrete=False -> H3 ablation (moment-matched lognormals)."""
    pr = P[f["sector"]]; parts = {}
    obs = ~f["miss"]
    for i in range(6):
        if f["miss"][i] and ("bill", i) in known: obs[i] = True
    if obs.any():
        scale = f["bills"][obs].sum()/SHAPE[obs].sum()
        scale_s = scale*rng.lognormal(-(BILL_NOISE**2/obs.sum())/2, BILL_NOISE/np.sqrt(obs.sum()), n)
    else:
        mu = np.log(SBS_TURN[f["sector"]]*pr["kwh_per_eur"])
        scale_s = rng.lognormal(mu - (TURN_SIGMA**2+0.16)/2, np.sqrt(TURN_SIGMA**2+0.16), n)
    main = np.full(n, f["bills"][obs].sum())
    for i in range(6):
        if not obs[i]:
            b = scale_s*SHAPE[i]*rng.lognormal(-BILL_NOISE**2/2, BILL_NOISE, n)
            parts[("bill", i)] = b*EF_GRID/1000; main = main + b
    # meter
    if ("meter", 0) in known:
        f2 = np.full(n, f["f2"]) if f["dual"] else np.zeros(n)
        second = main*f2
    else:
        d = rng.random(n) < pr["p_dual"]; f2 = np.where(d, rng.beta(2, 4, n), 0.0)
        second = main*f2
        if not discrete:
            m, v = second.mean(), second.var()
            second = lognorm_mm(m, v, n, rng)
    parts[("meter", 0)] = second*EF_GRID/1000
    total = (main + second)*EF_GRID/1000
    for j, fr in enumerate(f["fuel"]):
        if ("fuel", j) in known:
            z = np.full(n, fr["z"], dtype=object)
        else:
            u = rng.random(n)
            z = np.where(u < P_SHOP_MODEL, "shop", np.where(rng.random(n) < pr["p_diesel"], "diesel", "petrol"))
        pr_d = rng.choice(REAL_PRICE["diesel"], n); pr_p = rng.choice(REAL_PRICE["petrol"], n)
        e = np.where(z == "diesel", fr["spend"]/pr_d*EF["diesel"],
            np.where(z == "petrol", fr["spend"]/pr_p*EF["petrol"], 0.0))/1000
        if not discrete and ("fuel", j) not in known:
            e = lognorm_mm(e.mean(), e.var(), n, rng)
        parts[("fuel", j)] = e; total = total + e
    if f["heat"]:
        h = f["heat"]
        if ("heat", 0) in known:
            z = np.full(n, h["z"], dtype=object)
        else:
            z = np.where(rng.random(n) < pr["p_lpg"], "lpg", "gasoil")
        pz = np.where(z == "lpg", HEAT_PRICE["lpg"], HEAT_PRICE["gasoil"])*rng.uniform(0.9, 1.1, n)
        e = h["spend"]/pz*np.where(z == "lpg", EF["lpg"], EF["gasoil"])/1000
        if not discrete and ("heat", 0) not in known:
            e = lognorm_mm(e.mean(), e.var(), n, rng)
        parts[("heat", 0)] = e; total = total + e
    return total, parts

def lognorm_mm(m, v, n, rng):
    if m <= 0: return np.zeros(n)
    s2 = np.log(1 + v/m**2)
    return rng.lognormal(np.log(m) - s2/2, np.sqrt(s2), n)

def interval(t):
    lo, med, hi = np.quantile(t, [0.05, 0.5, 0.95]); return lo, med, hi

def exp_resid_var(total, x):
    """Expected posterior variance of total after learning x (linear approx)."""
    vx = x.var()
    if vx <= 0: return total.var()
    c = np.cov(total, x)[0, 1]
    return total.var() - c*c/vx

# ------------------------------------------------------------------ baselines
def baseline1(f):
    obs = ~f["miss"]
    elec = f["bills"][obs].sum()/SHAPE[obs].sum() if obs.any() else SBS_TURN[f["sector"]]*P[f["sector"]]["kwh_per_eur"]
    avgp = np.mean(np.r_[REAL_PRICE["diesel"], REAL_PRICE["petrol"]])
    fuel = sum(fr["spend"] for fr in f["fuel"])/avgp*(EF["diesel"]+EF["petrol"])/2
    heat = f["heat"]["spend"]/HEAT_PRICE["gasoil"]*EF["gasoil"] if f["heat"] else 0
    return (elec*EF_GRID + fuel + heat)/1000, elec, fuel, heat

def baseline2(f, rng):
    _, elec, fuel, heat = baseline1(f)
    obs = ~f["miss"]; nobs = obs.sum()
    el_meas = f["bills"][obs].sum(); el_imp = max(elec - el_meas, 0)
    def ln(m, g, n):
        s = np.log(g); return m*rng.lognormal(-s*s/2, s, n) if m > 0 else np.zeros(n)
    t = (ln(el_meas, GSD_BILL, S_MC) + ln(el_imp, GSD_IMP, S_MC))*EF_GRID/1000 \
        + ln(fuel/1000, GSD_SPEND, S_MC) + ln(heat/1000, GSD_SPEND, S_MC)
    return t

def gsa_order(f):
    """Rank queries by variance share under the pedigree (continuous) model; meter ambiguity invisible."""
    _, elec, fuel, heat = baseline1(f)
    avgp = np.mean(np.r_[REAL_PRICE["diesel"], REAL_PRICE["petrol"]])
    sc = {}
    obs = ~f["miss"]
    per_bill = (elec - f["bills"][obs].sum())/max((~obs).sum(), 1)*EF_GRID/1000
    for q in queries(f):
        if q[0] == "bill": m, gg = per_bill, GSD_IMP
        elif q[0] == "fuel": m, gg = f["fuel"][q[1]]["spend"]/avgp*2.5/1000, GSD_SPEND
        elif q[0] == "heat": m, gg = heat/1000, GSD_SPEND
        else: sc[q] = -1; continue
        s2 = np.log(gg)**2; sc[q] = m*m*(np.exp(s2)-1)
    return sorted(queries(f), key=lambda q: -sc[q])

# ------------------------------------------------------------------- policies
def run_policy(f, policy, rng):
    known = set(); qs = queries(f); fixed = None
    if policy == "checklist": fixed = qs[:]
    if policy == "gsa": fixed = gsa_order(f)
    n = 0
    while True:
        t, parts = sample(f, known, rng, n=2000)
        lo, med, hi = interval(t)
        if (hi-lo)/2 <= HALF*med or len(known) == len(qs): return n, (hi-lo)/2/med
        rem = [q for q in qs if q not in known]
        if fixed is not None:
            q = next(q for q in fixed if q not in known)
        else:
            q = min(rem, key=lambda q: exp_resid_var(t, parts[q]))
        known.add(q); n += 1

# ----------------------------------------------------------------- validation
def validate(firms, rng):
    out = {}
    # V1 KS: synthetic purchase prices vs real CY weekly prices 2022-2025 (independent years)
    syn = np.array([fr["price"] for f in firms for fr in f["fuel"] if fr["z"] == "diesel"])
    real_all = prices[(prices.date >= "2022-01-01") & (prices.date < "2026-01-01")].diesel.values
    ks = stats.ks_2samp(syn, real_all)
    out["V1_fuel_price_KS_vs_2022_2025"] = dict(stat=float(ks.statistic), p=float(ks.pvalue),
        note="synthetic draws come from 2025 prices; test against 2022-2025 is a partial independence check")
    ks25 = stats.ks_2samp(syn, REAL_PRICE["diesel"])
    out["V1b_fuel_price_KS_vs_2025_source"] = dict(stat=float(ks25.statistic), p=float(ks25.pvalue),
        note="same-source check (circular, sanity only)")
    # V2 Wasserstein: normalised bill seasonality vs real national bimonthly shape (proxy)
    shp = np.array([f["bills"]/f["bills"].sum() for f in firms]).mean(0)
    out["V2_seasonality_wasserstein"] = dict(w=float(stats.wasserstein_distance(np.arange(6), np.arange(6), shp, SHAPE)),
        note="national demand shape is a proxy; not firm-level")
    # V3 turnover mean vs SBS (calibration target, not independent)
    out["V3_turnover_mean_rel_err"] = {s: float(np.mean([f["turn"] for f in firms if f["sector"] == s])/SBS_TURN[s]-1) for s in SECT}
    out["V4_energy_per_firm"] = "NO REAL REFERENCE: no public firm-level energy or fuel data for CY micro firms; UNVALIDATED"
    return out

# ----------------------------------------------------------------------- main
def scenario(name, p_miss, p_shop_true, dual_boost, rng, do_h2):
    firms = [make_firm(rng, rng.choice(SECT, p=SBS_WEIGHT), p_miss, p_shop_true, dual_boost) for _ in range(N_FIRMS)]
    cov = {"candidate": [], "ablation": [], "baseline2": []}; ape1 = []; hw = {"candidate": [], "ablation": [], "baseline2": []}
    amb = []
    for f in firms:
        tr = f["truth"]
        t, _ = sample(f, set(), rng); lo, med, hi = interval(t)
        cov["candidate"].append(lo <= tr <= hi); hw["candidate"].append((hi-lo)/2/med)
        ta, _ = sample(f, set(), rng, discrete=False); lo, med, hi = interval(ta)
        cov["ablation"].append(lo <= tr <= hi); hw["ablation"].append((hi-lo)/2/med)
        tb = baseline2(f, rng); lo, med, hi = interval(tb)
        cov["baseline2"].append(lo <= tr <= hi); hw["baseline2"].append((hi-lo)/2/med)
        ape1.append(abs(baseline1(f)[0]-tr)/tr)
        amb.append(True)  # every firm has >=1 fuel record (k>=1) and an unresolved meter question
    res = dict(scenario=name, p_miss=p_miss, p_shop_true=p_shop_true, dual_boost=dual_boost,
               coverage={k: float(np.mean(v)) for k, v in cov.items()},
               median_halfwidth={k: float(np.median(v)) for k, v in hw.items()},
               baseline1_MAPE=float(np.mean(ape1)), baseline1_median_APE=float(np.median(ape1)),
               n_ambiguous=int(sum(amb)))
    # binomial 95% CI on coverage
    res["coverage_CI95"] = {k: [float(x) for x in stats.binomtest(int(sum(v)), len(v)).proportion_ci()] for k, v in cov.items()}
    if do_h2:
        nq = {"eig": [], "gsa": [], "checklist": []}; reached = {k: 0 for k in nq}
        for f in firms:
            for pol in nq:
                n, h = run_policy(f, pol, rng); nq[pol].append(n); reached[pol] += h <= HALF
        res["H2_queries_mean"] = {k: float(np.mean(v)) for k, v in nq.items()}
        res["H2_reached_target"] = {k: v/N_FIRMS for k, v in reached.items()}
        e = np.mean(nq["eig"])
        res["H2_reduction_vs"] = {k: float(1-e/np.mean(nq[k])) if np.mean(nq[k]) > 0 else None for k in ["gsa", "checklist"]}
    return res, firms

if __name__ == "__main__":
    t0 = time.time(); rng = np.random.default_rng(SEED); results = {"seed": SEED, "N": N_FIRMS, "EF_grid": EF_GRID,
        "GSD": dict(bill=GSD_BILL, imputed=GSD_IMP, spend=GSD_SPEND), "SBS_turnover_2023": SBS_TURN, "scenarios": []}
    val = None
    for pm in [0.0, 0.25, 0.5]:
        r, firms = scenario(f"in_model_miss{int(pm*100)}", pm, P_SHOP_MODEL, 1.0, rng, do_h2=True)
        if val is None: val = validate(firms, rng)
        results["scenarios"].append(r); print(r["scenario"], r["coverage"], r.get("H2_reduction_vs"), flush=True)
    for pm in [0.0, 0.25, 0.5]:
        r, _ = scenario(f"misspecified_miss{int(pm*100)}", pm, 0.30, 1.8, rng, do_h2=False)
        results["scenarios"].append(r); print(r["scenario"], r["coverage"], flush=True)
    results["validation"] = val; results["runtime_s"] = round(time.time()-t0, 1)
    (HERE/"results.json").write_text(json.dumps(results, indent=1, default=float))
    print(json.dumps(val, indent=1)); print("runtime", results["runtime_s"])
