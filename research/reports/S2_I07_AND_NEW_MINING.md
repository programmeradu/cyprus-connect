# S2 on I-07, and S1 Mining of I-08 and I-09

**Date:** 24 September 2026. **Style:** ASD-STE100. **Runs:** S2-PA-04, S1-MINE-08, S1-MINE-09.
Search method: web search across Semantic Scholar-indexed papers, arXiv, publisher pages and patent indexes (Google Patents, Patsnap, US grants). **Limit:** no paid patent database, no full-text claim reading, no systematic query log per database. This is a prior-art *screen*, not a formal FTO opinion.

## Summary (no optimism)
| Item | Verdict | Reason |
|---|---|---|
| I-07 Discrete-interpretation mixture + information-gain querying | **Survives S2 conditionally, narrowed.** Moves to S3 draft. Not a novelty claim. | No paper or patent found that combines both halves on SME carbon documents. But each half is published: Bayesian optimal experimental design (BOED) for data collection in material flow analysis (2025); Watershed on ambiguous-input mapping (2026); conformal intervals on e-tax records (2026); Carbonfact ranks data gaps by uncertainty. The maths is standard. Only the domain formulation and its measured result can be new. |
| I-08 Tenant common-area / HVAC allocation from κοινόχρηστα | **Killed at S1** (problem too small, method is standard) | Floor-area allocation is already GHG Protocol guidance. In Cyprus, most tenant units have their own EAC meter; κοινόχρηστα cover common areas, split by ownership share under Cap. 224. Thermal simulation of common areas from EUR amounts adds no technical uncertainty worth R&D. |
| I-09 Localised Bayesian prior for Cyprus food Scope 3 Cat 1 | **Parked: not testable** | Real technical uncertainty exists, but farm-to-farm variation dominates, and weight notes do not reduce it. Validation needs Cyprus farm-level ground truth, which we cannot collect without funding. The regional variability of agricultural LCA is already well studied. |

## 1. Mission 1: I-07 prior art

### 1.1 Formulation tested
For an SME with documents d_1..d_n, each document has a discrete hidden interpretation z_i (fuel type; fuel or shop; site; period; unit read by OCR). The disclosure value is y = Σ f(x_i, z_i). The belief over y is a mixture over the joint z. The system chooses the next question or document q that gives the largest expected reduction in entropy (or in interval width) of y.

### 1.2 Closest prior art found
| Source | What it covers | Distance from I-07 |
|---|---|---|
| Bayesian Optimal Experimental Design for Intelligent Data Collection in Material Flow Analysis, Procedia CIRP 135 (2025) 175-180, doi:10.1016/j.procir.2025.02.128 | Bayesian UQ + BOED to choose which data to collect next in sparse, heterogeneous MFA data | **Closest.** Same querying idea, but on continuous flows in a supply chain model, not discrete document interpretations |
| Ulissi et al. (Watershed), "Operationalizing Credible AI-Assisted Carbon Footprinting", Research Square 2026, doi:10.21203/rs.3.rs-8856470/v1 | LLM Auto-Mapper: 91% defensible mapping on non-vague inputs, 60% on ambiguous inputs; match-quality indicators | Measures the ambiguity problem. Does not model a probability over interpretations or choose questions |
| Pattanavekin & Ekgasit, Research Square 2026, doi:10.21203/rs.3.rs-9052200/v1 | Missing-not-at-random inventory completion from e-tax records, split-conformal calibration | Calibrated intervals on ledger data, but a continuous intensity, not discrete interpretations |
| Carbonfact "Uncertainty" metric (blog, 25 Jun 2026) | Range per product; ranks data gaps to collect first | Commercial prior art for "which gap to close first" (continuous heuristics) |
| Balaji et al. (Amazon), Environ. Sci. Technol. 2025, doi:10.1021/acs.est.4c12667; Wen et al., Sustainability 2026; Castle et al., arXiv 2502.07418 | LLM emission-factor matching and ranking | Candidate ranking only; no belief update from questions |
| Zhao et al., Processes 2026, doi:10.3390/pr14020226 | Fuzzy-probabilistic carbon footprint uncertainty with weighted evidence | Evidence weighting, no discrete interpretation model, no querying |
| Schulte (BONSAI), Bayesian SUT balancing with MCMC (2026) | Bayesian reconciliation of conflicting data | Macro-level tables, not firm documents |
| Foster et al. NeurIPS 2019; Shen & Huan 2023 | General BOED / sequential OED maths | Maths is established; I-07 cannot claim it |
| US 12,482,004 B2 (IBM, 2025) | Scope 3 from spend via NLP foundation model | Spend estimation; no interpretation mixture or active querying |

Patent screen for Watershed, Persefoni, SAP and IBM Environmental Intelligence on active clarifying questions: **no match found** in one screen. Only IBM US 12,482,004 appeared. This is weak evidence. A proper claim-level search on Espacenet/Google Patents with CPC G06Q10/063, G06Q50/26, G06N7/01 is still required before any IP statement.

### 1.3 Decision
Kill condition (a paper or patent that formulates carbon accounting as a discrete mixture over document interpretations with information-gain querying): **not met in this screen.**
Survival criterion: met in its narrow form. The closest work queries continuous parameters (MFA BOED, Carbonfact) or measures ambiguity without modelling it (Watershed).
Honest weight: the method is a combination of known techniques in a new domain. Under Frascati, it is R&D only if the outcome is uncertain. The uncertain part is specific: **whether probabilities from OCR/LLM extraction can be calibrated enough that the mixture intervals keep their stated coverage.** Watershed's 91%→60% drop on ambiguous inputs suggests they may not be.

