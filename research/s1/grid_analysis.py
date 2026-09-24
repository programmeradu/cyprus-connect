"""S1.5a  Cyprus grid: monthly fuel mix vs flat annual factor.
Data: Eurostat nrg_cb_pem (monthly net generation by fuel, CY, GWh).
Question: how much does a flat annual grid factor distort an SME's
Scope 2 figure, by load profile?  Deterministic, no randomness.
"""
import json, csv, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
d = json.load(open(ROOT/"data/raw/eurostat_nrg_cb_pem_CY.json"))
siec = d["dimension"]["siec"]["category"]["index"]; tim = d["dimension"]["time"]["category"]["index"]
nT = len(tim); val = d["value"]
def g(s, t):
    v = val.get(str(siec[s]*nT + tim[t])); return None if v is None else float(v)
# Generation-side emission factors, kg CO2 / kWh generated (ASSUMPTIONS, varied in sensitivity)
EF = {"oil": (0.70, 0.80, 0.90), "gas": (0.35, 0.40, 0.45), "other_cf": (0.0, 0.0, 0.0)}
rows = []
for t in sorted(tim):
    tot, oil, gas, sol, wind = (g(s,t) for s in ("TOTAL","O4000XBIO","G3000","RA400","RA300"))
    if not tot: continue
    rows.append(dict(month=t, total=tot, oil=oil or 0, gas=gas or 0, solar=sol or 0, wind=wind or 0))
def factor(r, k):
    return (r["oil"]*EF["oil"][k] + r["gas"]*EF["gas"][k]) / r["total"]
for r in rows:
    r["ef_mid"] = factor(r,1); r["ef_lo"] = factor(r,0); r["ef_hi"] = factor(r,2)
    r["res_share"] = (r["solar"]+r["wind"])/r["total"]
out = ROOT/"data/processed/cy_monthly_grid_factor.csv"
with open(out,"w",newline="") as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
# Load profiles (monthly weights, Jan..Dec). ASSUMED shapes, documented in report.
P = {
 "flat_office":      [1]*12,
 "summer_hotel":     [0.3,0.3,0.5,0.8,1.2,1.6,2.0,2.0,1.6,1.0,0.4,0.3],
 "winter_heating":   [1.6,1.5,1.2,0.9,0.7,0.8,0.9,0.9,0.7,0.8,1.2,1.6],
 "cooling_retail":   [0.7,0.7,0.8,0.9,1.1,1.4,1.6,1.6,1.3,1.0,0.8,0.7],
}
res = []
years = sorted({r["month"][:4] for r in rows})
for y in years:
    yr = [r for r in rows if r["month"].startswith(y)]
    if len(yr) < 12: continue
    flat = sum(r["oil"]*EF["oil"][1]+r["gas"]*EF["gas"][1] for r in yr)/sum(r["total"] for r in yr)
    for name, wts in P.items():
        kwh = [w*1000 for w in wts]
        true = sum(k*r["ef_mid"] for k, r in zip(kwh, yr))
        est = sum(kwh)*flat
        res.append(dict(year=y, profile=name, true_t=round(true/1000,3), flat_t=round(est/1000,3),
                        error_pct=round((est-true)/true*100,2)))
    res.append(dict(year=y, profile="_annual_flat_factor", true_t=round(flat,4), flat_t="", error_pct=""))
with open(ROOT/"data/processed/cy_profile_distortion.csv","w",newline="") as f:
    w=csv.DictWriter(f,fieldnames=list(res[0])); w.writeheader(); w.writerows(res)
efs=[r["ef_mid"] for r in rows]
print("months",len(rows), rows[0]["month"], rows[-1]["month"])
print("monthly EF mid: min %.3f max %.3f"%(min(efs),max(efs)))
print("max RES share %.1f%%"%(100*max(r["res_share"] for r in rows)))
for r in res: print(r)
