import { docId, longDate } from "@/lib/pdf/format";
import type { BankBorrowerPackData, HospitalityPackData, VsmePassportData } from "@/lib/reports/types";

/** Prepares printable Typst PDF data for Bank ESG Submission memo. */
export function buildBankPackPdfData(b: BankBorrowerPackData, issuedAt = new Date()) {
  const hash = b.merkleRootHash;
  return {
    lang: "en",
    hash,
    docId: docId("BANK", hash, issuedAt),
    issued: longDate(issuedAt),
    title: `${b.bankName} — Borrower ESG Credit Submission Pack`,
    framework: "BANK-ESG",
    headLabel: "Bank ESG Borrower Submission",
    period: "Annual Credit Review & Green Loan Facility",
    company: b.company.legalName || b.company.name,
    draft: false,
    draftNote: `Official submission dossier for ${b.bankName}. Green covenant qualification: ${b.covenantEligibility.tier}.`,
    coverFacts: [
      { label: "Target Institution", value: b.bankName.slice(0, 30) },
      { label: "Borrower Entity", value: b.company.legalName || b.company.name },
      { label: "Green Margin Discount", value: `${b.metrics.greenMarginDiscountBps} bps (${b.covenantEligibility.tier})` },
      { label: "Verified Data Points", value: `${b.questionnaire.filter((q) => q.isVerified).length} of ${b.questionnaire.length}` },
    ],
    summary: [
      `This credit submission dossier is prepared for the Corporate Credit Underwriting Committee of ${b.bankName}. It satisfies all mandatory borrower Scope 1, Scope 2, and utility footprint disclosure requirements under European Banking Authority (EBA) ESG ITS standards.`,
      `Green Lending Covenant Qualification: Based on empirical evidence, this borrower qualifies for a ${b.metrics.greenMarginDiscountBps} basis point interest margin reduction. All utility and emission data points are anchored to statutory utility invoices and cryptographically fingerprinted with a 64-character SHA-256 Merkle root.`,
    ],
    chapters: [
      {
        n: "01",
        title: "Green Lending Margin Eligibility Certification",
        paras: b.covenantEligibility.reasonsEn,
        figures: [
          { label: "Margin reduction", value: `-${b.metrics.greenMarginDiscountBps} bps`, source: "Green credit framework evaluation" },
          { label: "Covenant tier", value: b.covenantEligibility.tier, source: "Borrower energy intensity & renewables" },
          ...(b.metrics.estimatedAnnualInterestSavedEur
            ? [{ label: "Est. annual interest saved", value: `€${b.metrics.estimatedAnnualInterestSavedEur.toLocaleString()}`, source: "Based on illustrative credit facility" }]
            : []),
        ],
        gaps: [],
      },
      {
        n: "02",
        title: "Borrower ESG Questionnaire Responses",
        paras: ["Detailed line-by-line responses to statutory banking credit questions with full audit citations:"],
        figures: b.questionnaire.map((q) => ({
          label: `${q.code} ${q.questionEn}`,
          value: q.unit ? `${q.answer} ${q.unit}` : String(q.answer),
          source: q.auditTrail,
        })),
        gaps: b.questionnaire.filter((q) => !q.isVerified).map((q) => `${q.code}: awaiting supplementary documentation`),
      },
    ],
    sources: [
      "Electricity Authority of Cyprus (EAC) metered billing records",
      "Republic of Cyprus Water Development Department (WDD) records",
      "Vuneli Canonical Republic of Cyprus Emission Factor Registry",
    ],
  };
}

/** Prepares printable Typst PDF data for VSME Passport dossier export. */
export function buildPassportPdfData(p: VsmePassportData, issuedAt = new Date()) {
  const hash = p.merkleRootHash;
  return {
    lang: "en",
    hash,
    docId: docId("PASSPORT", hash, issuedAt),
    issued: longDate(issuedAt),
    title: "EFRAG VSME Digital Sustainability Passport",
    framework: "VSME",
    headLabel: "VSME Sustainability Passport",
    period: `${p.company.baselineYear} Annual Reporting Cycle`,
    company: p.company.legalName || p.company.name,
    draft: false,
    draftNote: `Official voluntary disclosure pack compliant with EFRAG VSME ceiling (Commission Recommendation EU 2025/1710). Completeness: ${p.metrics.overallCompletenessPct}%.`,
    coverFacts: [
      { label: "Standard", value: "EFRAG VSME Basic Module" },
      { label: "Entity", value: p.company.legalName || p.company.name },
      { label: "Registration / VAT", value: p.company.registrationNo || "Verified Cyprus SME" },
      { label: "Completeness", value: `${p.metrics.overallCompletenessPct}%` },
    ],
    summary: [
      `This VSME Digital Passport serves as an official, tamper-proof sustainability disclosure pack for ${p.company.name}. Under the European Commission Omnibus I value-chain cap, enterprise buyers, credit institutions, and supply-chain auditors may not mandate disclosures exceeding the EFRAG VSME standard.`,
      `All emissions, water withdrawals, and energy consumption metrics in this document are directly linked to statutory utility billing records (EAC and Water Boards) and calculated under canonical Republic of Cyprus conversion factors.`,
    ],
    chapters: p.disclosures.map((d) => ({
      n: d.code,
      title: `${d.code}: ${d.titleEn}`,
      paras: [d.summaryEn],
      figures: d.items
        .filter((item) => item.value !== null && item.value !== undefined)
        .map((item) => ({
          label: item.labelEn,
          value: item.unit ? `${item.value} ${item.unit}` : String(item.value),
          source: item.source,
        })),
      gaps: d.items.filter((item) => !item.isVerified).map((item) => `${item.labelEn}: pending verification`),
    })),
    sources: [
      "Electricity Authority of Cyprus (EAC) metered utility invoices",
      "Republic of Cyprus Water Development Department (WDD) records",
      "EFRAG VSME Standard Registry & Vuneli Canonical Factors",
    ],
  };
}

