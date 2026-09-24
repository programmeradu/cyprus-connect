"""S1-FUEL-01  How wrong is Scope 1 when a Cyprus SME has only EUR card lines for fuel?
Data: EU Weekly Oil Bulletin, CY pump prices with tax (EUR/1000 L).
Seeded simulation. ASSUMPTIONS: 2.31 kg CO2e/L petrol, 2.66 kg CO2e/L diesel
(approx. DEFRA 2024 well-to... combustion only; varied +/-3%); station price spread
around the national weekly average ~ N(0, 2.5%)."""
import pandas as pd, numpy as np, pathlib, json
R = pathlib.Path(__file__).resolve().parents[1]
df = pd.read_excel(R/"data/raw/eu_weekly_oil_bulletin_history.xlsx", "Prices with taxes", header=None, skiprows=3)
hdr = pd.read_excel(R/"data/raw/eu_weekly_oil_bulletin_history.xlsx", "Prices with taxes", header=None, nrows=1).iloc[0].astype(str).tolist()
col = {h:i for i,h in enumerate(hdr)}
p = pd.DataFrame({"date": pd.to_datetime(df[0], errors="coerce"),
                  "petrol": pd.to_numeric(df[col["CY_price_with_tax_euro95"]], errors="coerce")/1000,
                  "diesel": pd.to_numeric(df[col["CY_price_with_tax_diesel"]], errors="coerce")/1000}).dropna()
p = p[(p.date >= "2022-01-01") & (p.date < "2026-01-01")].sort_values("date")
EF = {"petrol": 2.31, "diesel": 2.66}
rng = np.random.default_rng(20260924)
out = {"weekly_price_range": {k: [round(p[k].min(),3), round(p[k].max(),3)] for k in ("petrol","diesel")}}
res = {}
for year in (2022, 2023, 2024, 2025):
    py = p[p.date.dt.year == year].reset_index(drop=True)
    for fuel in ("petrol","diesel"):
        errs = {"annual_avg_price": [], "weekly_price": [], "wrong_fuel_type": []}
        for sme in range(2000):
            n = rng.integers(20, 80)                        # fill-ups per year
            idx = rng.integers(0, len(py), n)
            litres = rng.uniform(25, 70, n)
            price = py[fuel].values[idx] * (1 + rng.normal(0, 0.025, n))
            eur = litres * price
            true = litres.sum() * EF[fuel]
            est_a = (eur / py[fuel].mean()).sum() * EF[fuel]
            est_w = (eur / py[fuel].values[idx]).sum() * EF[fuel]
            other = "diesel" if fuel == "petrol" else "petrol"
            est_x = (eur / py[other].values[idx]).sum() * EF[other]
            for k, e in zip(errs, (est_a, est_w, est_x)): errs[k].append((e - true) / true * 100)
        res[f"{year}_{fuel}"] = {k: {"mean": round(float(np.mean(v)),2), "p5": round(float(np.percentile(v,5)),2),
                                     "p95": round(float(np.percentile(v,95)),2)} for k, v in errs.items()}
out["results"] = res
(R/"data/processed/s1_fuel_eur_to_litres.json").write_text(json.dumps(out, indent=1))
print(json.dumps(out["weekly_price_range"]))
for k,v in res.items(): print(k, v)
