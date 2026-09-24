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
5. **Cyprus data topology and friction.** Cyprus has an isolated island grid with no interconnection. It runs mostly on heavy fuel oil and diesel, and solar output gets curtailed at midday. So:
   - Compare dynamic grid factors (marginal and average, from EAC/TSO monthly or hourly generation mix where published) against flat annual factors (AIB, Ecoinvent, national). Measure the footprint distortion per sector and load profile.
   - Test the ground truth against local document types: bilingual bi-monthly EAC bills, municipal water bills, fuel slips and delivery notes (Petrolina, EKO and others, often handwritten or mixed Greek/English), and customs Single Administrative Documents (SAD) for CBAM. There is no PEPPOL/XML e-invoicing to rely on.
6. **Output:** a ranked list of unsolved problems. Each has a measured size, who suffers from it, and why the known methods fail.

### S2. Prior-art gate
Web search here is not the research. It is the check that stops us calling something new when it already exists.
- A systematic search per problem: patents (Google Patents, Espacenet), papers (arXiv, Semantic Scholar, OpenAlex), and competitor product documentation (Greenly, Normative, Sweep, Watershed, Plan A, Persefoni, Cyprus consultancies).
- Standards bodies and open source are also in scope: EFRAG digital taxonomy (XBRL) work, GHG Protocol guidance revisions, open factor databases and APIs (Climatiq, Carbon Interface), and open LCA tools (Brightway2, Activity-Browser).
- **Negative prior art.** Record why earlier approaches failed or were dropped. Example: spend-based Scope 3 estimates fail SME audits because of inflation and currency mismatch and generic EEIO multipliers. Known failures also mark where the open problems are.
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

**Pre-registration lock:** the hypothesis file is committed to git, and its commit hash is recorded in the registry, before any S4 code runs. If a threshold changes after the lock, that run is invalid and a new pre-registration is needed.

### S4. Experiments
- Computational experiments I can run here, using public data plus synthetic SME populations built from the S1 distributions. The synthetic generator is validated against the real sector statistics first. If validation fails, the synthetic results are not used.
- Every candidate is compared against the S2 baseline, with fixed seeds and error bars.
- Ablations: remove the novel part and measure the drop. No drop means the novel part is not the source of the value, so it is not the innovation.
- **Missing-data and noise stress test (mandatory for every experiment).** Degradation curves at 0%, 25% and 50% missing inputs, plus realistic noise (only 6 months of bills, missing supplier invoices, OCR errors). A method that beats the baseline on average but falls apart with sparse data fails.
- Sensitivity analysis on the key inputs (emission factors, grid factor choice, sector priors).
- Real-data validation stage, used only when pilot SME documents exist with consent. Until then, the maximum claim is TRL 3 (proof of concept).

### S5. Frascati + TRL gate
Score each survivor on the five criteria (novel, creative, uncertain, systematic, reproducible). Each score needs an evidence link from S2–S4, not a sentence. Record the start TRL and the target TRL. Only candidates that pass all five become innovation claims.
- **Technical uncertainty test:** can a competent engineer build the solution with established practice, without new algorithmic or empirical investigation? If yes, it is not R&D (per the OECD Frascati Manual 2015 definition of uncertainty; exact paragraph to be confirmed).
- **Tax and grant compliance:** the ledger and experiment logs follow the Frascati record standard, so they can support RIF and Horizon evaluation, the Startup Visa 10% R&D rule, and the Cyprus R&D super-deduction (reported as 120% of qualifying spend). **[UNVERIFIED: confirm the current rate, the eligibility period and the rules with a Cyprus tax adviser.]**

### S6. Mapping and roadmap (two tracks)
Only for passed candidates:
- Map each one to the existing surfaces: onboarding, calculator, OCR/documents, reports (VSME/CBAM), copilot and agents, compliance, integrations.
- Decide what the research core is (R&D, logged) and what the engineering wrapper is (not R&D).
- **Track A, the research artefact:** a citable technical report or preprint, plus an open benchmark dataset (synthetic or anonymised) that others can use to test their methods.
- **Track B, the commercial moat:** the production build inside Vuneli. Core methods are kept as trade secrets or filed as provisional patent claims. Anything published in Track A is chosen so it does not give away Track B, and publication waits until any filing decision is made.
- Build the roadmap to Slush from the passed set only. If nothing passes, the Slush pitch is the honest research programme with its measured early results, not an invented claim.

### Governance rules (apply to every stage)
1. Pre-registration lock before any experiment runs.
2. Missing-data and noise stress test in every experiment.
3. Cyprus realism: island grid generation mix and bilingual local documents in the ground truth.
4. Frascati audit trail: ledger and logs kept to the standard required for grants and tax relief.
5. Kill decisions and failed results are kept, never deleted.


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

## Refinements (round 2, added 24 Sep 2026)
1. **Citations.** Frascati Manual 2015, Chapter 2 (§2.15, §2.17): uncertainty means the solution is not readily apparent to someone familiar with the common stock of knowledge and techniques in the sector. Cyprus Income Tax Law, Art. 9(1)(d) as amended 2022: 120% deduction of qualifying R&D expense. Both came from the review. Status: to be checked against the original texts before we quote them to an evaluator.
2. **S0 provenance.** Every raw dataset in `research/data/raw/` has a SHA-256 checksum, source URL and download time in `data/raw/manifest.json`. `research/s0/verify_manifest.py` fails if any file changed.
3. **S2 freedom to operate.** The prior-art gate asks two separate questions: (a) can we claim novelty? (b) do we infringe active EU/US patents (for example on automated carbon ledgers held by Persefoni, Watershed, IBM)? This is awareness only, not a legal opinion.
4. **S4 synthetic validation rule.** The synthetic SME generator passes only if, for turnover, headcount and kWh against CYSTAT/Eurostat marginals, a two-sample Kolmogorov-Smirnov test gives p > 0.05, or the normalised Wasserstein distance ≤ 0.1 where only binned marginals exist. The threshold is fixed in `prereg/` before generation.
