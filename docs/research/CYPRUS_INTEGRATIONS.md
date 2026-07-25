# VerdeIQ — Cyprus Integrations Dossier
**Scope:** 15-layer, RIF-grade research on local Cypriot APIs, data sources, software, and modules VerdeIQ must integrate with so users can migrate into and operate from VerdeIQ with minimum friction.
**Version:** 1.0 · **Date:** 2026-07-08 · **Owner:** VerdeIQ Product / Integrations

> Legend: `[LIVE]` public API in production · `[PORTAL]` web portal, no public API — needs scraping, file import, or partner deal · `[FILE]` file-based exchange only (CSV / XLSX / XML / PDF) · `[EST]` planning estimate to be validated with vendor.

---

## Layer 1 — Integration strategy & tiering

Every integration is placed in one of four tiers based on **user impact × effort**:

| Tier | Meaning | Delivery |
|---|---|---|
| **T0 — Table stakes** | Without it, a Cypriot SME cannot use VerdeIQ credibly. | Sprint 0–2 |
| **T1 — Adoption accelerators** | Cuts onboarding from days to minutes. | Sprint 3–8 |
| **T2 — Retention & expansion** | Sticky workflows; unlocks upsell (CBAM, EED, ESRS). | Q4 2026 – Q2 2027 |
| **T3 — Ecosystem plays** | Partner-led; requires BD. | 2027+ |

Design invariants across all tiers:
- **Idempotent pull** — every connector supports checkpointed re-runs.
- **Signed evidence** — every pulled record is stored with source hash + fetched-at.
- **User-scoped credentials** — never share one API key across tenants.
- **Human-in-the-loop fallback** — every connector has a manual CSV/PDF path when the API is down or the customer has no digital access.
- **Cypriot-Greek support** — parsers understand Greek headers, comma-decimals, `DD/MM/YYYY`.

---

## Layer 2 — Utilities & energy data sources

