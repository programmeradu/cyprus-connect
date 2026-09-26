"""Fetch ~500 public, labelled sample documents (receipts, invoices, forms) for OCR training/testing.
Sources (Hugging Face datasets-server): CORD-v2 (CC-BY-4.0), katanaml invoices-donut-data-v1 (MIT), FUNSD (research use)."""
import json, os, sys, time, urllib.request, urllib.parse
OUT = os.path.join(os.path.dirname(__file__), "samples")
PLAN = [("naver-clova-ix/cord-v2","receipt",[("train",150),("test",50)],"ground_truth"),
        ("katanaml-org/invoices-donut-data-v1","invoice",[("train",150),("test",50)],"ground_truth"),
        ("nielsr/funsd","form",[("train",50),("test",50)],None)]
def get(url):
    for i in range(4):
        try: return urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"vuneli-research"}),timeout=60).read()
        except Exception as e: time.sleep(2*(i+1)); err=e
    raise err
manifest=[]
for ds,kind,splits,gt in PLAN:
    for split,n in splits:
        d=os.path.join(OUT,kind,split); os.makedirs(d,exist_ok=True); off=0
        while off<n:
            q=urllib.parse.urlencode({"dataset":ds,"config":"default","split":split,"offset":off,"length":min(50,n-off)})
            rows=json.loads(get("https://datasets-server.huggingface.co/rows?"+q))["rows"]
            if not rows: break
            for r in rows:
                row=r["row"]; idx=r["row_idx"]; name=f"{kind}_{split}_{idx:04d}"
                img=row["image"]["src"]; open(os.path.join(d,name+".jpg"),"wb").write(get(img))
                label={k:v for k,v in row.items() if k!="image"}
                if gt and isinstance(label.get(gt),str):
                    try: label[gt]=json.loads(label[gt])
                    except Exception: pass
                json.dump(label,open(os.path.join(d,name+".json"),"w"),ensure_ascii=False)
                manifest.append({"file":f"{kind}/{split}/{name}.jpg","type":kind,"split":split,"source":ds,"row":idx})
            off+=len(rows); print(ds,split,off,flush=True)
json.dump(manifest,open(os.path.join(OUT,"manifest.json"),"w"),indent=1)
print("total",len(manifest))
