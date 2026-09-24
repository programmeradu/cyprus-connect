"""S1-CBAM-01: classify every data field in Annex I Table 2 of Implementing Regulation (EU) 2023/1773
by the evidence that a Cyprus importer holds itself.

Classes:
  I  = importer-held: the importer's own customs declaration (SAD / H1), commercial invoice or registry data.
  S  = supplier-only: exists only at the non-EU installation operator. The importer's own documents
       cannot contain it. Zero primary documentation on the importer side unless the operator sends it.
  S3 = supplier-only, and it needs the operator's own upstream data (precursors, electricity source).
  A  = administrative (IDs, addresses, signatures). Not an evidence problem.

Classification is by group header in Table 2 (rule table below). The rule table is a judgement,
recorded here so that a reviewer can challenge each line.
Input: data/raw/eu_2023_1773_cbam_ir.xhtml (sha256 in manifest). Output: data/processed/s1_cbam_fields.csv
"""
import csv, pathlib, re, warnings
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)
R = pathlib.Path(__file__).resolve().parents[1]
txt = BeautifulSoup((R/"data/raw/eu_2023_1773_cbam_ir.xhtml").read_bytes(), "lxml").get_text("\n")
lines = [l.strip() for l in txt.split("\n") if l.strip()]
start = next(i for i, l in enumerate(lines) if l == "Detailed information requirements in the CBAM report")
end = next(i for i in range(start, len(lines)) if lines[i] == "ANNEX II")

RULES = {  # group header -> class, reason
 "CBAM Report": ("A", "report metadata"),
 "Reporting declarant": ("A", "importer registry data"), "Representative": ("A", "registry data"),
 "Importer": ("A", "registry data"), "Address": ("A", "address"), "Competent authority": ("A", "admin"),
 "Signatures": ("A", "admin"), "Report confirmation": ("A", "admin"),
 "Type of applicable reporting methodology": ("A", "declaration choice"), "Remarks": ("A", "free text"),
 "CBAM goods imported": ("I", "customs declaration line"), "Commodity code": ("I", "SAD box 33 (CN code)"),
 "Commodity details": ("I", "SAD box 31"), "Country of origin": ("I", "SAD box 34"),
 "Imported quantity per customs procedure": ("I", "SAD procedure"), "Procedure": ("I", "SAD box 37"),
 "Inward processing information": ("I", "customs authorisation"), "Area of import": ("I", "customs"),
 "Goods measure (per procedure)": ("I", "SAD net mass"), "Goods measure (inward processing)": ("I", "customs"),
 "Special references for goods": ("I", "customs"), "Goods measure (imported)": ("I", "SAD net mass"),
 "Goods imported total emissions": ("S", "computed from operator-specific embedded emissions"),
 "Supporting documents (for goods)": ("I", "importer attachments"), "Attachments": ("A", "file"),
 "CBAM goods’ emissions": ("S", "operator data"), "The company name of the installation": ("S", "operator identity; invoice often shows trader, not installation"),
 "Contact details": ("S", "operator"), "Installation": ("S", "installation ID, coordinates, UNLOCODE"),
 "Goods measure (produced)": ("S", "operator production data"), "Installation emissions": ("S", "operator MRV data"),
 "Direct embedded emissions": ("S", "operator MRV data"), "Indirect embedded emissions": ("S3", "operator electricity consumption + source of emission factor"),
 "Production method & qualifying parameters": ("S3", "operator process data (route, precursors)"),
 "Direct emissions qualifying parameters": ("S3", "operator process data"), "Indirect emissions qualifying parameters": ("S3", "operator process data"),
 "Supporting documents (for emissions definition)": ("S", "operator verification documents"),
 "Carbon price due": ("S", "origin-country carbon price paid by operator"), "Goods covered under carbon price due": ("S", "operator"),
 "Goods measure (covered)": ("S", "operator"),
}
rows, group, parents = [], None, []
for l in lines[start+1:end]:
    if l in ("(", ")", "*1", "*2") or l.startswith("Note:"): continue
    m = re.match(r"^(-+)\s*(.+)$", l)
    if m or l in RULES:
        group = (m.group(2) if m else l).strip()
        depth = len(m.group(1))//2 if m else 0
        parents = parents[:depth] + [group]
        continue
    g = group if group in RULES else next((p for p in reversed(parents) if p in RULES), None)
    if group == "Address" or group == "Attachments": g = next((p for p in reversed(parents[:-1]) if p in RULES), group)
    cls, why = RULES.get(g, ("?", "unclassified"))
    if group in ("Address", "Attachments"): cls, why = "A", group.lower()
    rows.append({"path": " > ".join(parents), "field": l, "class": cls, "reason": why})
out = R/"data/processed/s1_cbam_fields.csv"
with out.open("w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=rows[0].keys()); w.writeheader(); w.writerows(rows)
from collections import Counter
c = Counter(r["class"] for r in rows); n_ev = c["I"] + c["S"] + c["S3"]
print("fields:", len(rows), dict(c))
print(f"evidence fields (non-admin): {n_ev}; supplier-only S+S3: {c['S']+c['S3']} ({(c['S']+c['S3'])/n_ev:.0%})")
print("unclassified:", [r["field"] for r in rows if r["class"] == "?"])
