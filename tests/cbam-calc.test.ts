import { describe, expect, it } from "vitest";
import { buildDraft, computeLine, lookupCn, parseImportCsv, parseNumber, type CbamLineInput } from "@/lib/agents/cbam-calc";
import { yearsInScope } from "@/lib/agents/cbam-agent";

const line = (p: Partial<CbamLineInput>): CbamLineInput => ({
  id: 1, importDate: "2026-03-01", cnCode: "7601 10", description: null, originCountry: "TR",
  supplierName: "A", installationId: "X1", netMass: 10, directSee: null, indirectSee: null, customsRef: null, ...p,
});

describe("CBAM maths", () => {
  it("matches the official goods list and rejects non-CBAM codes", () => {
    expect(lookupCn("7601 10 00")?.code).toBe("7601");
    expect(lookupCn("0901")).toBeNull();
    expect(lookupCn("76")).toBeNull();
    expect(lookupCn("2523 29")?.code).toBe("25232900");
    expect(lookupCn("2523")?.exact).toBe(false); // several cement goods
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

describe("CBAM official values (IR 2025/2621 as corrected by 2026/1740)", () => {
  it("uses the country table, mark-up, benchmark and quarterly price", () => {
    const r = computeLine(line({ cnCode: "7601 10 10", originCountry: "TR" }));
    expect(r.basis).toBe("default");
    expect(r.defaultSource).toMatchObject({ table: "country", total: 1.7 });
    expect(r.embeddedT).toBeCloseTo(17, 6);
    expect(r.markup).toBe(0.1);
    expect(r.route).toBe("K");
    expect(r.sefa).toBeCloseTo(0.975 * 1.423, 6);
    expect(r.certificates).toBeCloseTo(10 * (1.7 * 1.1 - 0.975 * 1.423), 3);
    expect(r.priceEur).toBe(75.36);
    expect(r.priceProvisional).toBe(false);
    expect(r.costEur).toBeCloseTo(r.certificates! * 75.36, 1);
  });

  it("falls back to Other countries, then to Annex IV when origin is unknown", () => {
    expect(computeLine(line({ cnCode: "2523 29 00", originCountry: "TR" })).defaultSource?.table).toBe("other");
    expect(computeLine(line({ cnCode: "7601 10 10", originCountry: "OTHER" })).defaultSource?.table).toBe("unknown_origin");
  });

  it("splits cement defaults into direct and indirect", () => {
    const r = computeLine(line({ cnCode: "2523 29 00", originCountry: "CN" }));
    expect(r.directT + r.indirectT).toBeCloseTo(r.embeddedT, 6);
    expect(r.indirectT).toBeGreaterThan(0);
  });

  it("marks a later quarter's price as provisional", () => {
    expect(computeLine(line({ cnCode: "7601 10 10", importDate: "2026-11-02" })).priceProvisional).toBe(true);
  });

  it("blocks electricity without a supplier value", () => {
    const d = buildDraft(2026, [line({ cnCode: "2716 00 00", netMass: 5 })]);
    expect(d.lines[0].basis).toBe("no_default");
    expect(d.status).toBe("needs_data");
  });

  it("totals cost and flags short codes", () => {
    const d = buildDraft(2026, [line({ id: 1, cnCode: "7601 10 10", netMass: 60 }), line({ id: 2, cnCode: "7208" })]);
    expect(d.totals.costEur).toBeGreaterThan(0);
    expect(d.issues.map((i) => i.kind)).toContain("short_cn");
    expect(d.totals.costExact).toBe(false);
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

  it("names missing columns and includes expected header list", () => {
    const err = parseImportCsv("a,b\n1,2").errors[0];
    expect(err).toMatch(/import_date/);
    expect(err).toMatch(/Expected header row/);
  });

  it("accepts common column aliases such as country_of_origin and quantity_tonnes", () => {
    const csv =
      "import_date,cn_code,country_of_origin,supplier_name,quantity_tonnes\n" +
      "2026-03-14,7208 51,TR,Example Steel AS,24.5\n";
    const { rows, errors } = parseImportCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      originCountry: "TR",
      supplierName: "Example Steel AS",
      netMass: 24.5,
    });
  });
});

describe("import dates", () => {
  it("rejects dates that do not exist", async () => {
    const { parseImportCsv, isRealDate } = await import("@/lib/agents/cbam-calc");
    expect(isRealDate("2026-02-28")).toBe(true);
    expect(isRealDate("2028-02-29")).toBe(true);
    expect(isRealDate("2026-02-30")).toBe(false);
    expect(isRealDate("2026-13-40")).toBe(false);
    const csv =
      "import_date,cn_code,description,origin_country,supplier,installation_id,net_mass,direct_see,indirect_see,customs_ref\n" +
      "2026-13-40,7208 51,Plate,TR,S,,5,,,R1\n";
    const { rows, errors } = parseImportCsv(csv);
    expect(rows).toHaveLength(0);
    expect(errors[0]).toMatch(/not a real calendar date/);
  });
});
