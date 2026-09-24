"""EXIOBASE 3.9.6 (2022, ixi) -> Cyprus sector proxy priors for I-13.

Scope 1 = direct GHG (CO2 fossil + CH4*28 + N2O*265, AR5 GWP100) per EUR output.
Scope 2 = CY electricity purchases (M EUR, from CY electricity sectors) per EUR output
          x CY electricity-sector direct GHG per M EUR of electricity output.
Usage: python exiobase_cy_priors.py /path/IOT_2022_ixi.zip
Source: Zenodo 10.5281/zenodo.15689391 (file IOT_2022_ixi.zip).
"""
import sys, hashlib, json
from pathlib import Path
import pandas as pd
import pymrio

R = Path(__file__).resolve().parents[1]
GWP = {"CO2": 1.0, "CH4": 28.0, "N2O": 265.0}
GROUPS = {
    "accommodation_food": ["Hotels and restaurants (55)"],
    "retail": ["Retail trade, except of motor vehicles and motorcycles; repair of personal and household goods (52)"],
    "wholesale": ["Wholesale trade and commission trade, except of motor vehicles and motorcycles (51)"],
    "motor_trade_fuel": ["Sale, maintenance, repair of motor vehicles, motor vehicles parts, motorcycles, motor cycles parts and accessoiries",
                         "Retail sale of automotive fuel"],
    "construction": ["Construction (45)"],
    "food_manufacturing": ["Processing of meat cattle", "Processing of meat pigs", "Processing of meat poultry",
                           "Production of meat products nec", "Processing vegetable oils and fats", "Processing of dairy products",
                           "Processed rice", "Sugar refining", "Processing of Food products nec", "Manufacture of beverages",
                           "Manufacture of fish products"],
    "land_transport": ["Other land transport"],
    "business_services": ["Other business activities (74)", "Computer and related activities (72)", "Real estate activities (70)"],
}

def ghg(F):
    w = pd.Series(0.0, index=F.index)
    for r in F.index:
        s = str(r)
        if "biogenic" in s or "CO2_bio" in s:
            continue
        for g, v in GWP.items():
            if s.startswith(g + " "):
                w[r] = v
    return (F.mul(w, axis=0)).sum()  # kg CO2e per column

def main(zp):
    e = pymrio.parse_exiobase3(zp)
    F = e.air_emissions.F.xs("CY", axis=1, level=0)
    x = e.x.xs("CY", level=0)["indout"]  # M EUR
    G = ghg(F)  # kg
    elec = [s for s in x.index if "electricity" in s.lower()]
    Zcy = e.Z.xs("CY", axis=1, level=0).xs("CY", level=0)
    elec_int = G[[s for s in elec if s.startswith("Production of electricity")]].sum() / x[[s for s in elec if s.startswith("Production of electricity")]].sum()  # kg per M EUR
    rows = []
    for g, secs in GROUPS.items():
        secs = [s for s in secs if s in x.index and x[s] > 0]
        out = x[secs].sum()
        s1 = G[secs].sum() / out / 1000  # t per M EUR
        s2 = Zcy.loc[elec, secs].sum().sum() * elec_int / out / 1000
        rows.append(dict(group=g, sectors=len(secs), output_meur=round(out, 2), scope1_t_per_meur=s1,
                         scope2_t_per_meur=s2, total_t_per_meur=s1 + s2, elec_share=s2 / (s1 + s2)))
    df = pd.DataFrame(rows)
    op = R / "data/processed/i13_cy_sector_priors.csv"
    df.to_csv(op, index=False)
    meta = dict(source="EXIOBASE 3.9.6 IOT_2022_ixi.zip", doi="10.5281/zenodo.15689391",
                zip_sha256=hashlib.sha256(open(zp, "rb").read()).hexdigest(),
                cy_elec_intensity_t_per_meur=elec_int / 1000, gwp="AR5 CO2 1 CH4 28 N2O 265")
    json.dump(meta, open(R / "data/processed/i13_cy_sector_priors.meta.json", "w"), indent=2)
    print(df.to_string()); print(meta)

if __name__ == "__main__":
    main(sys.argv[1])
