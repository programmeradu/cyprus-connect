import { docId, longDate } from "@/lib/pdf/format";
import type { LenderAnswer, LenderPackData, HospitalityPackData, VsmePassportData } from "@/lib/reports/types";

/** Lender pack PDF: a plain ESG summary for any bank. Blank answers are listed as gaps. */
export function buildLenderPackPdfData(b: LenderPackData, issuedAt = new Date()) {
  const fmt = (a: LenderAnswer) => (a.value === null ? "Not yet recorded" : `${a.value.toLocaleString("en-GB")}${a.unit ? ` ${a.unit}` : ""}`);
  const backed = b.answers.filter((a) => a.fromRecords).length;
  return {
    lang: "en",
    hash: b.hash,
    docId: docId("LENDER", b.hash, issuedAt),
    issued: longDate(issuedAt),
    title: "ESG summary for lenders",
    framework: "LENDER",
    headLabel: "ESG summary for lenders",
    period: `Bills on file: ${b.coverage.electricityMonths} months electricity, ${b.coverage.waterMonths} months water`,
    company: b.company.legalName || b.company.name,
    draft: false,
    draftNote: `${backed} of ${b.answers.length} answers come from bills or documents. The rest are company statements or blank.`,
    coverFacts: [
      { label: "Company", value: b.company.legalName || b.company.name },
      { label: "Registration", value: b.company.registrationNo || "Not given" },
      { label: "Electricity bills", value: `${b.coverage.electricityMonths} months` },
      { label: "From records", value: `${backed} of ${b.answers.length}` },
    ],
    summary: [
      "This summary answers the energy, emissions and water questions banks usually ask borrowers. Each figure shows where it came from.",
      "It is not a bank form and does not claim any loan terms. Your bank decides whether and how it uses these figures.",
    ],
    chapters: [
      {
        n: "01",
        title: "Answers",
        paras: [],
        figures: b.answers.map((a) => ({ label: a.questionEn, value: fmt(a), source: a.sourceEn })),
        gaps: b.answers.filter((a) => a.value === null).map((a) => `${a.questionEn}: no record yet`),
      },
    ],
    sources: [
      "Electricity Authority of Cyprus (EAC) bills added to Vuneli",
      "Water board bills added to Vuneli",
      "Cyprus grid emission factor, see vuneli.com/methodology",
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

/** Hotel footprint PDF: intensity figures from the hotel's own facts and bills. */
export function buildHospitalityPdfData(h: HospitalityPackData, issuedAt = new Date()) {
  const p = h.profile;
  const m = h.metrics;
  const show = (v: number | null, unit: string) => (v === null ? "Not enough data" : `${v.toLocaleString("en-GB")} ${unit}`);
  return {
    lang: "en",
    hash: h.hash,
    docId: docId("HOTEL", h.hash, issuedAt),
    issued: longDate(issuedAt),
    title: `${p?.propertyName || h.company.name}: hotel footprint per room-night`,
    framework: "HOTEL",
    headLabel: "Hotel footprint",
    period: `Bills on file: ${h.bills.electricityMonths} months electricity, ${h.bills.waterMonths} months water`,
    company: h.company.legalName || h.company.name,
    draft: false,
    draftNote: "Room and guest-night figures are entered by the hotel. Energy and water come from bills.",
    coverFacts: [
      { label: "Rooms", value: p ? String(p.totalRooms) : "Not given" },
      { label: "Carbon / room-night", value: show(m.carbonPerOccupiedRoomKg, "kg CO2e") },
      { label: "Water / guest-night", value: show(m.waterPerGuestNightLiters, "L") },
      { label: "Bills", value: `${h.bills.electricity + h.bills.water}` },
    ],
    summary: [
      "Figures follow the per-room-night and per-guest-night approach used by the Hotel Carbon and Water Measurement Initiatives (HCMI, HWMI). Scope 2 uses the Cyprus grid factor.",
    ],
    chapters: [
      {
        n: "01",
        title: "Energy and carbon",
        paras: p ? [`Occupied room-nights: ${p.annualOccupiedRooms.toLocaleString("en-GB")}. Guest-nights: ${p.annualGuestNights.toLocaleString("en-GB")}.`] : [],
        figures: [
          { label: "Electricity", value: `${Math.round(m.totalElectricityKwh).toLocaleString("en-GB")} kWh`, source: `${h.bills.electricity} EAC bills` },
          { label: "Energy per occupied room-night", value: show(m.energyPerOccupiedRoomKwh, "kWh"), source: "Electricity / occupied room-nights" },
          { label: "Carbon per occupied room-night", value: show(m.carbonPerOccupiedRoomKg, "kg CO2e"), source: "Scope 1 + 2 / occupied room-nights" },
          { label: "Carbon per guest-night", value: show(m.carbonPerGuestNightKg, "kg CO2e"), source: "Scope 1 + 2 / guest-nights" },
        ],
        gaps: h.bills.electricity === 0 ? ["No EAC bills added yet"] : [],
      },
      {
        n: "02",
        title: "Water",
        paras: p ? [`Facilities: pool ${p.hasPool ? "yes" : "no"}, restaurant ${p.hasRestaurant ? "yes" : "no"}, spa ${p.hasSpa ? "yes" : "no"}, own laundry ${p.hasLaundryOnSite ? "yes" : "no"}.`] : [],
        figures: [
          { label: "Water used", value: `${m.totalWaterM3.toLocaleString("en-GB")} m3`, source: `${h.bills.water} water board bills` },
          { label: "Water per guest-night", value: show(m.waterPerGuestNightLiters, "L"), source: "Water / guest-nights" },
        ],
        gaps: h.bills.water === 0 ? ["No water bills added yet"] : [],
      },
    ],
    sources: [
      "Electricity Authority of Cyprus (EAC) bills added to Vuneli",
      "Water board bills added to Vuneli",
      "Room and guest-night figures entered by the hotel",
    ],
  };
}