### 1.4 Draft hypotheses for S3 (not yet pre-registered)
Pre-registration needs a committed file with a recorded git hash before any experiment. I cannot make commits from here. The founder must commit `prereg/I-07.md` first.
- **H1 (calibration):** On a benchmark of micro-SME document sets with known true values, 90% intervals from the discrete-mixture model have empirical coverage in [0.85, 0.95]. The pedigree/lognormal baseline (I-02 method) has coverage outside that band. Fail if the mixture coverage is < 0.85.
- **H2 (efficiency):** To reach an interval half-width ≤ 15% of the annual Scope 1+2 value, choosing questions by expected information gain needs ≥ 30% fewer questions or documents than (a) GSA-ranked continuous parameter collection and (b) a fixed checklist. Fail if < 15% fewer against either baseline.
- **H3 (ablation):** Removing the discrete layer (continuous-only model) worsens coverage by ≥ 5 percentage points on sets with ≥ 1 ambiguous document.
- Stress tests (already in plan): 0/25/50% missing documents; OCR noise; wrong-prior injection.
- Data: synthetic sets must pass the KS (p > 0.05) or Wasserstein (≤ 0.1) rule against real distributions. We have real distributions only for fuel prices (S1-FUEL-01) and grid factors. **Real SME document sets (3-5 pilots, with consent) are a hard dependency for H1.** Without them, H1 is tested on synthetic data only and must be reported as such.

## 2. Mission 2: new candidates

### 2.1 I-08 Common-area and HVAC allocation (Frascati §2.15 check: fails)
Evidence:
- GHG Protocol help desk ("How do I calculate Scope 2 emissions when activity data is not available?"): allocate building electricity to tenants by floor share; else use the average-data method (Scope 3 Guidance, Category 8). Floor-area allocation is **accepted practice**.
- Cyprus law: κοινόχρηστα are owners' contributions under the Immovable Property Law Cap. 224, split by ownership share or m², managed by the Διαχειριστική Επιτροπή (Tektor guide, 31 Aug 2026; moneymatters.cy, 4 Sep 2026). They cover cleaning, common lighting, lifts, pumps and insurance.
- A typical Nicosia office listing (349 m², Makariou Ave., central VRV cooling) states that common expenses are separate. VRV systems are normally on the unit's own supply. **Not verified across the market.**
- Greece already has a technical regulation for splitting central heating costs by calculated heat loss (ΤΕΧΝΙΚΟΣ ΚΑΝΟΝΙΣΜΟΣ ΚΑΤΑΝΟΜΗΣ ΔΑΠΑΝΩΝ ΚΕΝΤΡΙΚΗΣ ΘΕΡΜΑΝΣΗΣ, koinoxristos.gr). So a building-physics allocation method exists as regulation in the region.
Assessment: the SME's largest load (its own AC and equipment) is on its own EAC meter, which is class (a) evidence. The common-area share is small, and floor-area allocation is compliant. A thermal simulation prior would polish a minor figure, and the committee holds the real EAC bill anyway. That is process work (ask the committee), not R&D. **Killed at S1.**
Would re-open if: measured data shows that a large share of Cyprus SME tenants sit on a landlord-metered central chiller. We have no such data.

### 2.2 I-09 Localised food Scope 3 Cat 1 (Frascati §2.15 check: passes on uncertainty, fails on testability)
Evidence:
- Regional variability in agricultural LCA is well studied: Roesch et al., Int J LCA, Aug 2026 (AGRIBALYSE, SALCA, WFLDB, Agri-footprint; only Agri-footprint has ≥ 10 countries); Mazzetto et al., J Dairy Sci 2022 (milk footprint < 1 to > 2 kg CO2e/kg FPCM across 19 countries); Bartzas et al., Agriculture 2025 (Mediterranean farm-level LCA with GHG measurements); Pajno et al. 2024 (small-area estimation of farm footprints); Reinhard et al. (regionalised LCI framework).
- Cyprus product data exists in places: EPD for halloumi, Petrou Bros (Alambra), S-P-11365, valid to 2028-11-27.
- Hierarchical Bayesian priors and small-area estimation are standard statistics.
Assessment: the variance between farms is larger than the variance between countries. A delivery weight note fixes the mass, not the farm practice. So the error bound stays wide whatever the prior. To prove a "bounded error guarantee" you need Cyprus farm-level measured footprints as ground truth. We cannot fund that. **Parked as not testable.** It could return as a joint project with a Cyprus research partner (for example the Agricultural Research Institute) if funding appears.

## 3. State of the programme
- Killed: I-01, I-02, I-03, I-03b, I-04, I-08. Parked: I-09. Open: I-05, I-06. **Conditionally alive: I-07** (S2 screen passed; S3 blocked on the pre-registration commit and on real pilot document sets).
- What we can honestly say at Slush if I-07 holds through S3/S4: "We model the ambiguity in small-business evidence explicitly, and we measured that our uncertainty ranges keep their stated coverage while needing fewer documents." Not "we invented new mathematics."

## 4. Open actions
1. Founder commits `research/prereg/I-07.md` (H1-H3 above); record its git hash in registry.csv before any run.
2. Claim-level patent search (Espacenet, CPC G06Q10/063, G06Q50/26, G06N7/01) for Watershed, Persefoni, SAP, IBM.
3. Recruit 3-5 pilot SMEs (with consent) for real document sets; this decides whether H1 can be tested on real data.
4. Read the full text of Procedia CIRP 2025 (MFA BOED) and Watershed 2026. If either models discrete interpretations, I-07 is killed.
