import { describe, expect, it } from "vitest";
import { RULES, evaluateAll, isMicroOrSmall, nextCbamDeclaration, type ObligationFacts } from "@/lib/obligations/rulebook";
import { amendmentsQuery, parseAmendments } from "@/lib/obligations/law-watch.server";

const base: ObligationFacts = {
  employees: null, employeesMax: null, revenueEur: null, cbamTonnesByYear: {}, cbamNoThresholdGoods: false,
  importsCbamGoods: null, eudrCommodities: null, consumerClaims: null, electricityKwh12m: null,
};
const now = new Date("2026-10-01T00:00:00Z");
const get = (f: Partial<ObligationFacts>, id: string) => evaluateAll({ ...base, ...f }, now).find((x) => x.rule.id === id)!.result;

describe("deadline rulebook", () => {
  it("every rule has an official EUR-Lex source and Greek text", () => {
    for (const r of RULES) {
      expect(r.source.url).toMatch(/^https:\/\/eur-lex\.europa\.eu\//);
      expect(r.title.el.length).toBeGreaterThan(3);
    }
  });

  it("unknown company: nothing applies, everything might", () => {
    expect(evaluateAll(base, now).every((x) => x.result.match === "might")).toBe(true);
  });

  it("CBAM: 50 t threshold per import year, electricity has none", () => {
    expect(get({ cbamTonnesByYear: { 2026: 60 } }, "cbam_declaration")).toMatchObject({ match: "applies", dueDate: "2027-09-30" });
    expect(get({ cbamTonnesByYear: { 2026: 40 } }, "cbam_declaration").match).toBe("not");
    expect(get({ cbamNoThresholdGoods: true }, "cbam_declaration").match).toBe("applies");
    expect(get({ importsCbamGoods: false }, "cbam_declaration").match).toBe("not");
    expect(get({}, "cbam_declaration").fact).toBe("cbam_goods");
    expect(nextCbamDeclaration(new Date("2027-10-02T00:00:00Z"))).toBe("2028-09-30");
  });

  it("CSRD: out of scope at 1,000 staff or fewer, or EUR 450m or less", () => {
    expect(get({ employees: 11, employeesMax: 50 }, "csrd_report").match).toBe("not");
    expect(get({ employees: 500, employeesMax: null, revenueEur: 20e6 }, "csrd_report").match).toBe("not");
    expect(get({ employees: 2000, employeesMax: 2000, revenueEur: 600e6 }, "csrd_report").match).toBe("applies");
    expect(get({ employees: 500, employeesMax: null }, "csrd_report").match).toBe("might");
  });

  it("EUDR: date depends on company size", () => {
    expect(get({ eudrCommodities: true, employees: 5, employeesMax: 10, revenueEur: 1e6 }, "eudr_statement").dueDate).toBe("2027-06-30");
    expect(get({ eudrCommodities: true, employees: 300, employeesMax: 300, revenueEur: 80e6 }, "eudr_statement").dueDate).toBe("2026-12-30");
    expect(get({ eudrCommodities: false }, "eudr_statement").match).toBe("not");
    expect(isMicroOrSmall({ ...base, employees: 11, employeesMax: 50 })).toBeNull();
  });

  it("energy audit: never ruled out without bills", () => {
    expect(get({}, "energy_audit").match).toBe("might");
    expect(get({ electricityKwh12m: 20_000 }, "energy_audit").match).toBe("not");
    expect(get({ electricityKwh12m: 1_500_000 }, "energy_audit").match).toBe("might");
    expect(get({ electricityKwh12m: 3_000_000 }, "energy_audit").match).toBe("applies");
  });
});

describe("law watch", () => {
  it("builds a safe query and skips corrigenda", () => {
    expect(amendmentsQuery(["32023R0956", 'x"; DROP'], "2025-01-01")).toContain('"32023R0956","XDROP"');
    const rows = parseAmendments({ results: { bindings: [
      { base: { value: "32023R1115" }, celex: { value: "32026R2102" }, date: { value: "2026-07-13" } },
      { base: { value: "32023R1115" }, celex: { value: "32023R1115R(01)" }, date: { value: "2024-01-01" } },
      { base: { value: "x" }, celex: { value: "y" }, date: { value: "bad" } },
    ] } });
    expect(rows).toEqual([{ base: "32023R1115", celex: "32026R2102", date: "2026-07-13" }]);
  });
});
