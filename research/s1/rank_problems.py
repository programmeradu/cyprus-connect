"""S1.3/S1.6  Derivability summary and ranked open problems.
Weights are JUDGEMENT (documented) and are varied in a sensitivity check."""
import csv, pathlib, itertools
R = pathlib.Path(__file__).resolve().parents[1]
rows = list(csv.DictReader(open(R/"s1/datapoints_classified.csv")))
from collections import Counter
print("class counts:", Counter(r["class"] for r in rows))
q = [r for r in rows if r["quantitative"]=="1"]
print("quantitative:", len(q), Counter(r["class"] for r in q))
# impact weights: carbon figures weigh most (bank/buyer demand), then env, then social
W = {"B3":3,"B6":2,"B7":2,"B4":1,"B9":1,"B10":1}
cls = {"c":2,"d":1}   # c = research-tractable (evidence exists, error unknown); d = no evidence
open_ = [r for r in rows if r["class"] in cls]
def score(r, w=W): return w.get(r["code"],1)*cls[r["class"]]
ranked = sorted(open_, key=score, reverse=True)
with open(R/"data/processed/s1_ranked_problems.csv","w",newline="") as f:
    wr = csv.writer(f); wr.writerow(["rank","code","field","class","score","rationale"])
    for i,r in enumerate(ranked,1): wr.writerow([i,r["code"],r["field"],r["class"],score(r),r["rationale"]])
for i,r in enumerate(ranked,1): print(i, r["code"], r["field"], r["class"], score(r))
# sensitivity: does the top-3 set survive other weightings?
top = {r["field"] for r in ranked[:3]}; stable = 0; n=0
for b3,b6,b7 in itertools.product([2,3,4],[1,2,3],[1,2,3]):
    w = dict(W, B3=b3, B6=b6, B7=b7); n+=1
    t = {r["field"] for r in sorted(open_, key=lambda r: score(r,w), reverse=True)[:3]}
    stable += len(top & t) >= 2
print(f"top-3 stability: {stable}/{n} weightings keep >=2 of the top 3")
