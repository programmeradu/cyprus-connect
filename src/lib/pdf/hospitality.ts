/**
 * Hospitality Pack PDF generator.
 *
 * Hotel footprint PDF, rendered with the shared report template and registered by fingerprint.
 */

import type { HospitalityPackData } from "@/lib/reports/types";
import { buildHospitalityPdfData } from "./builders";

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
    title: String(json.title || "Hotel footprint"),
    company: String(json.company || "Hotel Property"),
  });

  await registerDocument("report", json, issuedAt);
  downloadBytes(bytes, fileName);
}
