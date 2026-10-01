import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { readPdfDetails, stampPdfDetails } from "@/lib/pdf/pdf-details";

const hash = "11e434b5e25f3316c90a54fc4a62f48766b60836db11a6a84e90e8995a1bcf48";

async function blankPdf() {
  const pdf = await PDFDocument.create();
  pdf.addPage([595, 842]);
  return pdf.save();
}

describe("PDF details", () => {
  it("stores document number, fingerprint and issue date inside the file", async () => {
    const issuedAt = new Date("2026-10-01T12:00:00Z");
    const out = await stampPdfDetails(await blankPdf(), { kind: "board-summary", docId: "VNL-BS-20261001-11E434", hash, issuedAt, title: "Board summary", company: "Ακρίτας Λτδ" });
    const d = await readPdfDetails(out);
    expect(d).toMatchObject({ docId: "VNL-BS-20261001-11E434", kind: "board-summary", hash, issued: "2026-10-01T12:00:00.000Z", verify: `https://vuneli.com/verify/${hash}` });
    expect(d.title).toBe("Ακρίτας Λτδ — Board summary");
    expect(d.keywords).toContain(`sha256:${hash}`);
    expect(d.created?.toISOString()).toBe(issuedAt.toISOString());
  });

  it("refuses a malformed fingerprint", async () => {
    await expect(stampPdfDetails(await blankPdf(), { kind: "cbam", docId: "x", hash: "abc", issuedAt: new Date(), title: "t", company: "c" })).rejects.toThrow();
  });
});
