# S2 Prior-Art Gate: I-02, I-03b, and CBAM Sizing

**Date:** 24 September 2026. **Style:** ASD-STE100. **Runs:** S2-PA-02, S2-PA-03, S1-CBAM-02, S1-CBAM-03.
All raw sources are in `data/raw/` with SHA-256 values in `manifest.json` (verified: no changes, no unlisted files).

## Summary (no optimism)
| Item | Verdict | Deciding evidence |
|---|---|---|
| I-02 Confidence-scored footprint + evidence ranking | **KILLED** | Pedigree matrix + lognormal GSD + Monte Carlo is standard in ecoinvent / Brightway2 / openLCA. Choosing which data to collect next by sensitivity or value of information is published. PCAF 1-5 data quality scores are an industry standard. |
| I-03b Calibrated interval for PV self-consumption from bills | **KILLED** | The EAC net-billing rules require a DSO **generation meter (M1)** plus an import/export meter (M2, M3). Gross generation is measured by the utility. |
| I-07 (new) Discrete-ambiguity mixtures in sparse micro-SME evidence | **Open hypothesis, not a claim** | Residual of I-02. Not yet searched. Must pass its own S2. |
| CBAM for Cyprus SMEs | **Weak problem** | The 50 t de-minimis exemption (Reg. 2025/2083) removes most small importers. Cyprus importer counts per CN code are not published. |

After this pass, **zero candidates are standing with a passed S2.** The pipeline has now killed five of six original framings.

## 1. I-02: prior art

### 1.1 LCA data quality and uncertainty (established since 1996)
- Weidema & Wesnæs (1996), J. Cleaner Production: data quality indicators (the pedigree matrix). Cited in Ciroth et al. references.
- Ciroth, Muller, Weidema, Lesage (2016), Int J LCA 21(9):1338-1348, doi:10.1007/s11367-013-0670-5: empirical uncertainty factors per pedigree score, aggregated to a geometric standard deviation (GSD) under lognormal. Five indicators in ecoinvent 3. Muller et al. (same issue) extend to non-lognormal distributions.
- Brightway2 and openLCA both run Monte Carlo on these distributions (tool documentation; not re-downloaded in this pass).

### 1.2 Picking the next data item to collect
- Kaddoura et al. (2025), Sci. Total Environ., doi:10.1016/j.scitotenv.2025.179269: global sensitivity analysis used to rank which parameters to collect first. This is the "evidence value ranking" idea, published.
- Groen et al. (2016), Int J LCA, doi:10.1007/s11367-016-1217-3: comparison of global sensitivity methods for LCA inventories.
- Ravikumar et al. (2018), Environ. Sci. Technol., doi:10.1021/acs.est.7b04517: decision-driven sensitivity to prioritise uncertainty reduction.
- Haag et al. (2022), Environ. Modelling & Software: expected value of partial perfect information (EVPPI) for environmental decisions.

### 1.3 GHG accounting standards and commercial tools
- GHG Protocol Scope 3 Standard (2011) ch. 7 and Technical Guidance (2013): data quality indicators (technology, time, geography, completeness, reliability), and spend-based data ranked lowest. GHG Protocol also has a quantitative inventory uncertainty tool that uses first-order error propagation and Monte Carlo, and a Scope 3 Uncertainty Calculation Tool (updated March 2026). **Stated from knowledge of the standards; the original PDFs were not re-read in this pass. Check before quoting.**
- PCAF data quality score 1-5 (PCAF Standard, updated Dec 2025). CDP adopted it in 2021 (PCAF-CDP paper, June 2023).
- Numo: confidence score for each extracted value (product page, found in the previous pass).
- Not checked: Persefoni, Watershed, Greenly and Normative methodology papers and patents. **Not needed for the kill**: the kill condition (document tier + Monte Carlo) is met by the LCA prior art alone. Logged as an open FTO gap.

### 1.4 Decision
The kill condition you set is met. Mapping document types to pedigree tiers and running Monte Carlo is established practice. Ranking evidence by sensitivity or value of information is also published. **I-02 is dead.**

### 1.5 Residual test: sparse, heterogeneous micro-SME evidence (opened as I-07)
Where can multimodal error come from in micro-SME data? Not from measurement noise (that stays lognormal). It comes from **discrete ambiguity**: which fuel was bought, whether a card line is fuel or shop, whether a bill covers one site or two, which period a document covers, kWh versus kVA read by OCR. Each ambiguity gives a mixture of discrete hypotheses. The disclosure value then has several separate peaks, not one bell curve.
Hypothesis I-07: for a micro-SME with fewer than about 10 documents, a model with discrete hypotheses per document (a mixture over document interpretations) gives better-calibrated intervals than pedigree/lognormal propagation, and choosing the next document by expected entropy reduction over those hypotheses needs fewer documents than choosing by GSA on continuous parameters.
Honest status: this may be ordinary Bayesian experimental design or probabilistic record linkage applied to a new domain. That is likely **not** new mathematics. It is only research-worthy if (a) no published work treats carbon disclosure uncertainty as a mixture over document interpretations, and (b) there is real technical uncertainty on whether it beats the standard method. S2 search terms to run next: "Bayesian LCA mixture model", "probabilistic data reconciliation LCA", "document interpretation uncertainty carbon", "active learning emission inventory", plus Bayesian experimental design for inventories. No experiment before S3 pre-registration.

