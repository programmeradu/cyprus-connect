# OCR sample documents

526 public, labelled documents for training and testing bill/receipt reading. Each image has a matching `.json` with the correct answers.

| Type | Count | Source | Licence | Notes |
|---|---|---|---|---|
| Receipts (photos) | 200 | CORD-v2 (naver-clova-ix) | CC-BY-4.0 | Real Indonesian shop receipts; items, totals, tax |
| Invoices (scans) | 226 | katanaml invoices-donut-data-v1 | MIT | Synthetic invoices; seller, client, dates, line items, totals |
| Forms (scans) | 100 | FUNSD | Non-commercial research | Noisy scanned business forms; words + boxes + labels |

- Re-download: `python3 research/datasets/fetch_samples.py` (~530 MB, ignored by git).
- Index: `samples/manifest.json`.
- Gap: none are Cyprus electricity/water bills or Greek-language documents. Real EAC/water bills are still needed to test those.
- FUNSD is research-only: do not ship it inside the product.
