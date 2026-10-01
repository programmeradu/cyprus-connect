# Proposal: Docling for bill reading

Status: proposal only. Nothing is built. Decision needed from the founder.
Date: 2026-10-01

## Problem
EAC and Water Board bills are read today by sending the PDF or photo to Gemini through the AI gateway, then checking the result in code (kWh/m³ present, period valid, masked account numbers dropped, wrong bill type refused). That works on the samples we have (2009 EAC, Nicosia Water). It has three weaknesses:

1. Every bill costs an AI call, and the answer can vary between runs.
2. Tables with several meters or tariff blocks are where the model is most likely to merge or skip rows.
3. We cannot show *where on the page* a figure came from, which matters for an auditor.

## What Docling is
Docling (IBM Research, MIT licence, github.com/docling-project/docling) turns PDFs and scans into structured documents: text blocks, tables with rows and cells, reading order and the page position of each element. Its table model (TableFormer) is built for exactly the multi-row tariff tables on utility bills. It runs offline. No document leaves our infrastructure.

## Why it cannot run where the app runs
The app runs on Cloudflare Workers. Docling is Python with PyTorch models (hundreds of MB), needs several GB of memory, and takes seconds per page on CPU. Workers cannot run Python ML packages, native binaries or anything that size. It needs its own small service.

## Options

| Option | Monthly cost (est.) | Effort | Notes |
|---|---|---|---|
| A. Keep Gemini only (today) | AI usage per bill | none | Simplest. No page positions. |
| B. Cloudflare Containers running `docling-serve` | low, pay per use; cold start ~10-30 s | 2-3 days | Stays inside Cloudflare. Containers is newer; check limits for a ~2-4 GB image. |
| C. Small VM (e.g. Hetzner CX32, EU) running `docling-serve` | ~€8-15 fixed | 2-3 days + upkeep | Always warm, EU data residency, we patch it. |
| D. Hybrid: Docling for layout + tables, Gemini only to label fields | B or C + fewer AI tokens | +1 day on top of B/C | Best accuracy and gives page positions for each figure. |

## Recommendation
Do not build yet. First measure:

1. Collect 30 real recent bills (EAC, Water Board, at least 5 with several meters). Today we have 2 old samples, which is not enough to judge.
2. Run both readers offline on the same bills and score kWh, m³, period and amount against hand-checked values.
3. Build option D on B (or C if Containers limits are a problem) **only if** Docling+Gemini is clearly more accurate (at least 5 points better on field accuracy, or fixes multi-meter bills the current reader gets wrong).

Kill criterion: if the current reader already gets ≥ 97% of fields right on the 30 bills, keep option A and spend the effort elsewhere.

## If built: shape
- `docling-serve` behind a private URL with a shared secret; the bill routes call it first, fall back to the current reader when it is down (bills never stop being read).
- Store each figure's page and box with the bill, so the evidence view can highlight where a number came from.
- Same checks as today after reading; the reader is replaced, not the rules.

## What the founder needs to do
- Decide whether to run the measurement (needs ~30 real bills from pilot businesses, with permission).
- Choose B or C if the measurement passes.
