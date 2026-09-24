# Research tooling survey + check of the three "category-defining" concepts
Date: 2026-09-24. Source: founder upload (another AI's note) + 10 web searches (logged below).
Rule: tools produce *candidate* ideas. No candidate counts until it passes S2–S5 with recorded evidence.

## 1. Check of the three concepts in the uploaded note

| Concept | Verdict | Evidence |
|---|---|---|
| A. "Stripe for carbon" — embeddable SDK turning receipts/invoices into CO2e | **KILLED as stated.** Exists. | Climatiq sells exactly this: REST engine, invoice-line "Mapping Agent", used inside Xero (climatiq.io/docs/guides/how-do-i/integrate-climatiq-into-my-app; climatiq.io/customers/xero). WBCSD PACT already defines an open carbon-data exchange API, v3.0.3 Nov 2025 (github.com/wbcsd/data-exchange-protocol). "Signed attestation token" = I-10, already killed (Emission Impossible 2026, Cisco US 2025/0117807). |
| B. Continuous belief ingestion + "which receipt helps most" | **Not new — it is I-07 + I-13**, already in our pipeline. | I-13 passed S2 with caveats; I-07 S4: calibration + ablation passed on synthetic data, "best next question" (H2) **failed**. The note's "compress audit risk by 62%" is an invented number. |
| C. One activity graph → VSME XBRL / CBAM XML / DMRID forms | **Engineering, not research.** | EFRAG ships a free MIT-licensed VSME Excel→XBRL converter (github.com/EFRAG-EU/Digital-Template-to-XBRL-Converter). Mapping one schema to many is known technique; no scientific uncertainty (Frascati). Useful product plumbing only. |

Also false in the note: `hyperledger-labs/blockchain-carbon-accounting` is **ARCHIVED** — not a foundation to build on.

Honest summary: the note repeats our own open ideas and one already-killed idea, dressed as new. The "infrastructure layer" framing is right as a *business* shape; the research novelty still has to come from I-07/I-13 (calibrated per-firm emissions from proxy + sparse, ambiguous documents).

## 2. Tools that can actually strengthen the research

### 2a. Idea generation / discovery (produce candidates, not proof)
| Tool | What it gives us | Limits |
|---|---|---|
| Open Coscientist (jataware/open-coscientist, `pip install open-coscientist`) | Open version of Google's AI Co-Scientist: generate → critique → rank → evolve hypotheses; any LLM via LiteLLM | Needs a literature MCP server for grounding; 54 stars, young |
| Microsoft RD-Agent (MIT, ~14k stars) | Automated data/model experiment loop: propose method → code → run → compare | Built for ML/quant tasks; useful for S4 ablation sweeps |
| Sakana AI Scientist-v2 (~7k stars) | Tree-search of experiments + paper draft | ML-only domains; runs LLM-written code — Docker sandbox only; papers ≠ evidence |
| FutureHouse Robin (Apache-2.0; Nature, May 2026) | Literature + analysis agents | Biology-tuned; literature agents need paid Edison credits |
| BLANC (arXiv 2608.26685, Aug 2026) | Patent **white-space** detection (ΔNPMI between topic clusters) — finds combinations "established globally, unexplored locally" | Method paper, recovers only 27–34% of planted gaps; we would re-implement |
| Google patent landscaping (google/patents-public-data) + EPO OPS API + PatentsView PatentSearch API | Systematic patent sets instead of keyword searching; closes our "no claim-level search" gap | BigQuery / EPO keys needed; still not a legal opinion |
| OpenAlex API (free) | Full scholarly graph for literature-based discovery (A–B–C links across fields) | Abstract-level; full texts still gated |

### 2b. Computational bedrock for S4 experiments
| Library | Use |
|---|---|
| PyMC / NumPyro | Proper Bayesian fusion models for I-07/I-13 (replace hand-rolled sampler) |
| simuk (arviz-devs) | Simulation-based calibration — formal check that our intervals are honest; directly tests H1 / H13-1 |
| MAPIE (1.5k stars) | Conformal prediction — distribution-free intervals; a **strong baseline** our method must beat |
| pymrio + EXIOBASE; bamboo (EXIOBASE→Brightway, uncertainty) | Real sector proxy priors for I-13 (Cyprus rows) instead of assumed numbers |
| Brightway2 / bw2calc; MOCA (DLR) | Standard LCA Monte Carlo — the baseline reviewers expect |
| EFRAG VSME taxonomy + converter | Output format only (engineering) |

## 3. What changes in the pipeline
1. S2 upgrade: add BLANC-style white-space scan + EPO OPS claim sets (closes open gap "Espacenet claim search").
2. S1/S2 idea stage: run Open Coscientist grounded on OpenAlex to produce new candidates I-14+. Every output enters `ideas.csv` as "unproven" and goes through the same kill gates.
3. S4 upgrade: rebuild E01 on PyMC; add MAPIE conformal and Brightway MC as baselines; add SBC via simuk; build I-13 priors from EXIOBASE via pymrio.
4. No tool removes the real blocker: **real documents with known true emissions** (3–5 pilot SMEs or one bank).

## 4. Search log (2026-09-24)
1 FutureHouse robin · 2 AI-Scientist-v2 + RD-Agent · 3 literature-based discovery tools · 4 patent white-space tools · 5 brightway/pymrio uncertainty · 6 WBCSD PACT spec · 7 hyperledger carbon status · 8 EFRAG VSME XBRL · 9 MAPIE/PyMC/SBC · 10 Climatiq embedded/Xero.
