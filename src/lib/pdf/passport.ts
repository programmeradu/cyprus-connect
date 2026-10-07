/**
 * VSME Passport PDF generator.
 *
 * Compiles a printable, institutional-grade PDF dossier typeset using Typst
 * and stamps a 64-character SHA-256 Merkle root hash into document metadata
 * and public verification registers.
 */

import { buildPassportPdfData, type VsmePassportData } from "@/lib/reports/passport.server";

export async function downloadPassportPdf(passport: VsmePassportData, fileName: string) {
  const { renderTypst, downloadBytes, siteBase, registerDocument } = await import("./typst-render");
  const { stampPdfDetails } = await import("./pdf-details");

  const issuedAt = new Date();
  const json = buildPassportPdfData(passport, issuedAt);

  // Uses the report.typ template formatted for voluntary standard disclosures
  const raw = await renderTypst("report.typ", json, { base: siteBase() });

  const bytes = await stampPdfDetails(raw, {
    kind: "passport",
    docId: String(json.docId),
    hash: json.hash,
    issuedAt,
    title: String(json.title || "VSME Sustainability Passport"),
    company: String(json.company || "Unnamed company"),
  });

  await registerDocument("passport", json, issuedAt);
  downloadBytes(bytes, fileName);
}