## 2. I-03b: metering reality check

Source 1, EAC DSO, *Connection procedure for PV systems with net billing, Category B* (11/5/2022), section 7.0 (original Greek):
> "Στα συστήματα συμψηφισμού λογαριασμών θα πρέπει να εγκατασταθούν δύο Μετρητές από τον ΔΣΔ. Ο ένας μετρητής θα καταγράφει την παραγωγή του συστήματος ΑΠΕ ενώ ο δεύτερος θα είναι αμφίδρομος μετρητής..."
(Two meters installed by the DSO: one records RES generation, the second is bidirectional and records import and export.)
The same document defines "Μετρητής Παραγωγής" (M1, generation), and "Μετρητής Εισαγωγής-Εξαγωγής" with two registers (M2 import, M3 export). Small sites get non-profile meters. Industrial sites get half-hourly profile meters.

Source 2, EAC *Technical Guide Net-Billing, edition 2023.2*: defines "Παραγωγή" as energy recorded by the generation meter, and repeats the M1/M2/M3 layouts. **Conflict found:** one later section of the same guide says one bidirectional meter will be installed (import/export only). The definitions and layout sections require M1. Most likely the one-meter sentence is an older text that was not updated. This must be confirmed on real net-billing sites.

Consequence: under net billing, the utility measures gross generation. Self-consumption = M1 - M3 is arithmetic. **Your kill rule is met. I-03b is dead.**
Remaining edges, not research: (a) M1 may not be printed on the SME's bill; the SME can read the meter or ask the supplier (engineering or process work). (b) Net metering (≤10 kW, closed to new applications after 31 Dec 2025) was not checked for a generation meter; it is mostly household.

## 3. CBAM: definitive period and Cyprus size

### 3.1 De-minimis rule (verified in the original text)
Regulation (EU) 2025/2083 of 8 October 2025 (OJ 17.10.2025), recitals 3-5: a single mass-based threshold of **50 tonnes** net mass per importer per calendar year, cumulative across iron and steel, aluminium, fertilisers and cement. Below it, the importer is exempt from CBAM obligations. Above it, obligations apply to all of that year's imports. Electricity and hydrogen are excluded from the exemption. Design target: at least 99% of embedded emissions stay in scope; "the vast majority" of importers are exempted. The Commission can change the threshold by delegated act when the recalculated value differs by more than 15 t. (The operative Article number in 2023/956 as amended: check the consolidated text before quoting.)

### 3.2 Cyprus extra-EU imports of CBAM goods (Eurostat Comext DS-045409, S1-CBAM-02)
| CN | Group | 2023 t | 2024 t | 2025 t |
|---|---|---|---|---|
| 2523 | Cement | 12,000 | 28,287 | 13,101 |
| 3102 | Nitrogen fertilisers | 2,277 | 842 | 3,031 |
| 3105 | Mixed fertilisers | 990 | 1,543 | 616 |
| 72 | Iron and steel | 78,546 | 95,577 | 115,699 |
| 73 | Articles of iron or steel | 46,324 | 28,889 | 35,150 |
| 76 | Aluminium | 9,458 | 11,424 | 15,950 |
| | **Total 2025** | | | **183,547** |

Limits: chapters 72, 73 and 76 include some CN codes that are not CBAM goods (e.g. scrap 7204 is out; parts of 73 and 76 are out). So these are upper bounds.

### 3.3 Number of Cyprus importers: not published
Comext publishes mass and value, not importer counts per CN code. Eurostat trade-by-enterprise statistics group by activity, not by CN code. CYSTAT does not publish importer counts per CN code either (not found). **The exact number cannot be given.** A mathematical bound tells us nothing useful: at most 3,671 importers can be above 50 t in 2025 (183,547 / 50). Real concentration is unknown.
Action: request to the Cyprus Customs Department (the national CBAM authority) for the count of importers above and below 50 t in 2025, by sector.

### 3.4 Implication
Most Cyprus micro-SMEs that import small quantities are exempt. The CBAM problem sits with a few larger importers (steel traders, cement, construction). That is a sales segment, not a research question. The 70% supplier-only field finding (S1-CBAM-01) stays true for importers above the threshold, but the definitive-period field list is not yet re-mapped.

## 4. Where this leaves the programme
- Killed: I-01, I-02, I-03, I-03b, I-04. Open: I-05 (borehole water), I-06 (waste mass), I-07 (discrete-ambiguity mixtures, just opened).
- The honest position for Slush today: Vuneli has a working research pipeline with recorded kills. It does **not** yet have a defensible technical novelty.
- Recommended next S2 subject: I-07. It is the only candidate that comes from a measured structure of micro-SME data (S1 fuel and CBAM results both show discrete ambiguity as the main error source, not measurement noise).
