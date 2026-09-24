"""S1-CBAM-02: Cyprus extra-EU imports of CBAM goods (net mass), Eurostat Comext DS-045409.
Importer COUNTS per CN code are NOT published by Comext; this gives mass only.
Output raw: data/raw/comext_cy_cbam_imports.json ; processed: data/processed/s1_cbam_cy_imports.csv"""
import json, urllib.request, pathlib, csv
R = pathlib.Path(__file__).resolve().parents[1]
PRODUCTS = {"2523":"cement","3102":"fertiliser N","3105":"fertiliser mixed","72":"iron and steel","73":"articles of iron/steel","76":"aluminium"}
out, rows = {}, []
for p, name in PRODUCTS.items():
    for y in ("2023","2024","2025"):
        u=("https://ec.europa.eu/eurostat/api/comext/dissemination/statistics/1.0/data/DS-045409?format=JSON&freq=A"
           f"&reporter=CY&partner=EXT_EU27_2020&product={p}&flow=1&indicators=QUANTITY_IN_100KG&time={y}")
        try: d=json.load(urllib.request.urlopen(u, timeout=40))
        except Exception as e: d={"error":str(e)}
        out[f"{p}_{y}"]=d; v=list(d.get("value",{}).values())
        t = round(v[0]/10,1) if v else None
        rows.append({"cn":p,"group":name,"year":y,"extra_eu_net_mass_t":t})
        print(p,name,y,t)
(R/"data/raw/comext_cy_cbam_imports.json").write_text(json.dumps(out))
with (R/"data/processed/s1_cbam_cy_imports.csv").open("w",newline="") as f:
    w=csv.DictWriter(f,fieldnames=rows[0].keys()); w.writeheader(); w.writerows(rows)