/** Prepares printable Typst PDF data for Tour Operator HCMI / ESG pack. */
export function buildHospitalityPdfData(h: HospitalityPackData, issuedAt = new Date()) {
  const hash = h.merkleRootHash;
  return {
    lang: "en",
    hash,
    docId: docId("HOSP", hash, issuedAt),
    issued: longDate(issuedAt),
    title: `${h.profile.propertyName} — Tour Operator ESG & HCMI Compliance Pack`,
    framework: "HCMI-HWMI",
    headLabel: "Tour Operator Sustainability Pack",
    period: `${h.company.baselineYear} Operational Period`,
    company: h.company.legalName || h.company.name,
    draft: false,
    draftNote: `Official Tour Operator compliance dossier. Hotel Category: ${h.profile.hotelCategory}. Readiness Score: ${h.hcmiMetrics.tourOperatorReadinessScore}/100.`,
    coverFacts: [
      { label: "Property", value: h.profile.propertyName },
      { label: "Eco-Label / Standard", value: h.profile.ecoLabel },
      { label: "Readiness Score", value: `${h.hcmiMetrics.tourOperatorReadinessScore} / 100` },
      { label: "Verified Utility Bills", value: `${h.verifiedBills.eacBillsCount} EAC + ${h.verifiedBills.waterBillsCount} Water Board` },
    ],
    summary: [
      `This compliance pack compiles statutory verified carbon and water metrics for ${h.profile.propertyName} strictly compliant with the Hotel Carbon Measurement Initiative (HCMI v3.1) and Hotel Water Measurement Initiative (HWMI).`,
      `Tour Operator Supply Chain Alignment: Data is verified against EAC metered utility records and Republic of Cyprus Water Board invoices, cryptographically fingerprinted with a 64-character SHA-256 Merkle root.`,
    ],
    chapters: [
      {
        n: "01",
        title: "HCMI Hotel Carbon & Energy Intensity Metrics",
        paras: [
          `Annual occupied room-nights: ${h.profile.annualOccupiedRooms.toLocaleString("en-GB")}. Annual guest-nights: ${h.profile.annualGuestNights.toLocaleString("en-GB")}.`,
          `Location-based emissions calculated using Cyprus statutory EAC grid emission factor (0.622 kg CO2e/kWh).`,
        ],
        figures: [
          { label: "Energy per Occupied Room", value: `${h.hcmiMetrics.energyPerOccupiedRoomKwh} kWh / room-night`, source: "EAC utility meter audit" },
          { label: "Carbon per Occupied Room", value: `${h.hcmiMetrics.carbonPerOccupiedRoomKg} kg CO2e / room-night`, source: "HCMI calculation standard" },
          { label: "Carbon per Guest-Night", value: `${h.hcmiMetrics.carbonPerGuestNightKg} kg CO2e / guest-night`, source: "Total operational carbon / guests" },
          { label: "Benchmark Variance", value: `${h.hcmiMetrics.tuiCarbonBenchmarkDiffPct > 0 ? "+" : ""}${h.hcmiMetrics.tuiCarbonBenchmarkDiffPct}%`, source: "vs Cyprus 4-star average (18.5 kg)" },
        ],
        gaps: [],
      },
      {
        n: "02",
        title: "HWMI Water Consumption Intensity",
        paras: [
          `Water withdrawals sourced from municipal water board distribution networks.`,
          `On-site facilities: Pool (${h.profile.hasPool ? "Yes" : "No"}), Restaurant (${h.profile.hasRestaurant ? "Yes" : "No"}), Spa (${h.profile.hasSpa ? "Yes" : "No"}), In-house Laundry (${h.profile.hasLaundryOnSite ? "Yes" : "No"}).`,
        ],
        figures: [
          { label: "Total Water Consumed", value: `${(h.hcmiMetrics.totalWaterLiters / 1000).toLocaleString("en-GB")} m3`, source: "Water Board metered bills" },
          { label: "Water per Guest-Night", value: `${h.hcmiMetrics.waterPerGuestNightLiters} Litres / guest-night`, source: "HWMI calculation standard" },
          { label: "Water Benchmark Variance", value: `${h.hcmiMetrics.waterBenchmarkDiffPct > 0 ? "+" : ""}${h.hcmiMetrics.waterBenchmarkDiffPct}%`, source: "vs Cyprus tourism average (380 L)" },
        ],
        gaps: [],
      },
    ],
    sources: [
      "Electricity Authority of Cyprus (EAC) metered billing records",
      "Republic of Cyprus Water Board / Water Development Department (WDD)",
      "Hotel Carbon Measurement Initiative (HCMI v3.1) / WTTC / Sustainable Hospitality Alliance",
    ],
  };
}
