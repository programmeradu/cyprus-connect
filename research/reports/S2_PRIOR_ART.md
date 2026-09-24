# S1 Close-out and S2 Prior-Art Gate

**Date:** 24 September 2026. **Style:** ASD-STE100. **Status:** S1 closed with one open data request. S2 run on I-03 and I-04.
Raw sources are in `data/raw/` with SHA-256 values in `manifest.json` (verified: no changes, no unlisted files).

## Summary (no optimism)
| Idea | Verdict | Reason |
|---|---|---|
| I-01 Seasonal grid factors | **KILLED** | Max 2.97% error (S1-GRID-01). Below any research threshold. |
| I-04 Spend-based fuel / fuel-vs-shop from card lines | **KILLED** | Price conversion solved (S1-FUEL-01). Receipt OCR line-item extraction ships in commercial tools. Transaction-level carbon attribution is patented. |
| I-03 Hidden PV self-consumption from net bills | **KILLED as framed.** Narrow residual I-03b opened, not yet an innovation claim | Disaggregation from monthly net import/export is published (Scheid et al., IEEE Access 2025). |
| CBAM supplier data gap | New problem P-CBAM, S1 evidence only | 78 of 111 evidence fields (70%) exist only at the non-EU operator. Size of the Cyprus population not yet measured. |

## 1. Candidate 1: rooftop PV (I-03)

### 1.1 Arithmetic version: killed
kWp x 1,600 kWh/kWp/year is arithmetic. No technical uncertainty. It fails Frascati 2015 §2.15 (check original before quoting). Not pursued.

### 1.2 Formal statement (inverse, under-determined source separation)
For bill period t = 1..T (EAC bills are bi-monthly, so T = 6 per year):
- Observed: I_t (grid import kWh), E_t (export kWh), kVA_max, tariff code, address.
- Exogenous: H_t = plane-of-array irradiation from CAMS radiation service at 35.1 N, 33.3 E (not yet downloaded).
- Unknown: gross generation G_t = k * f(H_t, T_amb, tilt, azimuth) * PR, consumption L_t, self-consumption S_t = G_t - E_t.
- Balance: L_t = I_t + S_t. Constraint: 0 <= S_t <= min(G_t, L_t).
- Unknowns per year: k, PR, orientation, and 6 values of L_t (or S_t). Knowns: 12 (I_t, E_t).
Consequence: with a free load shape the problem is not identifiable from bills alone. A load prior (typology) is required. The research question is therefore not "can we disaggregate" but "what is the achievable error bound on annual S and on Scope 2 market-based, per firm, from 6 import/export pairs plus a typology prior". That is the only form that can carry technical uncertainty.

### 1.3 Prior art (S2)
| Source | What it does | Effect on I-03 |
|---|---|---|
| Scheid et al., "Practical Method for Behind-the-Meter Solar PV Disaggregation", IEEE Access 2025, doi:10.1109/ACCESS.2025.3620234 | Disaggregation from **monthly net imports and exports only**, with typical load curves for residential, commercial, industrial, validated on synthetic consumers in 13 classes | Core mechanism of I-03 is published. **Kill rule met.** |
| Chen & Irwin, SunDance, ACM e-Energy 2017, doi:10.1145/3077839.3077848 | Black-box disaggregation from net meter data plus location and weather | Interval-data version is prior art since 2017 |
| Stainsby et al., Applied Energy 267 (2020) | PV generation from AMI net load + install date | Prior art |
| Cheung et al., IEEE SmartGridComm 2018 | Unsupervised mixture-model disaggregation | Prior art |
| Pu & Zhao, IEEE ISGT 2023 | Unsupervised similarity-based BTM solar | Prior art |
| Shimomura et al., npj Clean Energy 2025 | Grid-level self-consumption estimate with XAI | Prior art (aggregate level) |

Narrow residual (I-03b), recorded as a hypothesis for S3, **not** a claim: Scheid et al. target utilities and consumer groups and report fit on synthetic data. Not found in this search: (a) a per-firm calibrated interval (coverage-tested) for annual self-consumption at bi-monthly resolution; (b) propagation of that interval into a Scope 2 market-based disclosure. This is a gap in what we found in one search pass, not proof of novelty. Full text of Scheid et al. is not yet read. If it contains (a), I-03b is killed too.

FTO awareness: no patent search on BTM disaggregation done yet. Required before S3.

### 1.4 Cyprus penetration: exact figures that exist, and the figure that does not
| Figure | Value | Source |
|---|---|---|
| Net-metering PV (systems up to 10 kWe), total installed, end 2023 | 239.8 MWe | CERA Annual Report 2023, p.63; CERA National Report 2024 to EC, p.30-31 |
| Net-metering systems installed in 2023 alone | 18,155 systems, 88.05 MWe | same |
| Self-consumption PV other than net metering (net-billing etc.), end 2023 | 59.24 MWe | same, p.62 |
| Own-use PV, early 2025 (CERA statement) | 464 MW | Cyprus Mail, 13 Mar 2025 |
| EAC-Supplier commercial accounts, 31 Dec 2023 | 91,870 (avg 18,473 kWh/yr) | CERA National Report 2024, Table 7 |
| Net-metering scheme | Closed to new applications after 31 Dec 2025 | EAC, RES schemes page (2025) |
| **Share of commercial accounts on net-metering / net-billing** | **NOT PUBLISHED** in either CERA report | — |

