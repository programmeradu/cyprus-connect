"""Idea-mining engine: cross A (enablers) x B (pains) x C (distant mechanisms).

Step 1 (deterministic): score all combinations.
  fit      = shared tags between A-B, B-C, A-C (does it connect at all?)
  strange  = C's home field is far from B's sector and from A's field
  keep combinations with fit >= 2, rank by strange*fit, diversify (each B/C used at most 3x).
Step 2 (LLM, optional --llm): for the shortlist, write a one-line concept and flag
  whether it looks like an existing product. Model output is a draft, not evidence.
Outputs: combos_all.csv, shortlist.csv, survivors.json
"""
import json, itertools, csv, sys, os, re, urllib.request
from pathlib import Path

HERE = Path(__file__).parent
L = json.loads((HERE / "lists.json").read_text())

# coarse field families: same family = not strange
FAM = {
 "fintech":"finance","finance":"finance","insurance":"finance","insurtech":"finance","markets":"finance",
 "commodities":"finance","informal-finance":"finance","tax":"gov","govtech":"gov","law":"gov","compliance":"gov",
 "ai":"tech","space":"tech","energy":"infra","water":"infra","realestate":"infra","aviation":"transport",
 "automotive":"transport","logistics":"transport","medicine":"health","health":"health","biology":"nature",
 "games":"play","media":"play","tourism":"consumer","food":"consumer","labour":"consumer","circular":"consumer",
 "agriculture":"nature",
}

def fam(x): return FAM.get(x, x)

rows = []
for a, b, c in itertools.product(L["A"], L["B"], L["C"]):
    ta, tb, tc = set(a["tags"]), set(b["tags"]), set(c["tags"])
    fit = len(ta & tb) + len(tb & tc) + len(ta & tc)
    strange = (fam(c["field"]) != fam(b["sector"])) + (fam(c["field"]) != fam(a["field"])) + (fam(a["field"]) != fam(b["sector"]))
    rows.append(dict(A=a["id"], B=b["id"], C=c["id"], fit=fit, strange=strange, score=fit * strange,
                     text=f'{a["name"]} || {b["name"]} || {c["name"]}'))

with open(HERE / "combos_all.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=rows[0].keys()); w.writeheader(); w.writerows(rows)

cand = sorted([r for r in rows if r["fit"] >= 2 and r["strange"] >= 2], key=lambda r: -r["score"])
use = {}; short = []
for r in cand:
    if use.get(r["B"], 0) >= 3 or use.get(r["C"], 0) >= 3 or use.get(r["A"], 0) >= 4: continue
    for k in ("A", "B", "C"): use[r[k]] = use.get(r[k], 0) + 1
    short.append(r)
    if len(short) >= 45: break

with open(HERE / "shortlist.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=short[0].keys()); w.writeheader(); w.writerows(short)
print(f"total={len(rows)} passing_fit={len(cand)} shortlist={len(short)}")

if "--llm" not in sys.argv: sys.exit()

PROMPT = """You are screening forced idea combinations. For each line (ENABLER || PAIN || BORROWED MECHANISM) write:
id | concept (max 30 words, concrete: who uses it, what disappears for them) | exists (yes/partly/no + closest known product if any) | plausible (1-5) | strange (1-5, how unlike anything in that sector)
Be harsh: mark 'yes' whenever a known company already does it. No hype. One line per id, pipe-separated, no header.

"""
body = PROMPT + "\n".join(f'{i}: {r["text"]}' for i, r in enumerate(short))
req = urllib.request.Request("https://ai.gateway.lovable.dev/v1/responses", method="POST",
    headers={"Authorization": f"Bearer {os.environ['LOVABLE_API_KEY']}", "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch"},
    data=json.dumps({"model": "openai/gpt-6-astra", "input": body, "stream": True, "store": False,
                     "reasoning": {"effort": "medium"}}).encode())
out = []
with urllib.request.urlopen(req, timeout=580) as resp:
    for line in resp:
        line = line.decode().strip()
        if not line.startswith("data:"): continue
        try: ev = json.loads(line[5:])
        except Exception: continue
        if ev.get("type") == "response.output_text.delta": out.append(ev["delta"])
text = "".join(out)
(HERE / "llm_raw.txt").write_text(text)
res = []
for ln in text.splitlines():
    p = [x.strip() for x in ln.split("|")]
    if len(p) < 5 or not re.match(r"^\d+", p[0]): continue
    i = int(re.match(r"\d+", p[0]).group())
    if i >= len(short): continue
    def n(s):
        m = re.search(r"\d", s); return int(m.group()) if m else 0
    res.append({**short[i], "concept": p[1], "exists": p[2], "plausible": n(p[3]), "strange_llm": n(p[4])})
surv = [r for r in res if not r["exists"].lower().startswith("yes") and r["plausible"] >= 3]
surv.sort(key=lambda r: -(r["strange_llm"] * 2 + r["plausible"] + r["strange"]))
(HERE / "survivors.json").write_text(json.dumps({"screened": len(res), "survivors": surv[:20]}, indent=1, ensure_ascii=False))
print(f"screened={len(res)} survivors={len(surv)}")
