import { describe, expect, it } from "vitest";
import { CATALOG } from "@/lib/actions/catalog";
import { baselineFrom, computeFigures, type MeterBill } from "@/lib/actions/roi";
import { allPassed, billDrop, paymentCandidates, purchaseCheck, readProofText, supplierCheck } from "@/lib/actions/verify";

const bill = (start: string, end: string, qty: number, amountEur: number | null = null): MeterBill => ({ start, end, qty, amountEur });
const monthly = (year: number, qty: number, price = 0.3) =>
  Array.from({ length: 12 }, (_, m) => {
    const s = `${year}-${String(m + 1).padStart(2, "0")}-01`;
    const e = new Date(Date.UTC(year, m + 1, 0)).toISOString().slice(0, 10);
    return bill(s, e, qty, qty * price);
  });

describe("roi", () => {
  const base = baselineFrom(monthly(2026, 1000), new Date("2026-12-31"));
  it("annualises bills and reads the unit price", () => {
    expect(Math.round(base.annual!)).toBeGreaterThan(11500);
    expect(base.unitPrice).toBeCloseTo(0.3);
  });
  it("needs 90 days before giving a yearly figure", () => {
    expect(baselineFrom([bill("2026-01-01", "2026-01-31", 900)], new Date("2026-02-15")).annual).toBeNull();
  });
  it("no quote → no cost, no payback, quote listed as missing", () => {
    const f = computeFigures("efficiency", { savedKwhYr: 2000 }, base);
    expect(f.costEur).toBeNull();
    expect(f.paybackYrs).toBeNull();
    expect(f.missing).toContain("quoteEur");
    expect(f.savedEurYr).toBeCloseTo(600);
    expect(f.co2KgYr).toBeCloseTo(2000 * 0.622);
  });
  it("no installer estimate → no saving invented", () => {
    const f = computeFigures("efficiency", { quoteEur: 5000 }, base);
    expect(f.savedQtyYr).toBeNull();
    expect(f.missing).toContain("savedKwhYr");
  });
  it("solar never counts more than the company uses, and grant lowers payback", () => {
    const f = computeFigures("solar", { kwp: 100, quoteEur: 20000, grantEur: 5000 }, base);
    expect(f.savedQtyYr).toBeLessThanOrEqual(base.annual!);
    expect(f.netCostEur).toBe(15000);
    expect(f.paybackYrs).toBeCloseTo(15000 / f.savedEurYr!);
  });
  it("fleet needs both litres and euro saved", () => {
    expect(computeFigures("fleet", { savedLitresYr: 1000 }, null).missing).toContain("savedEurYr");
  });
  it("supplier_data accepts declared CO2 cut and handles free or costed quotes", () => {
    const free = computeFigures("supplier_data", { savedKgCo2eYr: 1500, quoteEur: 0 }, null);
    expect(free.co2KgYr).toBe(1500);
    expect(free.costEur).toBe(0);
    expect(free.netCostEur).toBe(0);
    expect(free.missing).not.toContain("quoteEur");
    expect(free.missing).not.toContain("savedKgCo2eYr");

    const missingFig = computeFigures("supplier_data", {}, null);
    expect(missingFig.missing).toContain("quoteEur");
    expect(missingFig.missing).toContain("savedKgCo2eYr");
  });
});

describe("verification", () => {
  const before = monthly(2025, 1000);
  it("waits until enough bills after install", () => {
    expect(billDrop([...before, ...monthly(2026, 800).slice(0, 1)], "2026-01-01").status).toBe("waiting");
    expect(billDrop(before, null).reason).toBe("not_installed");
  });
  it("passes on a real drop against the same months", () => {
    const r = billDrop([...before, ...monthly(2026, 800).slice(0, 3)], "2026-01-01");
    expect(r.status).toBe("passed");
    expect(r.numbers?.dropPct).toBeCloseTo(20, 0);
  });
  it("reports honestly when no drop is seen", () => {
    expect(billDrop([...before, ...monthly(2026, 990).slice(0, 3)], "2026-01-01").status).toBe("failed");
  });
  it("finds a matching bank payment only for the named supplier near the quote", () => {
    const lines = [
      { id: 1, bookedOn: "2026-03-01", amount: -9800, description: "SEPA SUNPOWER CYPRUS LTD INV 22", direction: "debit" },
      { id: 2, bookedOn: "2026-03-02", amount: -9800, description: "OTHER CO", direction: "debit" },
      { id: 3, bookedOn: "2026-03-03", amount: -50, description: "SUNPOWER CYPRUS", direction: "debit" },
    ];
    expect(paymentCandidates(lines, "SunPower Cyprus Ltd", 10000, "2026-02-01").map((l) => l.id)).toEqual([1]);
    expect(paymentCandidates(lines, "", 10000, "2026-02-01")).toEqual([]);
  });
  it("reads an invoice only with supplier, date and item", () => {
    const text = "SunPower Cyprus Ltd · Invoice 2231 · Date 14/03/2026 · Supply and install 20 kWp photovoltaic system · Total €18,400 incl VAT";
    const ok = readProofText(text, CATALOG.solar, "SunPower Cyprus", "2026-02-01");
    expect(ok.ok).toBe(true);
    const wrong = readProofText(text, CATALOG.solar, "Another Installer", "2026-02-01");
    expect(wrong.ok).toBe(false);
    const old = readProofText(text.replace("14/03/2026", "14/03/2020"), CATALOG.solar, "SunPower Cyprus", "2026-02-01");
    expect(old.ok === false && old.missing).toContain("date");
    expect(readProofText(text, CATALOG.water, "SunPower Cyprus", "2026-02-01").ok).toBe(false);
  });
  it("cannot confirm without every required check", () => {
    const purchase = purchaseCheck([{ kind: "invoice" }], 0, false);
    expect(allPassed(CATALOG.solar, [purchase])).toBe(false);
    expect(allPassed(CATALOG.fleet, [purchase])).toBe(true);
    expect(purchaseCheck([], 2, true).status).toBe("confirm");
    expect(purchaseCheck([], 0, false).status).toBe("needed");
  });
  it("supplier data check passes with document on file or declared registry data", () => {
    expect(supplierCheck([{ kind: "supplier_declaration" }], false, false).status).toBe("passed");
    expect(supplierCheck([], true, false).status).toBe("passed");
    expect(supplierCheck([], false, true).status).toBe("waiting");
    expect(supplierCheck([], false, false).status).toBe("needed");
    expect(allPassed(CATALOG.supplier_data, [supplierCheck([], true, false)])).toBe(true);
  });
});
