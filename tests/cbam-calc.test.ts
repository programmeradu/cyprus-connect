import { describe, expect, it } from "vitest";
import { buildDraft, computeLine, lookupCn, parseImportCsv, parseNumber, type CbamLineInput } from "@/lib/agents/cbam-calc";
import { yearsInScope } from "@/lib/agents/cbam-agent";

const line = (p: Partial<CbamLineInput>): CbamLineInput => ({
  id: 1, importDate: "2026-03-01", cnCode: "7601 10", description: null, originCountry: "TR",
  supplierName: "A", installationId: "X1", netMass: 10, directSee: null, indirectSee: null, customsRef: null, ...p,
});

describe("CBAM maths", () => {
  it("matches the longest CN prefix and rejects non-CBAM codes", () => {
    expect(lookupCn("7601 10 00")?.code).toBe("7601");
    expect(lookupCn("0901")).toBeNull();
    expect(lookupCn("76")).toBeNull();
    expect(lookupCn("2523 29")?.code).toBe("2523 29 00");
    expect(lookupCn("2523")).toBeNull(); // ambiguous: several cement codes
  });

  it("uses supplier actual values and skips out-of-scope indirect", () => {
    const r = computeLine(line({ directSee: 2 }));
    expect(r.basis).toBe("actual");
    expect(r.directT).toBe(20);
    expect(r.indirectT).toBe(0);
  });

  it("flags defaults and unknown codes, blocks on unknown codes", () => {
    const d = buildDraft(2026, [line({ id: 1 }), line({ id: 2, cnCode: "0901" })]);
    expect(d.status).toBe("needs_data");
    expect(d.issues.map((i) => i.kind)).toEqual(expect.arrayContaining(["unknown_cn", "default_values"]));
  });

  it("applies the 50 t threshold without electricity", () => {
    expect(buildDraft(2026, [line({ netMass: 49, directSee: 1 })]).status).toBe("below_threshold");
    expect(buildDraft(2026, [line({ netMass: 50, directSee: 1 })]).status).toBe("awaiting_signature");
    expect(buildDraft(2026, [line({ netMass: 5, cnCode: "2716 00 00", directSee: 0.5 })]).belowThreshold).toBe(false);
  });

  it("is deterministic regardless of input order", () => {
    const a = [line({ id: 1 }), line({ id: 2, supplierName: "B" })];
    expect(JSON.stringify(buildDraft(2026, a))).toBe(JSON.stringify(buildDraft(2026, [...a].reverse())));
  });

  it("works on the right years", () => {
    expect(yearsInScope(new Date("2026-09-26T00:00:00Z"))).toEqual([2026]);
    expect(yearsInScope(new Date("2027-02-01T00:00:00Z"))).toEqual([2026, 2027]);
    expect(yearsInScope(new Date("2027-10-01T00:00:00Z"))).toEqual([2027]);
  });
});

describe("CBAM CSV", () => {
  it("reads EU numbers and reports bad rows", () => {
    expect(parseNumber("1.234,5")).toBe(1234.5);
    expect(parseNumber("1,234.5")).toBe(1234.5);
    const { rows, errors } = parseImportCsv(
      "\uFEFFimport_date,cn_code,origin_country,supplier,net_mass,direct_see\n" +
        '2026-01-02,7208,tr,"Steel, AS",12,1.9\n' +
        "02/01/2026,7208,TR,S,0,\n",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ originCountry: "TR", supplierName: "Steel, AS", directSee: 1.9 });
    expect(errors[0]).toMatch(/Row 3/);
  });

  it("names missing columns", () => {
    expect(parseImportCsv("a,b\n1,2").errors[0]).toMatch(/import_date/);
  });
});
