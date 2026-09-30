import { describe, expect, it } from "vitest";
import { parseCyStat, climateTraceYear } from "@/lib/integrations/reference.server";
import { checkEacAnswer } from "@/lib/integrations/eac.server";

const ds = {
  updated: "2025-09-11T05:00:00Z",
  value: [100, 10, 30, 60],
  dimension: {
    YEAR: { category: { index: { "5": 0 }, label: { "5": "2023" } } },
    "ECONOMIC ACTIVITY (NACE Rev": {
      category: {
        index: { "A-T": 0, A: 1, C: 2, J: 3 },
        label: { "A-T": "A-T Total", A: "A Agriculture", C: "C Manufacturing", J: "J Information and Communication" },
      },
    },
  },
};

describe("CyStat parser", () => {
  it("reads the national total and the company's own NACE section", () => {
    const r = parseCyStat(ds, "technology");
    expect(r.year).toBe("2023");
    expect(r.total).toBe(100);
    expect(r.own).toEqual({ code: "J", label: "Information and Communication", count: 60, sharePct: 60 });
    expect(r.sections[0].code).toBe("J");
  });
  it("gives no peer count for an unmapped or missing sector", () => {
    expect(parseCyStat(ds, "general").own).toBeNull();
    expect(parseCyStat(ds, null).own).toBeNull();
  });
  it("sums every municipality into the national figure", () => {
    const multi = { ...ds, id: ["MUNICIPALITY, COMMUNITY", "YEAR", "ECONOMIC ACTIVITY (NACE Rev"], size: [2, 1, 4], value: [100, 10, 30, 60, 50, 5, 15, 30] };
    const r = parseCyStat(multi, "technology");
    expect(r.total).toBe(150);
    expect(r.own?.count).toBe(90);
  });
  it("refuses an unexpected shape", () => {
    expect(() => parseCyStat({}, null)).toThrow();
  });
});

describe("Climate TRACE year", () => {
  it("uses the last full published year", () => {
    expect(climateTraceYear(new Date("2026-09-30T00:00:00Z"))).toBe(2024);
  });
});

describe("EAC bill check", () => {
  const good = { is_eac_bill: true, account_number: "123 456-7", period_start: "2026-06-01", period_end: "2026-07-31", kwh: "1234.567", amount_eur: 310.4 };
  it("accepts a readable bill and cleans its fields", () => {
    const r = checkEacAnswer(good);
    expect(r).toEqual({ ok: true, bill: { accountNumber: "123456-7", periodStart: "2026-06-01", periodEnd: "2026-07-31", kwh: 1234.57, amountEur: 310.4 } });
  });
  it("refuses a bill without kWh, never guessing", () => {
    expect(checkEacAnswer({ ...good, kwh: null }).ok).toBe(false);
    expect(checkEacAnswer({ ...good, kwh: 0 }).ok).toBe(false);
  });
  it("refuses a bad or reversed period", () => {
    expect(checkEacAnswer({ ...good, period_start: "June" }).ok).toBe(false);
    expect(checkEacAnswer({ ...good, period_start: "2026-08-01" }).ok).toBe(false);
    expect(checkEacAnswer({ ...good, period_start: "2024-01-01" }).ok).toBe(false);
  });
  it("refuses a document that is not an EAC bill", () => {
    expect(checkEacAnswer({ ...good, is_eac_bill: false }).ok).toBe(false);
    expect(checkEacAnswer(null).ok).toBe(false);
  });
  it("drops a masked account number instead of storing the mask", () => {
    const r = checkEacAnswer({ ...good, account_number: "XXXXXXXXXXX" });
    expect(r.ok && r.bill.accountNumber).toBeNull();
  });
  it("keeps a missing amount as null", () => {
    const r = checkEacAnswer({ ...good, amount_eur: null });
    expect(r.ok && r.bill.amountEur).toBeNull();
  });
});
