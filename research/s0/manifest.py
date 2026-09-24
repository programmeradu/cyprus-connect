"""S0 provenance: add or verify SHA-256 entries for files in data/raw/.
usage: manifest.py add <file> <source_url>   |   manifest.py verify"""
import hashlib, json, sys, pathlib, datetime
RAW = pathlib.Path(__file__).resolve().parents[1]/"data/raw"; M = RAW/"manifest.json"
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
m = json.loads(M.read_text()) if M.exists() else {}
if sys.argv[1] == "add":
    p = RAW/sys.argv[2]
    m[p.name] = {"sha256": sha(p), "source_url": sys.argv[3], "bytes": p.stat().st_size,
                 "retrieved_utc": datetime.datetime.utcnow().isoformat(timespec="seconds")+"Z"}
    M.write_text(json.dumps(m, indent=2)); print("added", p.name)
else:
    bad = [k for k,v in m.items() if sha(RAW/k) != v["sha256"]]
    missing = [p.name for p in RAW.iterdir() if p.name not in m and p.name != "manifest.json"]
    print("changed:", bad, "unlisted:", missing); sys.exit(1 if bad or missing else 0)
