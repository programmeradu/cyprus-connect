"""
Build src/data/cbam/default-values-2026.json from the official EU text.

Source: Commission Implementing Regulation (EU) 2026/1740, which replaces
Annexes I and IV of Implementing Regulation (EU) 2025/2621 in full, with
effect from 1 January 2026. Save the EUR-Lex HTML page of OJ L 2026/1740 as
the first argument (EUR-Lex blocks plain downloads; save it from a browser).

Annexes II and III (electricity factors) are NOT included: they are IEA data
under a non-commercial licence.

Usage: python scripts/cbam/build_default_values.py r1740.html
"""
import hashlib, json, re, sys
from bs4 import BeautifulSoup
import pycountry

SRC = sys.argv[1]
OUT = "src/data/cbam/default-values-2026.json"
OVERRIDES = {
    "Korea, Republic of (South Korea)": "KR", "Türkiye": "TR", "Taiwan": "TW", "Kosovo": "XK",
    "Russian Federation": "RU", "Viet Nam": "VN", "Iran": "IR", "Iran, Islamic Republic of": "IR",
    "Moldova, Republic of": "MD", "Congo, Democratic Republic of": "CD", "Congo": "CG",
    "Bolivia": "BO", "Venezuela": "VE", "Laos": "LA", "Syria": "SY", "Tanzania": "TZ",
    "Brunei": "BN", "Côte d'Ivoire": "CI", "Cote d'Ivoire": "CI", "Korea, Democratic People's Republic of (North Korea)": "KP",
    "Palestine": "PS", "Occupied Palestinian Territory": "PS", "Macao": "MO", "Hong Kong": "HK",
}

def iso(name: str) -> str:
    if name in OVERRIDES:
        return OVERRIDES[name]
    try:
        return pycountry.countries.lookup(name).alpha_2
    except LookupError:
        return pycountry.countries.search_fuzzy(name)[0].alpha_2

def num(v: str):
    v = v.strip().replace(" ", "")
    if v in ("", "-", "–", "—"):
        return None
    try:
        return float(v.replace(",", "."))
    except ValueError:
        return None  # "see below": the sub-rows carry the values

raw = open(SRC, encoding="utf-8").read()
soup = BeautifulSoup(raw, "lxml")
cells = lambda tr: [re.sub(r"\s+", " ", td.get_text(" ")).strip() for td in tr.find_all(["td", "th"], recursive=False)]

countries, other, annex_iv = {}, None, None
for t in soup.find_all("table"):
    rows = t.find_all("tr")
    if len(rows) < 4:
        continue
    head = cells(rows[0])[0]
    hdr = " ".join(cells(rows[1]))
    is_iv = head.startswith("Product CN Code")
    if not is_iv and "Default Value (total emissions)" not in hdr:
        continue
    data = {}
    for r in rows[1 if is_iv else 2:]:
        c = cells(r)
        if len(c) < 5:
            continue
        code = re.sub(r"\D", "", c[0])
        if len(code) < 4:
            continue
        if is_iv:
            # Annex IV: code, description, highest default value (total), route
            vals = [num(x) for x in c[2:-1]]
            total = next((v for v in reversed(vals) if v is not None), None)
            if total is None:
                continue
            data[code] = [None, None, total, c[-1].strip("() ") or None]
        else:
            d, i, tot = num(c[2]), num(c[3]), num(c[4])
            if tot is None:
                continue
            route = c[5].strip("() ") if len(c) > 5 else ""
            data[code] = [d, i, tot, route or None]
    if is_iv:
        annex_iv = data
    elif head.lower().startswith("other countries"):
        other = data
    else:
        countries[iso(head)] = {"name": head, "rows": data}

assert other and len(other) > 200, "Other countries table missing"
assert len(countries) > 100, f"only {len(countries)} countries parsed"
out = {
    "source": {
        "regulation": "Commission Implementing Regulation (EU) 2025/2621, Annexes I and IV as replaced by Implementing Regulation (EU) 2026/1740",
        "url": "https://eur-lex.europa.eu/eli/reg_impl/2026/1740/oj",
        "appliesFrom": "2026-01-01",
        "publishedOJ": "2026-07-31",
        "sourceSha256": hashlib.sha256(raw.encode()).hexdigest(),
        "note": "Values in tCO2e per tonne of good. Direct and indirect columns are for information; the total column is what counts. Mark-ups are applied on top (see markups).",
    },
    "markups": {"default": {"2026": 0.10, "2027": 0.20, "2028": 0.30}, "fertilisers": {"2026": 0.01}},
    "routes": {"A": "grey clinker / cement", "B": "white clinker / cement", "C": "Carbon steel, BF/BOF", "D": "Carbon steel, DRI/EAF",
               "E": "Carbon steel, scrap/EAF", "F": "Low alloy steel, BF/BOF", "G": "Low alloy steel, DRI/EAF", "H": "Low alloy steel, scrap/EAF",
               "J": "High alloy steel (EAF)", "K": "Primary aluminium", "L": "Secondary aluminium"},
    "other": other,
    "annexIV": annex_iv or {},
    "countries": dict(sorted(countries.items())),
}
json.dump(out, open(OUT, "w"), separators=(",", ":"))
print(f"{len(countries)} countries, other={len(other)} codes, annexIV={len(annex_iv or {})} codes -> {OUT}")
