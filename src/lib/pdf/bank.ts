/** Lender pack PDF: renders with the shared report template and registers the fingerprint. */

import type { LenderPackData } from "@/lib/reports/types";
import { buildLenderPackPdfData } from "./builders";

export async function downloadLenderPackPdf(data: LenderPackData, fileName: string) {
  const { renderTypst, downloadBytes, siteBase, registerDocument } = await import("./typst-render");
  const { stampPdfDetails } = await import("./pdf-details");

  const issuedAt = new Date();
  const json = buildLenderPackPdfData(data, issuedAt);
  const raw = await renderTypst("report.typ", json, { base: siteBase() });
  const bytes = await stampPdfDetails(raw, {
    kind: "report",
    docId: String(json.docId),
    hash: json.hash,
    issuedAt,
    title: json.title,
    company: String(json.company || "Unnamed company"),
  });
  await registerDocument("report", json, issuedAt);
  downloadBytes(bytes, fileName);
}
