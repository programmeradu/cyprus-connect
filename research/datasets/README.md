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

## Benchmark (2026-09-26) — `bun research/datasets/benchmark_extractor.ts /tmp/ocrtxt`
Text read locally with Tesseract (stand-in for the app's Gemini photo reading), then the app's total-picker scored against the correct answers.

| | Text contained true total | Total correct, before fix | Total correct, after fix |
|---|---|---|---|
| Invoices (218) | 96.3% | 0% | 96.3% |
| Receipt photos (193) | 36.3% | 4.1% | 17.6% (~49% of readable ones) |

Fix: EU decimal commas (142,50), thousands separators, gross-after-net, amount-due priority, subtotal/usage exclusion, label on its own line, kWh attached to numbers, account numbers must contain a digit. Receipt photos are limited by text reading quality, not the total-picker.
