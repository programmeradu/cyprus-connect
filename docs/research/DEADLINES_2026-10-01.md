# EU + Cyprus sustainability deadlines — verified 1 Oct 2026

Status key: VERIFIED (official text or EC page), PARTLY (secondary source agrees, official text not read), UNVERIFIED (needs a check before it goes in the app).

## Deadlines and who they apply to

| Obligation | Applies to | Date / rule | Source | Status |
|---|---|---|---|---|
| CBAM annual declaration + certificate surrender | Authorised CBAM declarants: importers of CBAM goods (iron/steel, aluminium, cement, fertilisers, hydrogen, electricity) above 50 t/year combined mass | 30 Sep each year for the previous year; first: 30 Sep 2027 (2026 imports) | Reg. (EU) 2025/2083 amending 2023/956, CELEX 32025R2083 | VERIFIED |
| CBAM authorised-declarant application | Same, above 50 t/year | Apply before importing above threshold; those applying by 31 Mar 2026 could keep importing while pending | Reg. 2025/2083 | PARTLY |
| CBAM certificate purchases | Authorised declarants | Sales start Feb 2027 (common central platform) | EC delegated act memo Ares(2026)6860249 | VERIFIED |
| CBAM repurchase request | Authorised declarants | 31 Oct each year | Reg. 2025/2083 | PARTLY |
| CSRD sustainability report | EU companies with >1,000 employees AND >€450m net turnover (standalone or consolidated) | Wave 2 still in scope: first report 2028 for FY2027. Member States transpose by 19 Mar 2027 | Directive (EU) 2026/470 (OJ 26.2.2026, in force 18.3.2026); Directive (EU) 2025/794 | VERIFIED |
| CSRD value-chain protection | Companies ≤1,000 employees | May refuse data requests beyond the voluntary SME standard (VSME) | Directive (EU) 2026/470 | VERIFIED |
| CSDDD due diligence | EU companies >5,000 employees and >€1.5bn turnover | Transposition by 26 Jul 2028 | Directive (EU) 2026/470 | VERIFIED |
| VSME | Voluntary; often requested by banks/buyers | No legal deadline | EFRAG VSME; Commission to adopt voluntary SME standard | PARTLY |
| EUDR due diligence statement | Operators/traders placing cattle, cocoa, coffee, oil palm, rubber, soya, wood products on EU market | Large/medium: 30 Dec 2026. Micro/small (established by 31 Dec 2024): 30 Jun 2027 | Reg. (EU) 2025/2650 amending 2023/1115 | PARTLY |
| Energy audit | Enterprises with average energy use >10 TJ/year over the last 3 years (SME status no longer the test) | Every 4 years; Cyprus: report to Energy Service | Directive (EU) 2023/1791 Art. 11; Rec. (EU) 2024/2002; Cyprus K.Δ.Π. 522/2022 | VERIFIED (EU) / PARTLY (Cyprus) |
| Energy management system | Average >85 TJ/year | Ongoing obligation | Directive (EU) 2023/1791 Art. 11 | VERIFIED |
| ETS2 | Fuel suppliers releasing fuels for buildings/road transport (not end users) | Annual emissions report by 30 Apr; full trading from 2028 | Directive 2003/87/EC ch. IVa; Impl. Reg. (EU) 2024/2493 | PARTLY |
| F-gas company report | Producers, importers, exporters of F-gases and importers of pre-charged equipment above reporting thresholds | Annual, via EEA Business Data Repository (Art. 26); 31 Mar | Reg. (EU) 2024/573 Art. 26; Impl. Reg. (EU) 2024/2195; EEA FAQ v3.4 June 2026 | PARTLY (date and thresholds to read from Art. 26) |
| F-gas leak checks | Operators of equipment above CO2e thresholds | Periodic, by charge size | Reg. (EU) 2024/573 Art. 5 | UNVERIFIED thresholds |
| Empowering Consumers (anti-greenwashing) | Any business making environmental claims to consumers | Applies from 27 Sep 2026 (transposed by 27 Mar 2026) | Directive (EU) 2024/825 | VERIFIED |
| Green Claims Directive | — | Withdrawal announced 20 Jun 2025; not adopted; no date | COM(2023)166; EESC 17.9.2025 | VERIFIED as not applicable |
| Packaging EPR (Cyprus) | Companies placing packaged goods on the Cyprus market (producers, importers, own-label retailers) | Annual declaration to Green Dot Cyprus or own scheme | Law L.32(I)/2002; Reg. (EU) 2025/40 (PPWR) phasing in | PARTLY (dates UNVERIFIED) |
| Cyprus landfill levy | — | Rejected by House Plenary 14 Jul 2026; not in force | Press (politis, newscyprus) | PARTLY |
| WEEE / batteries EPR, E-PRTR/IED, ESPR/DPP, EU Taxonomy, plastic-bag levy | Various | — | — | UNVERIFIED — follow-up pass needed |

## Facts each rule needs (applicability inputs)

| Fact | Used by | In app today? |
|---|---|---|
| CBAM goods imported + yearly tonnes | CBAM | Partly: `cbam_import_lines` (CN code, mass) |
| Employees (exact or band) | CSRD, CSDDD, EUDR size class | Band only (team size) |
| Net turnover | CSRD, CSDDD, EUDR size class | Workspace revenue (partly) |
| Places EUDR commodities on market | EUDR | No |
| Annual energy use (TJ) | Energy audit / EnMS | Derivable from bills (kWh) + fuel spend; not stored as TJ |
| Sells fuel / is fuel supplier | ETS2 | No (sector only) |
| Imports or uses F-gas equipment | F-gas | No |
| Makes consumer environmental claims | Empowering Consumers | No |
| Places packaged goods on Cyprus market | Packaging EPR | No |

## Machine-readable sources for automatic updates

- EUR-Lex Cellar SPARQL (already used in `eu-feeds.server.ts`): can query acts that amend tracked base acts (`cdm:resource_legal_amends_resource_legal`) for 32023R0956, 32022L2464, 32024L1760, 32023R1115, 32023L1791, 32024R0573, 32024L0825, 32025R0040. A new amending act means the deadline must be re-read.
- EUR-Lex consolidated versions: a new consolidated version date (e.g. 02023R0956-20251020) signals a changed text.
- EC topic pages (CBAM, ETS2, F-gas, EUDR): no API; check page hash for changes.
- Cyprus: cylaw.org / Official Gazette have no API; page-hash monitoring only.
