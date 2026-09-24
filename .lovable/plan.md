# Vuneli Research and Innovation Pipeline (before any roadmap)

## Honest correction
The thesis in the last document (confidence ranges, evidence ranking) was a hypothesis I wrote from reasoning alone. Nobody tested it, and nobody checked it against prior art. It does not count as research. It goes into the pipeline as one candidate, and it gets no special treatment. If the pipeline kills it, it is dead.

No feature and no roadmap will come until an idea passes every gate below with recorded evidence.

## The pipeline

```text
S0 Infrastructure
S1 Problem mining (measured, not guessed)
S2 Prior-art gate  -> kill anything that already exists
S3 Formal hypotheses + pre-registered pass/fail thresholds
S4 Experiments (computational, reproducible, vs baselines)
S5 Frascati + TRL gate (evidence-scored)
S6 Mapping to existing features + roadmap
```
Every stage writes files to the repo. Every gate decision is logged with its reason, and results that fail are kept.

### S0. Research infrastructure
- A `research/` workspace (Python) holding datasets, experiments, results and a report.
- An experiment registry. Each run records: ID, research question, data version, code version, seed, metric, result and verdict.
- An idea register. Each candidate records: status (open / killed / passed), the gate it reached, and the evidence behind it.
- An R&D ledger: hours and costs per research task (the 10% rule).

### S1. Problem mining: find gaps with data, not opinion
1. **Regulation graph.** Parse the VSME Basic + Comprehensive datapoints, the CBAM reporting fields and the ESRS datapoints I can get into a machine-readable list of required datapoints.
2. **Evidence graph.** For each datapoint, record which evidence a Cyprus micro-SME actually has: bills, invoices, bank lines, customs forms, payroll. Use our existing schema and OCR types as the ground truth for what Vuneli can collect.
3. **Derivability analysis.** Compute, for each datapoint, whether it is: (a) directly observed, (b) derivable by known methods, (c) derivable only with unknown error, or (d) not derivable. Categories (c) and (d) are where research questions live.
4. **Quantify with public data.** Use Eurostat / CYSTAT sector energy and structure data, EAC tariffs and grid factors, and EU emission factors. Measure how much each gap affects a footprint or disclosure, for example the error share per datapoint.
5. **Output:** a ranked list of unsolved problems. Each has a measured size, who suffers from it, and why the known methods fail.

### S2. Prior-art gate
Web search here is not the research. It is the check that stops us calling something new when it already exists.
- A systematic search per problem: patents (Google Patents, Espacenet), papers (arXiv, Semantic Scholar, OpenAlex), and competitor product documentation (Greenly, Normative, Sweep, Watershed, Plan A, Persefoni, Cyprus consultancies).
- A novelty matrix per candidate that scores each existing solution against the candidate's mechanism: exists / partial / absent, with a citation.
- Kill rule: if the core mechanism exists and is published or shipped, the candidate is killed or reframed. The reason is recorded.
- Novelty level recorded: new to Cyprus / new to the EU / new to the world (Oslo levels).

### S3. Formal hypotheses
For each survivor, record:
- the hypothesis as a falsifiable statement
- the null baseline (the best existing method from S2)
- the metric and the pass threshold, fixed **before** the experiment runs
- the datasets
- the failure criterion and what we conclude if it fails

### S4. Experiments
- Computational experiments I can run here, using public data plus synthetic SME populations built from the S1 distributions. The synthetic generator is validated against the real sector statistics first. If validation fails, the synthetic results are not used.
- Every candidate is compared against the S2 baseline, with fixed seeds and error bars.
- Ablations: remove the novel part and measure the drop. No drop means the novel part is not the source of the value, so it is not the innovation.
- Real-data validation stage, used only when pilot SME documents exist with consent. Until then, the maximum claim is TRL 3 (proof of concept).

### S5. Frascati + TRL gate
Score each survivor on the five criteria (novel, creative, uncertain, systematic, reproducible). Each score needs an evidence link from S2–S4, not a sentence. Record the start TRL and the target TRL. Only candidates that pass all five become innovation claims.

### S6. Mapping and roadmap
Only for passed candidates:
- Map each one to the existing surfaces: onboarding, calculator, OCR/documents, reports (VSME/CBAM), copilot and agents, compliance, integrations.
- Decide what the research core is (R&D, logged) and what the engineering wrapper is (not R&D).
- Build the roadmap to Slush from the passed set only. If nothing passes, the Slush pitch is the honest research programme with its measured early results, not an invented claim.

## Order of execution
S0 and S1 first (the problem list with measurements). I report the ranked problems to you before S2. At every gate you see the evidence and the kill decisions before the next stage starts.

## Limits I will state up front
- I can run real computational research: data analysis, modelling, simulation, benchmarks, systematic prior-art review. I cannot run wet-lab or field studies, or interview SMEs myself. Real-data validation needs pilot documents from you.
- Prior-art search is broad but not a legal patent opinion. Before a patent filing, a patent attorney must check it.
- Some regulation texts or datasets may be paywalled or not machine-readable. Each gap gets logged, not hidden.

## Technical details
- `research/` sits outside the app bundle: Python scripts, pinned requirements, `data/raw`, `data/processed`, `experiments/<id>/`, `registry.csv`, `ideas.csv`, `ledger.csv`, `reports/`.
- Public sources: Eurostat (nrg_bal, sbs), CYSTAT, EAC published tariffs, EU/DEFRA emission factors, EFRAG VSME datapoint list, CBAM implementing regulation annexes.
- The app is not touched until S6.
- Separate issue: the automatic preview check fails because it expects a different app framework than this project uses (Next.js on Cloudflare). This is the known platform mismatch from earlier. It does not affect the live site.
