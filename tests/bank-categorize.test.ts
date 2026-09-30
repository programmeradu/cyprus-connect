import { describe, expect, it } from "vitest";
import { categorise, directionOf, formatBocDate, parseBocDate } from "@/lib/bank/categorize";
import { consentExpired } from "@/lib/bank/bank.server";

describe("bank payment categories", () => {
  it.each([
    ["EAC BILL 123456 LIMASSOL", "electricity"],
    ["Αρχή Ηλεκτρισμού Κύπρου", "electricity"],
    ["PETROLINA STROVOLOS", "fuel"],
    ["EKO NICOSIA 22", "fuel"],
    ["Καύσιμα πρατήριο", "fuel"],
    ["WATER BOARD OF LIMASSOL", "water"],
    ["DHL EXPRESS CY", "freight"],
    ["MAERSK LINE INVOICE", "freight"],
    ["ACS COURIER", "freight"],
  ])("sorts %s as %s", (text, cat) => {
    expect(categorise(text, "debit").category).toBe(cat);
  });

  it("does not match brand names inside other words", () => {
    expect(categorise("EKONOMIST SUBSCRIPTION", "debit").category).toBe("other");
    expect(categorise("GROUPS DINNER", "debit").category).toBe("other");
    expect(categorise("SWIFT Transfer", "debit").category).toBe("other");
  });

  it("never counts money coming in or unmarked lines as spend", () => {
    expect(categorise("EAC REFUND", "credit").category).toBe("other");
    expect(categorise("PETROLINA", "unknown").category).toBe("other");
  });

  it("returns the rule that matched, for the audit trail", () => {
    expect(categorise("SHELL LARNACA", "debit").rule).toBe("Fuel station");
  });
});

describe("bank dates and directions", () => {
  it("parses dd/mm/yyyy and rejects impossible dates", () => {
    expect(parseBocDate("09/05/2024")).toBe("2024-05-09");
    expect(parseBocDate("31/02/2024")).toBeNull();
    expect(parseBocDate("2024-05-09")).toBeNull();
    expect(parseBocDate(undefined)).toBeNull();
  });
  it("formats dates the way the bank expects", () => {
    expect(formatBocDate(new Date(Date.UTC(2026, 0, 3)))).toBe("03/01/2026");
  });
  it("reads debit/credit markers", () => {
    expect(directionOf("DEBIT")).toBe("debit");
    expect(directionOf("credit")).toBe("credit");
    expect(directionOf(undefined)).toBe("unknown");
  });
  it("knows when the bank consent has ended", () => {
    const now = new Date(Date.UTC(2026, 11, 30));
    expect(consentExpired("29/12/2026", now)).toBe(true);
    expect(consentExpired("30/12/2026", now)).toBe(false);
    expect(consentExpired(null, now)).toBe(false);
  });
});
