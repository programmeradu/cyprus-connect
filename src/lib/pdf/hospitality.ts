/**
 * Hospitality Pack PDF generator.
 *
 * Typesets a Tour Operator ESG & HCMI compliance dossier using Typst,
 * stamping it into the public verification register with a 64-character SHA-256 Merkle root.
 */

import { buildHospitalityPdfData, type HospitalityPackData } from "@/lib/reports/hospitality.server";

export async function downloadHospitalityPdf(data: HospitalityPackData, fileName: string) {
  const { renderTypst, downloadBytes, siteBase, registerDocument } = await import("./typst-render");
  const { stampPdfDetails } = await import("./pdf-details");

  const issuedAt = new Date();
  const json = buildHospitalityPdfData(data, issuedAt);

  const raw = await renderTypst("report.typ", json, { base: siteBase() });

  const bytes = await stampPdfDetails(raw, {
    kind: "report",
    docId: String(json.docId),
    hash: json.hash,
    issuedAt,
    title: String(json.title || "Tour Operator ESG & HCMI Compliance Pack"),
    company: String(json.company || "Hotel Property"),
  });

  await registerDocument("report", json, issuedAt);
  downloadBytes(bytes, fileName);
}
