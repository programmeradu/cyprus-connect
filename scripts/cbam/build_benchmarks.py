"""
Build src/data/cbam/benchmarks-2026.json from Commission Implementing
Regulation (EU) 2025/2620, Annex point 5 (CBAM benchmarks per CN code).

Column A (BMg*) is used with actual data, column B (BMg) with default values.
Each cell may hold several values tagged with a production route letter
(A-L, see the regulation) and/or a period: (1) = production years 2026-27,
(2) = 2028-30.

Usage: python scripts/cbam/build_benchmarks.py r2620.html
"""
import hashlib, json, re, sys
from bs4 import BeautifulSoup

SRC = sys.argv[1]
OUT = "src/data/cbam/benchmarks-2026.json"
raw = open(SRC, encoding="utf-8").read()
soup = BeautifulSoup(raw, "lxml")
cells = lambda tr: [re.sub(r"\\s+", " ", td.get_text(" ")).strip() for td in tr.find_all(["td", "th"], recursive=False)]
TOKEN = re.compile(r"(\\d+,\\d+)\\s*((?:\\([A-L12]\\))*)")

def parse(cell: str):
    out = []
    for m in TOKEN.finditer(cell):
        tags = re.findall(r"\\(([A-L12])\\)", m.group(2))
        route = next((t for t in tags if t.isalpha()), None)
        period = next((int(t) for t in tags if t.isdigit()), None)
        out.append([float(m.group(1).replace(",", ".")), route, period])
    return out

table = None
for t in soup.find_all("table"):
    rows = t.find_all("tr")
    if rows and cells(rows[0])[:1] == ["CN code"] and len(rows) > 100:
        table = t
assert table is not None, "benchmark table not found"
bm = {}
for r in table.find_all("tr"):
    c = cells(r)
    if len(c) < 4 or not re.match(r"\\d", c[0]):
        continue
    code = re.sub(r"\\D", "", c[0])
    a, b = parse(c[2]), parse(c[3])
    if not b:
        continue
    bm[code] = {"a": a, "b": b}
assert len(bm) > 400, len(bm)
json.dump({
    "source": {
        "regulation": "Commission Implementing Regulation (EU) 2025/2620, Annex point 5",
        "url": "https://eur-lex.europa.eu/eli/reg_impl/2025/2620/oj",
        "sourceSha256": hashlib.sha256(raw.encode()).hexdigest(),
        "note": "Values in tCO2e per tonne. Entries: [value, route letter or null, period 1=2026-27 / 2=2028-30 or null].",
    },
    "benchmarks": bm,
}, open(OUT, "w"), separators=(",", ":"))
print(f"{len(bm)} CN codes -> {OUT}")
