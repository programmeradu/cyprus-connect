import { describe, expect, it } from "vitest";
import { buildDraft, type CbamLineInput } from "@/lib/agents/cbam-calc";
import { buildSupplierRequest, replyByFor, sentRecently, suppliersNeedingData } from "@/lib/agents/cbam-supplier-request";
import { buildRegistryXml, exportGaps, xmlEscape } from "@/lib/agents/cbam-registry-xml";

const line = (p: Partial<CbamLineInput>): CbamLineInput => ({
  id: 1, importDate: "2026-03-01", cnCode: "7601 10", description: null, originCountry: "TR",
  supplierName: "A", installationId: "X1", netMass: 10, directSee: null, indirectSee: null, customsRef: null, ...p,
});

describe("supplier requests", () => {
  const draft = buildDraft(2026, [
    line({ id: 1, supplierName: "Beta & Co" }),
    line({ id: 2, supplierName: "Beta & Co", installationId: null, cnCode: "2523 29", netMass: 30 }),
    line({ id: 3, supplierName: "Alpha", directSee: 2 }),
  ]);

  it("lists only suppliers that still owe data", () => {
    expect(suppliersNeedingData(draft)).toEqual(["Beta & Co"]);
  });

  it("is deterministic and asks for exactly what is missing", () => {
    const p = { year: 2026, supplierName: "Beta & Co", contactName: null, importerName: "Kypros Metals Ltd", lines: draft.lines, dueDate: draft.dueDate };
    const a = buildSupplierRequest(p);
    expect(buildSupplierRequest(p)).toEqual(a);
    expect(a.lineIds).toEqual([1, 2]);
    expect(a.body).toContain("Dear Sir or Madam");
    expect(a.body).toContain("unique identifier of each installation");
    expect(a.body).toContain("indirect embedded emissions");
    expect(a.body).toContain("1 July 2027");
    expect(a.body).not.toContain("Alpha");
  });

  it("waits 21 days between sends", () => {
    const now = new Date("2026-06-30T00:00:00Z");
    expect(sentRecently("2026-06-20T00:00:00Z", now)).toBe(true);
    expect(sentRecently("2026-06-01T00:00:00Z", now)).toBe(false);
    expect(sentRecently(null, now)).toBe(false);
    expect(replyByFor("2027-09-30")).toBe("2027-07-02");
  });
});

describe("Registry file", () => {
  const draft = buildDraft(2026, [line({ id: 1, supplierName: "<Evil> & \"Co\"", directSee: 2 })]);
  const meta = { status: "awaiting_signature", draftHash: "a".repeat(64), signedBy: null, signedAt: null, signedHash: null };
  const who = { legalName: "Kypros Metals Ltd", eori: "CY10000000X", accountNumber: "CBAM-1" };

  it("escapes text and marks unsigned files as drafts", () => {
    const x = buildRegistryXml(draft, who, [{ id: 1, importDate: "2026-03-01", description: "Plate\u0001", customsRef: null }], meta);
    expect(x).toContain("&lt;Evil&gt; &amp; &quot;Co&quot;");
    expect(x).toContain('documentStatus="draft"');
    expect(x).toContain('schemaStatus="unvalidated"');
    expect(x).toContain("<CommodityCode>760110</CommodityCode>");
    expect(x).not.toContain("\u0001");
    expect(xmlEscape("a'b")).toBe("a&apos;b");
  });

  it("is final only when signed on this exact draft with a full declarant", () => {
    expect(exportGaps(draft, who, meta)).toEqual(["Signature on this exact draft"]);
    const signed = { ...meta, status: "signed", signedHash: meta.draftHash };
    expect(exportGaps(draft, who, signed)).toEqual([]);
    expect(exportGaps(draft, { ...who, eori: null }, signed)).toEqual(["EORI number"]);
    expect(buildRegistryXml(draft, who, [], signed)).toContain('documentStatus="final"');
  });
});