The CERA reports split net-metering by year and capacity, not by customer category. We cannot give the exact percentage today. Rough bound only: net metering is capped at 10 kWe and is mostly household; the commercial route is net-billing, 59.24 MWe at end 2023. Divided by 91,870 accounts this is at most 0.64 kW per account on average. The real share of accounts with PV is unknown.
Action: formal request to EAC Distribution System Operator (DSO) and CERA for count of net-metering and net-billing agreements by tariff category, under the Right of Access to Public Sector Information Law 184(I)/2017 (check article before filing). Until that answer arrives, the market-size input for I-03b is open.

Also note: the net-metering scheme closure moves new commercial PV to net-billing. Whether net-billing bills show gross generation depends on the metering set-up (generation meter or not). **Not verified.** If EAC net-billing installs a separate generation meter, the problem for net-billing customers disappears. This must be checked on 2-3 real net-billing bills before any S3 work.

## 2. Candidate 2: fuel and card transactions (I-04): KILLED
Evidence (MCC heuristics excluded, as instructed):
- US 10,902,484 B1 (Morgan Stanley, granted 2021-01-26): carbon value per transaction from amount and merchant data.
- US 12,141,818 B2 (Mastercard, granted 2024-11-12): environmental impact of transactions via graph / GNN merchant mapping.
- Doconomy Åland Index: transaction footprints at 90+ financial institutions, 40+ countries (doconomy.com/products/impact-transactions). Mastercard Carbon Calculator API accepts extra item data (AIIA codes), not only MCC.
- Receipt OCR line-item extraction with fuel litres ships commercially: CarboEnd (receipt scan example "Diesel 120 L", Scope 1), Numo Document Intelligence (confidence score per extracted value), CarbonAPI document API (fuel receipts category, NZ/AU), Carbonly.ai (fuel docket automation), Azets Expense (OCR + carbon view).
- Academic: Trendl et al., J. Industrial Ecology 2022, doi:10.1111/jiec.13351 (footprints from bank transaction data at scale).
- GHG Protocol Scope 3 Technical Guidance (2013) ranks spend-based as the least accurate method, and GHG Protocol published a Scope 3 Uncertainty Calculation Tool (2026). Not checked in this pass: whether either gives a numeric error bound for un-itemised fuel spend. Not needed for the kill.
- Not checked: patents by Ecolytiq and Greenly specifically. Not needed for the kill (condition "OCR line-item split is commercial" is met), but logged as a gap.
Decision: the kill condition set by the research director is met. I-04 is dead. The 7-11% fuel-type error from S1-FUEL-01 is real, but closing it is document extraction, which is engineering.

## 3. S1 completion: CBAM datapoints (S1-CBAM-01)
Source: Implementing Regulation (EU) 2023/1773, Annex I Table 2 (original text, sha256 in manifest). Script: `s1/cbam_fields.py`. Output: `data/processed/s1_cbam_fields.csv`.

| Class | Fields |
|---|---|
| A administrative | 112 |
| I importer-held (SAD / customs, invoice) | 33 |
| S supplier-only (operator identity, installation, direct embedded emissions, carbon price due) | 51 |
| S3 supplier-only, needs operator upstream data (indirect emissions: electricity consumed, EF source; production route; qualifying parameters incl. precursors) | 27 |

**78 of 111 evidence fields (70%) have zero primary documentation on the importer side.** A Cyprus importer's own documents cannot contain them. Precursor emissions, electricity consumed and its emission-factor source, specific direct embedded emissions and origin-country carbon price all fall in S/S3 for cement, fertilisers, iron and steel alike.

Limits and hard caveats:
1. 2023/1773 is the **transitional-period** act (reports to 31 Jan 2026). Today (Sep 2026) the definitive period applies, with new implementing acts (Commission CBAM Guidance Document 3, 14 Aug 2026). The field list must be re-run on the definitive-period acts before any claim.
2. The CBAM simplification amendment added an annual de-minimis mass threshold (50 t per importer, as we understand it). **Not verified.** If correct, most Cyprus SME importers are out of scope, and this problem may be small in Cyprus.
3. The number of Cyprus importers of CBAM goods is not measured. Next step: Eurostat Comext, CY imports by CN chapters 25 (cement), 31 (fertilisers), 72-73 (iron and steel), 76 (aluminium).
4. The default-values route (Commission default values) removes the need for most S/S3 fields at a cost penalty. So "zero documentation" does not mean "cannot file". The research-worthy question, if any, is the error of default values versus actual, which is outside our data today.
5. ESRS datapoints: not done in this pass. VSME Basic (45 fields) was mapped in S1-RANK-01; the EFRAG IG3 ESRS datapoint list is still open.

## 4. What is left standing
Nothing has passed S2. I-02 (confidence-scored footprint + evidence value ranking) is the next S2 subject; it overlaps with I-03b (per-firm calibrated intervals). The two may merge into one question: calibrated per-datapoint uncertainty for SME disclosures from sparse documents. That must go through the same prior-art gate (Brightway2 Monte Carlo, pedigree matrix, Numo confidence scores are the first known prior art).
