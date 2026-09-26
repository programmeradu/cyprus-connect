"""Fetch ~500 public, labelled sample documents (receipts, invoices, forms) for OCR training/testing.
Sources (Hugging Face datasets-server): CORD-v2 (CC-BY-4.0), katanaml invoices-donut-data-v1 (MIT), FUNSD (research use)."""
import json, os, sys, time, urllib.request, urllib.parse
OUT = os.path.join(os.path.dirname(__file__), "samples")
PLAN = [("katanaml-org/invoices-donut-data-v1","invoice",[("train",150),("test",50),("validation",50)],"ground_truth"),
        ("nielsr/funsd","form",[("train",50),("test",50)],None)]
def get(url):
    for i in range(4):
        try: return urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"vuneli-research"}),timeout=60).read()
        except Exception as e: time.sleep(2*(i+1)); err=e
    raise err
manifest=[]
# CORD rows API returns 500 (images too large), so read its parquet shards directly.
import io, pandas as pd
CORD="https://huggingface.co/datasets/naver-clova-ix/cord-v2/resolve/refs%2Fconvert%2Fparquet/default/{}/0000.parquet"
for split in ("test","validation"):
    d=os.path.join(OUT,"receipt",split); os.makedirs(d,exist_ok=True)
    df=pd.read_parquet(io.BytesIO(get(CORD.format(split))))
    for idx,row in df.iterrows():
        name=f"receipt_{split}_{idx:04d}"
        open(os.path.join(d,name+".jpg"),"wb").write(row["image"]["bytes"])
        json.dump({"ground_truth":json.loads(row["ground_truth"])},open(os.path.join(d,name+".json"),"w"),ensure_ascii=False)
        manifest.append({"file":f"receipt/{split}/{name}.jpg","type":"receipt","split":split,"source":"naver-clova-ix/cord-v2","row":int(idx)})
    print("cord",split,len(df),flush=True)
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
