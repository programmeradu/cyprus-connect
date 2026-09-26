/**
 * Export file for the EU CBAM Registry. Pure, deterministic XML built from the
 * stored draft and the original import lines.
 *
 * IMPORTANT: the element names follow the declaration's data fields, but the
 * file is NOT yet validated against the Commission's official XSD for the
 * definitive period. The root carries schemaStatus="unvalidated" until the
 * founder supplies that XSD (docs/FOUNDER_EXTERNAL_SETUP.md).
 */

import type { CbamDraft } from "./cbam-calc";

export const EXPORT_NAMESPACE = "urn:vuneli:cbam:declaration-export:1";

export interface ExportDeclarant {
  legalName: string | null;
  eori: string | null;
  accountNumber: string | null;
}

export interface ExportLineExtra {
  id: number;
  importDate: string;
  description: string | null;
  customsRef: string | null;
}

export interface ExportMeta {
  status: string;
  draftHash: string;
  signedBy: string | null;
  signedAt: string | null;
  signedHash: string | null;
}

export function xmlEscape(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // Characters XML 1.0 does not allow at all.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

const num = (v: number, dp = 6) => String(Math.round(v * 10 ** dp) / 10 ** dp);
const el = (name: string, value: string | number | null | undefined, pad: string) =>
  value === null || value === undefined || value === "" ? "" : `${pad}<${name}>${xmlEscape(String(value))}</${name}>\n`;

/** What must be filled before the file can be used. Empty means ready. */
export function exportGaps(draft: CbamDraft, declarant: ExportDeclarant, meta: ExportMeta): string[] {
  const gaps: string[] = [];
  if (!declarant.legalName?.trim()) gaps.push("Declarant legal name");
  if (!declarant.eori?.trim()) gaps.push("EORI number");
  if (!declarant.accountNumber?.trim()) gaps.push("CBAM account number");
  if (draft.issues.some((i) => i.kind === "unknown_cn" || i.kind === "wrong_year")) gaps.push("Invalid lines in the draft");
  if (!(meta.status === "signed" && meta.signedHash === meta.draftHash)) gaps.push("Signature on this exact draft");
  return gaps;
}

export function buildRegistryXml(
  draft: CbamDraft,
  declarant: ExportDeclarant,
  extras: ExportLineExtra[],
  meta: ExportMeta,
): string {
  const byId = new Map(extras.map((e) => [e.id, e]));
  const final = exportGaps(draft, declarant, meta).length === 0;
  const p2 = "  ", p3 = "    ", p4 = "      ";
  let x = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  x += `<CBAMDeclarationExport xmlns="${EXPORT_NAMESPACE}" version="1" schemaStatus="unvalidated" documentStatus="${final ? "final" : "draft"}">\n`;
  x += `${p2}<Header>\n`;
  x += el("ReportingYear", draft.year, p3);
  x += el("DeclarationDueDate", draft.dueDate, p3);
  x += el("DraftFingerprintSHA256", meta.draftHash, p3);
  x += el("Status", meta.status, p3);
  x += el("SignedBy", meta.signedBy, p3);
  x += el("SignedAt", meta.signedAt, p3);
  x += el("Generator", "Vuneli Border agent", p3);
  x += `${p2}</Header>\n`;
  x += `${p2}<Declarant>\n`;
  x += el("Name", declarant.legalName, p3);
  x += el("EORI", declarant.eori, p3);
  x += el("CBAMAccountNumber", declarant.accountNumber, p3);
  x += el("MemberState", "CY", p3);
  x += `${p2}</Declarant>\n`;
  x += `${p2}<Totals>\n`;
  x += el("Lines", draft.totals.lines, p3);
  x += el("NetMassTonnes", num(draft.totals.massTonnesCounted), p3);
  x += el("ElectricityMWh", num(draft.totals.electricityMWh), p3);
  x += el("DirectEmbeddedEmissionsTCO2e", num(draft.totals.directT), p3);
  x += el("IndirectEmbeddedEmissionsTCO2e", num(draft.totals.indirectT), p3);
  x += el("TotalEmbeddedEmissionsTCO2e", num(draft.totals.embeddedT), p3);
  x += el("DefaultValueShare", num(draft.totals.defaultShare, 4), p3);
  x += `${p2}</Totals>\n`;
  x += `${p2}<GoodsImported>\n`;
  for (const l of draft.lines) {
    const e = byId.get(l.id);
    x += `${p3}<Good lineId="${l.id}">\n`;
    x += el("CommodityCode", l.cnCode.replace(/\D/g, ""), p4);
    x += el("Description", e?.description ?? null, p4);
    x += el("ImportDate", e?.importDate ?? null, p4);
    x += el("CustomsReference", e?.customsRef ?? null, p4);
    x += el("CountryOfOrigin", l.originCountry, p4);
    x += el("OperatorName", l.supplierName, p4);
    x += el("InstallationId", l.installationId, p4);
    x += `${p4}<NetMass unit="${l.unit === "MWh" ? "MWh" : "t"}">${num(l.netMass)}</NetMass>\n`;
    x += el("EmissionsBasis", l.basis === "actual" ? "ACTUAL" : l.basis === "unknown_cn" ? "INVALID" : "DEFAULT", p4);
    x += el("SpecificDirectEmbeddedEmissions", l.directSee === null ? null : num(l.directSee), p4);
    x += el("SpecificIndirectEmbeddedEmissions", l.indirectSee === null ? null : num(l.indirectSee), p4);
    x += el("DirectEmbeddedEmissionsTCO2e", num(l.directT), p4);
    x += el("IndirectEmbeddedEmissionsTCO2e", num(l.indirectT), p4);
    x += el("TotalEmbeddedEmissionsTCO2e", num(l.embeddedT), p4);
    x += `${p3}</Good>\n`;
  }
  x += `${p2}</GoodsImported>\n`;
  x += `</CBAMDeclarationExport>\n`;
  return x;
}
