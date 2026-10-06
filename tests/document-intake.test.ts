import { describe, expect, it } from "vitest";
import {
  parseCsv,
  quoteSupports,
  readBankRows,
  readConsumptionRows,
  recogniseText,
  splitByMonth,
  toFootprintUnit,
} from "@/lib/documents/intake";

const NOW = new Date("2026-10-02T00:00:00Z");

describe("splitByMonth", () => {
  it("spreads a bill over months by days", () => {
    const { shares } = splitByMonth({ key: "electricity", value: 590, periodStart: "2026-01-15", periodEnd: "2026-03-14" }, 0, NOW);
    expect(shares.map((s) => [s.month, s.days])).toEqual([[1, 17], [2, 28], [3, 14]]);
    expect(shares.reduce((a, s) => a + s.value, 0)).toBeCloseTo(590, 0);
  });
  it("leaves out a month that has not ended", () => {
    const r = splitByMonth({ key: "water", value: 100, periodStart: "2026-09-01", periodEnd: "2026-10-31" }, 0, NOW);
    expect(r.shares.map((s) => s.month)).toEqual([9]);
    expect(r.skippedOpenMonth).toBe(true);
  });
});

describe("recogniseText", () => {
  it("knows an EAC bill", () => expect(recogniseText("ΑΡΧΗ ΗΛΕΚΤΡΙΣΜΟΥ ΚΥΠΡΟΥ Κατανάλωση 1467 kWh")).toBe("eac_bill"));
  it("knows a water bill", () => expect(recogniseText("Water Board of Nicosia consumption 23 m3")).toBe("water_bill"));
  it("prefers a statement that lists EAC payments", () =>
    expect(recogniseText("IBAN CY17 0020 ... Opening balance 100 EAC payment 50 kWh")).toBe("bank_statement"));
  it("returns null for anything else", () => expect(recogniseText("Lunch menu")).toBeNull());
});

describe("quoteSupports", () => {
  it("needs the quote in the text and the figure in the quote", () => {
    const text = "Total consumption   1.467 kWh\nAmount due 240,10";
    expect(quoteSupports(text, "Total consumption 1.467 kWh", 1467)).toBe(true);
    expect(quoteSupports(text, "Total consumption 2000 kWh", 2000)).toBe(false);
    expect(quoteSupports(text, null, 1467)).toBe(false);
  });
});

describe("units", () => {
  it("converts to footprint units and refuses mismatches", () => {
    expect(toFootprintUnit("water", 23, "m³")).toBe(23000);
    expect(toFootprintUnit("waste", 1.5, "tonnes")).toBe(1500);
    expect(toFootprintUnit("gas", 350, "litres")).toBeCloseTo(410.32, 1);
    expect(toFootprintUnit("transport", 40, "litres")).toBeNull();
    expect(toFootprintUnit("electricity", 0, "kWh")).toBeNull();
  });
});

describe("spreadsheets", () => {
  it("reads a bank CSV and sorts footprint payments", () => {
    const rows = parseCsv(
      "Account;CY00\n\nDate;Description;Debit;Credit\n03/08/2026;PETROLINA LARNACA;45,20;\n05/08/2026;SALARY;;2000\n10/08/2026;EAC BILL PAYMENT;180,00;\n12/08/2026;COFFEE SHOP;4,50;",
    );
    const bank = readBankRows(rows)!;
    expect(bank.debitCount).toBe(3);
    expect(bank.totals).toEqual({ fuel: 45.2, electricity: 180 });
    expect(bank.periodStart).toBe("2026-08-03");
  });
  it("reads a usage sheet by month", () => {
    const r = readConsumptionRows(parseCsv("Month,Electricity kWh,Water m3\n2026-07,1200,10\n2026-08,1300,12"));
    expect(r).not.toBe("no_dates");
    const figures = (r as { figures: { key: string; value: number }[] }).figures;
    expect(figures).toContainEqual(expect.objectContaining({ key: "water", value: 12000 }));
    expect(figures).toHaveLength(4);
  });
  it("asks for a month column when there is none", () => {
    expect(readConsumptionRows(parseCsv("Electricity kWh,Water m3\n1200,10"))).toBe("no_dates");
  });
});

describe("pdf edge cases (F28, F29)", () => {
  it("rejects damaged/corrupt PDF bytes with corrupt_pdf", async () => {
    const { readDocument } = await import("@/lib/documents/intake.server");
    const corruptBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const res = await readDocument("test-user", corruptBytes, "pdf");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("corrupt_pdf");
    }
  });

  it("rejects blank/empty PDF with empty_page", async () => {
    const { readDocument } = await import("@/lib/documents/intake.server");
    const blankPdf =
      "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000108 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n177\n%%EOF";
    const bytes = new TextEncoder().encode(blankPdf);
    const res = await readDocument("test-user", bytes, "pdf");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("empty_page");
    }
  });
});

