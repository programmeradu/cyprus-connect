import { describe, expect, it } from "vitest";
import { parseAmount, extractTotal, extractUsage } from "../src/lib/ocr/amounts";
import { extractUtilityBillData } from "../src/lib/ocr/extract-bill-data";

describe("parseAmount", () => {
  it.each([
    ["142,50", 142.5], ["142.50", 142.5], ["1.234,56", 1234.56], ["1,234.56", 1234.56],
    ["60,000", 60000], ["60.000", 60000], ["8", 8], ["abc", null],
  ])("%s -> %s", (raw, expected) => expect(parseAmount(raw)).toBe(expected));
});

describe("extractTotal", () => {
  it("takes the gross (last) amount on the total line", () => {
    expect(extractTotal("Total $ 7,50 $ 0,75 $ 8,25")).toBe(8.25);
  });
  it("ignores subtotal and prefers amount due", () => {
    expect(extractTotal("Subtotal 100,00\nTotal 110,00\nAmount due €142,50")).toBe(142.5);
  });
  it("reads the amount on the next line when the label stands alone", () => {
    expect(extractTotal("TOTAL\n28,000")).toBe(28000);
  });
  it("does not treat usage totals as money", () => {
    expect(extractTotal("Total consumption 812 kWh")).toBeNull();
  });
});

describe("extractUsage / bill data", () => {
  it("reads kWh attached to a number, EU decimals", () => {
    expect(extractUsage("Consumption: 1.204,5 kWh", /kwh/)).toBe(1204.5);
  });
  it("parses a Cyprus-style electricity bill", () => {
    const d = extractUtilityBillData("EAC Electricity\nAccount No: 12345678\nUnits used 812 kWh\nAmount due €142,50");
    expect(d).toMatchObject({ usageType: "electricity", usageAmount: 812, totalAmount: 142.5, currency: "EUR", accountNumber: "12345678" });
  });
  it("does not use a plain word as account number", () => {
    expect(extractUtilityBillData("Reference Customer bill").accountNumber).toBeNull();
  });
});
