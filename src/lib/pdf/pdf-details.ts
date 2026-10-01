/**
 * Writes the document's identity into the PDF file itself (the "Document
 * properties" a reader shows), so a saved or forwarded copy still carries its
 * document number, fingerprint and issue date even without the printed page.
 *
 * Standard fields (title, author, subject, keywords, dates) are read by every
 * PDF reader; the Vuneli* fields are custom entries in the same dictionary
 * that tools can read exactly. Nothing here changes what is printed.
 */

import { PDFDocument, PDFName, PDFString } from "pdf-lib";

export type PdfKind = "board-summary" | "report" | "cbam";

export interface PdfDetails {
  kind: PdfKind;
  docId: string;
  hash: string;
  issuedAt: Date;
  title: string;
  company: string;
}

const KIND_LABEL: Record<PdfKind, string> = {
  "board-summary": "Board summary",
  report: "Sustainability report",
  cbam: "CBAM declaration",
};

export const verifyLink = (hash: string) => `https://vuneli.com/verify/${hash}`;

export async function stampPdfDetails(bytes: Uint8Array, d: PdfDetails): Promise<Uint8Array> {
  if (!/^[0-9a-f]{64}$/.test(d.hash)) throw new Error("Fingerprint must be a 64-character SHA-256 hex string");
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const title = `${d.company} — ${d.title}`.slice(0, 300);
  pdf.setTitle(title, { showInWindowTitleBar: true });
  pdf.setAuthor("Vuneli");
  pdf.setCreator("Vuneli");
  pdf.setProducer("Vuneli (Typst)");
  pdf.setSubject(`${KIND_LABEL[d.kind]} ${d.docId}. Check at ${verifyLink(d.hash)}`);
  pdf.setKeywords(["Vuneli", KIND_LABEL[d.kind], d.docId, `sha256:${d.hash}`]);
  pdf.setCreationDate(d.issuedAt);
  pdf.setModificationDate(d.issuedAt);
  pdf.setLanguage("en");

  const info = pdf.getInfoDict();
  const put = (k: string, v: string) => info.set(PDFName.of(k), PDFString.of(v));
  put("VuneliDocumentId", d.docId);
  put("VuneliDocumentType", d.kind);
  put("VuneliFingerprint", d.hash);
  put("VuneliIssued", d.issuedAt.toISOString());
  put("VuneliVerify", verifyLink(d.hash));

  return pdf.save({ useObjectStreams: false });
}

/** Reads the Vuneli fields back (used by tests and support tooling). */
export async function readPdfDetails(bytes: Uint8Array) {
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const info = pdf.getInfoDict();
  const get = (k: string) => {
    const v = info.lookup(PDFName.of(k));
    return v instanceof PDFString ? v.decodeText() : (v as { decodeText?: () => string } | undefined)?.decodeText?.() ?? null;
  };
  return {
    title: pdf.getTitle() ?? null,
    subject: pdf.getSubject() ?? null,
    keywords: pdf.getKeywords() ?? null,
    created: pdf.getCreationDate() ?? null,
    docId: get("VuneliDocumentId"),
    kind: get("VuneliDocumentType"),
    hash: get("VuneliFingerprint"),
    issued: get("VuneliIssued"),
    verify: get("VuneliVerify"),
  };
}