### 2.1 Electricity Authority of Cyprus (EAC)
- **Status:** `[PORTAL]` — EAC has an online account portal (`eac.com.cy` → *EAC Online*) for consumption history and PDF bills. No public API for third parties. `[EST]`
- **Approach:**
  1. **PDF bill parser** — build a robust OCR + template parser for EAC monthly bills (both Greek and English variants). Extract: account no., meter serial, tariff code (08, 56, 06, etc.), consumption kWh, fuel adjustment €, RES levy, PSO, net amount, billing period.
  2. **Meter-photo capture** — mobile flow with EXIF timestamp + OCR of digits, cross-validated against the tariff code the user selected.
  3. **Green Button-style CSV import** — user exports history from EAC Online and drops it in.
  4. **Partner path** — pursue a formal data-sharing agreement with EAC (via CERA's SME transparency workstream) for authenticated pull.
- **Priority:** T0.

### 2.2 CERA (Cyprus Energy Regulatory Authority)
- **Status:** `[FILE]` — publishes tariff decisions and monthly fuel-adjustment coefficients as PDF bulletins on `cera.org.cy`.
- **Approach:** cron scraper (`/api/public/cera-sync`) parses the monthly PDF, upserts into `tariff_schedules` and `fuel_adjustment_history`. Alert on schema drift.
- **Priority:** T0.

### 2.3 TSOC (Transmission System Operator)
- **Status:** `[FILE]` / `[PORTAL]` — publishes system operation reports, RES generation data, and demand curves at `tsoc.org.cy`.
- **Roadmap:** TSOC has flagged (NECP 2024 update) intent to publish near-real-time grid carbon intensity. Track and integrate when live.
- **Approach:** daily scraper of published RES share + generation-mix XLSX; compute rolling grid intensity used as the default S2 emission factor.
- **Priority:** T0.

### 2.4 DEPA / Natural gas (Vasilikos LNG)
- **Status:** pre-commercial. Once operational, wholesale gas price bands will publish via DEPA and CERA.
- **Approach:** stub connector now; activate when tariffs publish.
- **Priority:** T2.

### 2.5 LPG suppliers (Petrolina, EKO Cyprus, Lukoil, Synergas)
- **Status:** `[FILE]` — invoice-based. No APIs.
- **Approach:** invoice-PDF parser per supplier template; capture litres, kg, delivery site.
- **Priority:** T1.

### 2.6 Fuel-card providers (Petrolina, Lukoil, EKO fleet cards)
- **Status:** `[PORTAL]` fleet dashboards with CSV export.
- **Approach:** scheduled CSV import → Scope 1 mobile combustion + Scope 3 employee commuting split.
- **Priority:** T1.

### 2.7 EV charging (EV Power, Porsche Destination, Blink Charging CY, IONITY)
- **Status:** mixed — some have OCPI endpoints, most only portal CSV.
- **Approach:** OCPI 2.2.1 client for those that expose it; CSV fallback.
- **Priority:** T2.

### 2.8 Rooftop PV inverters
- **Status:** `[LIVE]` vendor cloud APIs — SolarEdge Monitoring API, Huawei FusionSolar, SMA Sunny Portal, Fronius Solar.web, Enphase Enlighten. Common in CY installations.
- **Approach:** unified `pv_inverter` adapter with per-vendor implementations. Pull production kWh → offset against S2 electricity.
- **Priority:** T1.

---

## Layer 3 — Water, waste, refrigerants

- **Water Development Department (WDD)** & municipal water boards (Nicosia, Limassol, Larnaca-Famagusta, Paphos): `[FILE]` PDF bills. Parse: m³, sewerage, desal surcharge.
- **Sewerage boards** (SBLA Limassol, SBN Nicosia, etc.): PDF/portal.
- **Waste collectors**: Green Dot Cyprus (`greendot.com.cy`) for packaging producer responsibility — `[PORTAL]` producer portal with declaration exports. WEEE Cyprus and AFIS (batteries) same shape.
- **F-Gas registry**: EU F-Gas Portal (FGAS-HFC) `[LIVE]` — importers/operators log entries. VerdeIQ mirrors the register per tenant.
- **Priority:** WDD + Green Dot = T0; sewerage + WEEE = T1; F-Gas = T2.

---

## Layer 4 — Accounting & ERP integrations

Cypriot SMEs are dominated by a handful of accounting products. Every one of these must be a one-click integration or we lose the accountant channel.

| Software | Local footprint | API status | Approach | Tier |
|---|---|---|---|---|
| **SoftOne CY (Soft1)** | Very high (mid-market ERP) | `[LIVE]` SoftOne Web Services (SOAP/REST) | OAuth-ish token; pull journals, expenses, fixed assets, fuel expense accounts | T0 |
| **Epsilon Net / Pylon Cyprus** | High | `[LIVE]` Pylon API | REST; pull chart of accounts, invoices | T0 |
| **SAP Business One** | Mid | `[LIVE]` Service Layer | OAuth; pull GL lines by account code | T1 |
| **Microsoft Dynamics 365 BC** | Growing | `[LIVE]` BC APIs | OAuth; pull GL, purchase invoices | T1 |
| **Odoo (self-hosted)** | Growing among tech SMEs | `[LIVE]` JSON-RPC | API key; pull accounts, invoices | T1 |
| **Xero** | Present among startups | `[LIVE]` OAuth 2.0 | Standard | T1 |
| **QuickBooks Online** | Low | `[LIVE]` OAuth 2.0 | Standard | T2 |
| **Wave Accounting** | Low but connectable | `[LIVE]` GraphQL via Lovable connector | Use existing connector | T2 |
| **Sage 50 CY / Sage 200** | Mid | `[FILE]` mostly CSV; some Sage Business Cloud APIs | CSV importer + Sage Cloud OAuth | T1 |
| **DataTracks / Priority CY** | Niche | `[FILE]` | CSV | T2 |
| **Custom Excel books** | High among micros | `[FILE]` XLSX | Template with Greek headers | T0 |

**What we pull from accounting:** natural accounts mapped to activity categories — fuel purchases → Scope 1 mobile; electricity → Scope 2; travel → Scope 3.6; freight → Scope 3.4/9; capital goods → 3.2. Mapping is a first-class UI (`Chart-of-Accounts Mapper`), remembered per tenant.

---

## Layer 5 — Payroll & HR (commuting Scope 3.7)

- **Cyprus payroll leaders:** SoftOne HR, Epsilon HR, Sage HR, PayCore, Emphasys HRMS, LOGICOM HR.
- **Approach:** pull headcount, site, home-city ZIP (with consent). Compute commuting factors using CY-calibrated modal split from `Cystat Household Budget Survey 2015` + a light survey module.
- **Priority:** T1.

---

## Layer 6 — Tax, invoicing, e-government

### 6.1 Tax Department — Tax For All (TFA)
- **Status:** `[LIVE, growing]` — the Cyprus Tax Department's TFA platform (`taxforall.gov.cy`) is the new unified e-services stack. Machine access is via **CY Login** federated identity + web services (SOAP/REST).
- **Approach:** OAuth-like handshake through CY Login; pull VAT filings, CIT filings, taxpayer identification (TIC) confirmation. Also push: generate compliance summary attachments.
- **Priority:** T0 (TIC verification), T1 (returns pull).

### 6.2 CY Login (Πύλη Ταυτοποίησης)
- **Status:** `[LIVE]` — the national identity broker. Supports SAML 2.0 + OIDC for authorized service providers.
- **Approach:** register VerdeIQ as a service provider with DITS (Deputy Ministry of Research, Innovation & Digital Policy). Enables one-click gov integrations.
- **Priority:** T1 (blocker for TFA & CBAM registry direct access).

### 6.3 E-invoicing (upcoming CY mandate)
- **Status:** Cyprus is aligning with the EU's ViDA package; B2B e-invoicing mandate expected in phased rollout 2027–2028. Format converging on **Peppol BIS Billing 3.0** + EN 16931.
- **Approach:** ship a Peppol Access Point client (via OpenPeppol certified provider — Storecove, Pagero, or B2Brouter) so VerdeIQ can consume incoming invoices as structured data — the cleanest activity feed we will ever have.
- **Priority:** T2.

### 6.4 Department of Registrar of Companies & Intellectual Property (DRCIP)
- **Status:** `[PORTAL]` — public register lookup at `efiling.drcor.mcit.gov.cy`. No formal API. `[EST]`
- **Approach:** headless-browser lookup for company enrichment (registered address, directors, filing history) during onboarding. Store as evidence.
- **Priority:** T1.

### 6.5 GESY (National Health System) & Social Insurance
- Not directly ESG-material but used for headcount verification when payroll data is missing.
- Priority: T2.

---

## Layer 7 — Banking & Open Banking (PSD2)

Cyprus banks under PSD2 must expose XS2A APIs for licensed TPPs.

- **Bank of Cyprus** — Open Banking developer portal live.
- **Hellenic Bank** — XS2A endpoints live.
- **Alpha Bank Cyprus** — XS2A live.
- **Eurobank CY, Astrobank, Ancoria Bank** — XS2A live.
- **Approach:** partner with an AISP aggregator (Tink, Salt Edge, Nordigen/GoCardless Bank Account Data) rather than building each bank ourselves. Pull categorised transactions → auto-detect utility/fuel/travel spend → suggest activity entries.
- **Consent:** SCA every 180 days per PSD2.
- **Priority:** T1 (major differentiator vs Greenly et al. in the CY market).

---

## Layer 8 — Travel, mobility, logistics

- **Travel management:** Salamis Tours (corporate), Amathus Travel, Top Kinisis, Louis Travel — mostly `[FILE]` PDF itineraries + CSV monthly statements. Long tail via Amadeus / Sabre PNR feed for larger firms.
- **Airlines:** Cyprus Airways, Aegean, TUS Airways — no direct APIs for corporates; via TMC.
- **Approach:** email-in `travel@<tenant>.verdeiq.cy` — parse booking confirmations (Cyprus Airways, Aegean, Ryanair, Wizz) with LLM extraction + verify against IATA airport DB. Compute pkm with **great-circle × radiative-forcing multiplier 1.9**.
- **Hotels:** Green Key CY-certified property list scraped monthly for factor calibration.
- **Logistics:** DHL Cyprus, ACS Courier, Cyprus Post `[PORTAL]` CSV exports.
- **Priority:** T1.

---

## Layer 9 — Property, buildings, IoT

- **DEEC — Energy Performance Certificate register** (MECI): `[PORTAL]` public search of building EPCs. Scrape by cadastral number for baseline building-envelope data.
- **Cyprus Land Registry (DLS)**: `[PORTAL]` via `dls.moi.gov.cy`; area, use class.
- **BMS / IoT platforms:** Siemens Desigo, Schneider EcoStruxure, Honeywell, Trend IQ4 — common in CY hotels & offices. `[LIVE]` BACnet/IP + REST bridges.
- **Sub-metering vendors:** Kamstrup, Landis+Gyr, Iskraemeco.
- **Approach:** MQTT + BACnet gateway (self-hosted on a Raspberry Pi shipped to customer, "VerdeIQ Edge") streaming to `/api/public/telemetry` with per-device HMAC keys.
- **Priority:** T2 (Growth+ plans).

---

## Layer 10 — Compliance & reporting endpoints (outbound)

Where VerdeIQ **submits** or **hands off** data downstream.

- **CBAM Transitional/Definitive Registry** (`cbam.ec.europa.eu`): `[LIVE]` — XML submission of quarterly reports. Cyprus NCA is Dept. of Environment. VerdeIQ generates the XML, user uploads (Phase 1) or we integrate via NCA API (Phase 2 when available).
- **EU Emissions Trading Registry / Union Registry**: `[LIVE]` for ETS operators; hand off verified emissions XLS.
- **EFRAG XBRL Taxonomy** for ESRS: emit iXBRL-tagged HTML.
- **EMAS registry** (Dept. of Environment): PDF submission.
- **CDP Portal** (`cdp.net`): `[PORTAL]` — CSV import; VerdeIQ produces the CDP-ready CSV per module (Climate, Water, Forests).
- **EcoVadis**: `[PORTAL]` — questionnaire prefill via structured export.
- **Sedex SAQ**: `[FILE]` XLSX prefill.
- **Travelife / Green Key / EU Ecolabel**: `[FILE]` prefill their audit workbooks.
- **Bank ESG questionnaires** (BoC, Hellenic): partner API when available; PDF fill otherwise.
- **Priority:** CBAM + CDP + Travelife = T0; ESRS XBRL + EcoVadis = T1; EMAS + Sedex = T2.

---

## Layer 11 — Migration & onboarding tooling

- **CSV wizard** with column auto-mapping, Greek header dictionary, and duplicate detection.
- **Excel template pack** (EL/EN) covering electricity, water, fuel, waste, travel — matches the top 10 accounting exports.
- **PDF invoice bulk-drop** — user uploads a zip of last 12 months of bills; queue → OCR → parse → review → commit.
- **Email-in per tenant** — `bills@<tenant>.verdeiq.cy`; forward EAC/WDD/LPG bills; auto-classified.
- **Google Drive / OneDrive / Dropbox** watcher — folder-based ingestion for accounting firms managing many clients.
- **Migration from Excel-only baselines** — first-run wizard imports a baseline year, so year-1 ROI is visible.
- **Priority:** T0.

---

## Layer 12 — Identity, SSO, and access

- **CY Login** (federated national identity) — see 6.2.
- **Google Workspace SSO** & **Microsoft 365 SSO (Entra ID)** — via standard OIDC/SAML; both common in CY SMEs (Google skews SME, MS skews corporate & regulated).
- **Magic-link email** for micros without SSO.
- **Priority:** T0 (Google/MS SSO), T1 (CY Login).

---

## Layer 13 — Partner & channel integrations

- **ICPAC members' practice management** — extension for the top three practice-management suites used by Cypriot accountants: **SoftOne**, **Epsilon**, and **Wolters Kluwer CCH**. Firm-level dashboard listing all client tenants.
- **Bank co-brand** — sign-up widget embedded in Bank of Cyprus / Hellenic online banking for corporate clients.
- **Chamber portals** — CCCI and OEB members-area listing.
- **RIF grant application prefill** — form-mapper to the RIF Innovate Cyprus templates so an SME can apply for a €10k Innovation Voucher (to buy VerdeIQ itself) in one click.
- **Priority:** ICPAC firm dashboard = T1; bank co-brand + RIF prefill = T2.

---

## Layer 14 — Data governance, privacy, and residency

Every integration crosses personal or commercially sensitive data. Non-negotiables:

- **GDPR (Reg. 2016/679) + CY Law 125(I)/2018** — DPA supervised by the Commissioner for Personal Data (`dataprotection.gov.cy`). VerdeIQ maintains a **RoPA** (Record of Processing Activities) auto-generated from the connector registry — every enabled integration adds a processing entry.
- **NIS2 (Dir. 2022/2555) + CY Law 89(I)/2020 as amended** — VerdeIQ is likely in scope as a *digital service provider* once revenue thresholds met; assume from day 1.
- **DORA (Reg. 2022/2554)** — relevant when VerdeIQ serves CySEC-supervised customers.
- **Data residency** — offer EU-region storage (Frankfurt or Dublin). Some banks will require in-EU only; log a deployment flag `data_region`.
- **Encryption** — at rest (AES-256), in transit (TLS 1.3), token vault (per-tenant KMS envelope).
- **Retention** — 10y for financial evidence (matches Companies Law Cap. 113 s.141), 3y for personal ancillary data, configurable per tenant.
- **Sub-processor register** — public page listing every integration provider (Tink, Storecove, OCR vendor, etc.).
- **DPIA templates** — one per connector; auto-populated for the customer.
- **Priority:** T0 across the board — this is table stakes for the bank & CSRD-cascade buyers.

---

## Layer 15 — Build sequence & acceptance

### Sprint 0–2 (T0 must-haves)
1. EAC PDF bill parser (EL + EN templates).
2. CERA fuel-adjustment monthly sync.
3. TSOC generation-mix daily sync.
4. WDD water bill parser.
5. Excel/CSV wizard with Greek header dictionary.
6. Google + Microsoft SSO.
7. SoftOne + Epsilon accounting connectors (read-only).
8. RoPA + sub-processor register scaffolding.

### Sprint 3–8 (T1 accelerators)
9. Open Banking (via Tink/Salt Edge/GoCardless BAD).
10. Sage / Odoo / Xero.
11. LPG + fuel-card parsers.
12. Rooftop PV cloud APIs (SolarEdge, Huawei, SMA, Fronius, Enphase).
13. Travel email-in ingestion.
14. CDP + Travelife + Green Key exports.
15. ICPAC firm dashboard.
16. CY Login registration & TFA TIC verification.

### Q4 2026 – Q2 2027 (T2 retention)
17. CBAM XML submission workflow.
18. ESRS iXBRL export.
19. BMS/IoT edge device.
20. Peppol AP client for e-invoicing.
21. DEPA gas integration once tariffs publish.

### Acceptance checklist per connector
- OAuth or key rotation implemented and documented.
- Rate-limit backoff & retry.
- Checkpointed pull; idempotent upserts.
- Source hash + fetched-at stored on every record.
- Greek and English test fixtures pass.
- Manual CSV fallback path exists.
- Sub-processor listed; DPIA template attached.
- Uptime alerting on the scheduled poller.

---

**End of dossier.**
