# Vuneli Research Workspace

This folder is the R&D pipeline. It is not part of the app build.
Plan: `.lovable/plan/vuneli-research-and-innovation-pipeline-before-any-roadmap-2026-09-24.md`.
Test we must pass: `docs/research/INNOVATION_CRITERIA_DMRID_RIF_56_LAYER_2026.md`.

## Stages
S0 infrastructure, S1 problem mining, S2 prior-art gate, S3 pre-registered hypotheses,
S4 experiments, S5 Frascati + TRL gate, S6 mapping and roadmap.

## Governance rules
1. Pre-registration lock: a hypothesis file in `prereg/` is committed, and its commit hash
   goes in `registry.csv`, before any experiment code runs. A threshold change after the lock
   makes the run invalid.
2. Every experiment includes a missing-data and noise stress test (0%, 25%, 50% missing).
3. Cyprus realism: island grid mix and bilingual local documents in the ground truth.
4. Frascati audit trail: every R&D hour and cost goes in `ledger.csv`.
5. Kill decisions and failed results stay in the files. Nobody deletes them.

## Layout
- `data/raw/` source downloads, unchanged. `data/processed/` script outputs.
- `s1/` problem-mining scripts. `prereg/` locked hypotheses. `experiments/<id>/` runs.
- `registry.csv` experiment runs. `ideas.csv` idea register. `ledger.csv` R&D time and cost.
- `reports/` stage reports.

## Reproduce S1
    python3 research/s1/grid_analysis.py
    python3 research/s1/rank_problems.py
