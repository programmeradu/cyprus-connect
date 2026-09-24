# Vuneli Innovation Pathway to Slush 2026

**Document ID:** RES-2026-INNOV-PATH
**Date:** 24 September 2026
**Depends on:** RES-2026-INNOV-056 (the innovation test)
**Style:** ASD-STE100.

---

## 1. The problem with the current pitch

Today Vuneli is "carbon accounting for Cyprus SMEs". An evaluator can name five tools that do this. The localisation is useful, but it is "new to the market", not research. At Slush, this is a me-too pitch.

A web search cannot find our innovation, because a web search only shows what exists. We find innovation by asking a technical question that has no known answer, and then running experiments on it.

## 2. The real gap (the thing nobody solves)

Every carbon tool today gives an SME **one number**, for example "42.7 tCO2e". This number looks exact. It is not. For a micro-SME it comes from 3 bills, a guessed industry average and an LLM. Nobody knows the error. Nobody knows which figures an auditor will reject. Nobody tells the SME which one document would make the figure correct.

Banks, buyers (CSRD value chain) and auditors now need SME data they can trust. SMEs cannot pay a consultant. So the market has a trust gap, not a calculation gap.

## 3. Flagship thesis: uncertainty-native carbon accounting

> **Vuneli is the first carbon engine that tells an SME how sure it is, shows the evidence for every figure, and asks for the one document that reduces the error most.**

New terms we introduce (our vocabulary, our category):

| Term | Meaning |
|---|---|
| **Confidence-scored footprint** | Every figure is a range with a confidence level (for example 38–47 tCO2e, 90%), not a single number. |
| **Evidence value ranking (EVR)** | The system calculates which missing document (fuel receipt, supplier invoice, bill) reduces total uncertainty most, and asks for that one first. |
| **Minimum viable evidence (MVE)** | The smallest set of documents that brings a footprint inside the error band a bank or buyer accepts. |
| **Proof-carrying disclosure** | Each AI-drafted VSME/CBAM figure carries its derivation: source document hash, factor and version, calculation steps. An auditor can replay it. |
| **Review triage** | The AI flags only the figures that probably need a human check, with a measured miss rate. |

Why this passes the test (L5, Frascati):
- **Novel:** no SME carbon tool publishes calibrated uncertainty or evidence ranking.
- **Creative:** applies Bayesian inference and value-of-information methods to SME disclosure.
- **Uncertain:** we do not know the minimum data for a given error band. This is a real open question.
- **Systematic:** hypotheses, baselines, metrics, experiment logs (Section 5).
- **Reproducible:** versioned models, test sets, a published technical report.

It also builds the moat (L38): every Cyprus SME that uploads a document improves the priors. Competitors cannot copy this data fast.

## 4. Research questions (RQ)

| RQ | Question | Metric | Target |
|---|---|---|---|
| RQ1 | From how few documents can we estimate Scope 1+2 of a Cyprus micro-SME within ±15%? | Error vs full-data footprint | ±15% with ≤ 4 documents |
| RQ2 | Does EVR reach the target error band with fewer uploads than a fixed checklist? | Uploads needed | ≥ 40% fewer |
| RQ3 | Are our confidence ranges calibrated? | Coverage of 90% interval | 88–92% |
| RQ4 | Can review triage catch wrong AI figures while flagging few correct ones? | Recall of errors / flag rate | ≥ 95% recall at ≤ 20% flagged |
| RQ5 | How accurate is field extraction on bilingual (EL/EN) Cyprus bills (EAC, fuel)? | Field-level F1 | ≥ 0.95 |

Features that do not serve an RQ are engineering. We still build them, but we do not call them research.

## 5. The research pipeline (without a research centre)

We do not need a paid research centre to do real research. We need a method and records.

```text
Hypothesis -> Dataset -> Baseline -> Model -> Experiment -> Metric -> Log -> Report
```

1. **Datasets.** Public priors: Eurostat and CYSTAT energy by NACE sector, EAC tariff and grid data, EU emission factors. Own data: anonymised pilot SME documents (with consent). Synthetic SMEs generated from the priors, to test RQ1–RQ3 before we have many users.
2. **Baselines.** (a) industry-average spend method, (b) a fixed document checklist, (c) plain LLM extraction with no confidence.
3. **Experiments in the repo.** A `research/` folder with one script per experiment, fixed random seeds, versioned results. Each run writes to an experiment log (date, RQ, data version, result).
4. **R&D ledger.** Tag R&D hours and costs separately from operations from today (10% rule, L3).
5. **Low-cost academic link.** Offer a funded MSc thesis topic (RQ1 or RQ3) to UCY / CUT, or apply to a CYENS or university open call. Cost: near zero. It gives a named research partner (L20) and a letter of intent.
6. **Output.** A short technical report (arXiv or a workshop paper) before the next RIF call. This is the "reproducible" proof.

## 6. Other paths considered

| Path | Verdict |
|---|---|
| B. Cross-framework mapping (one data set answers VSME, CDP, bank forms) | Strong second pillar. Uses the same evidence graph. Add after flagship. |
| C. Cyprus document model | Supports RQ5. Part of the flagship, not a pitch alone. |
| E. Multi-agent orchestration study | Buzzword risk (L49). Keep agents as the delivery method, not the innovation. |
| Marketplace, courses, expert matching | Business model only. Do not lead with these at Slush. |

## 7. Plan to Slush (about 8 weeks)

| Weeks | Goal | Output |
|---|---|---|
| 1 (now) | Lock thesis and terms. Start R&D ledger. | This document. Pitch one-liner. |
| 1–2 | Probabilistic engine v0: priors by NACE sector, Scope 1+2 ranges. | Confidence-scored footprint in the dashboard. |
| 2–3 | Synthetic SME benchmark. Run RQ1 and RQ3. | First measured numbers. |
| 3–4 | EVR: "upload this next" ranking. Run RQ2 against the checklist baseline. | Onboarding asks for the best next document. |
| 4–5 | Proof-carrying disclosure on the VSME draft. Review triage (RQ4). | Every report figure opens its evidence trail. |
| 5–6 | Pilot with 3–5 Cyprus SMEs. Collect letters of intent. | Real-data results. |
| 6–7 | Technical report draft. Thesis offer to UCY/CUT. | Research partner contact. |
| 7–8 | Slush deck and live demo: upload 2 bills, watch the range shrink. | Pitch ready. |

The demo moment for Slush: *"Other tools give you a number. We give you the truth about the number, and the fastest way to make it bankable."*

## 8. Open items
- Confirm Slush 2026 exact dates and any startup application deadline. **[UNVERIFIED]**
- Consent and GDPR terms for using pilot documents in research datasets.
- Choose the first university contact for the thesis offer.
