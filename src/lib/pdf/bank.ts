/**
 * Bank ESG Borrower Pack PDF generator.
 *
 * Typesets an executive banking credit submission memo and borrower ESG
 * dossier with green lending covenants using Typst, stamping it into the
 * public verification register.
 */

import { buildBankPackPdfData, type BankBorrowerPackData } from "@/lib/reports/bank.server";

export async function downloadBankPackPdf(data: BankBorrowerPackData, fileName: string) {
  const { renderTypst, downloadBytes, siteBase, registerDocument } = await import("./typst-render");
  const { stampPdfDetails } = await import("./pdf-details");

  const issuedAt = new Date();
  const json = buildBankPackPdfData(data, issuedAt);

  const raw = await renderTypst("report.typ", json, { base: siteBase() });

  const bytes = await stampPdfDetails(raw, {
    kind: "report",
    docId: String(json.docId),
    hash: json.hash,
    issuedAt,
    title: String(json.title || "Bank ESG Borrower Credit Pack"),
    company: String(json.company || "Unnamed company"),
  });

  await registerDocument("report", json, issuedAt);
  downloadBytes(bytes, fileName);
}
