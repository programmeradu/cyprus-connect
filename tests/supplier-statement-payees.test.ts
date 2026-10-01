import { describe, expect, it } from "vitest";
import { existingSupplierFor, notSupplierReason, payeeCandidates, paymentFingerprint } from "@/lib/suppliers";
import { readBankRows } from "@/lib/documents/intake";

describe("statement payees", () => {
  it("flags wages, tax, fees and own transfers, in Greek too", () => {
    expect(notSupplierReason("SALARY MARCH 2026")).toBe("payroll");
    expect(notSupplierReason("Τμήμα Φορολογίας ΦΠΑ")).toBe("tax");
    expect(notSupplierReason("ATM WITHDRAWAL NICOSIA")).toBe("cash");
    expect(notSupplierReason("TRANSFER TO OWN ACCOUNT")).toBe("transfer");
    expect(notSupplierReason("COFFEE ISLAND LTD")).toBeNull();
    expect(notSupplierReason("LAFARGE CEMENT CYPRUS")).toBeNull();
  });

  it("groups payments by payee with totals", () => {
    const c = payeeCandidates([
      { date: "2026-08-02", description: "SEPA TRANSFER LAFARGE CEMENT 448812", amount: 1200 },
      { date: "2026-08-20", description: "SEPA TRANSFER LAFARGE CEMENT 448990", amount: 800 },
      { date: "2026-08-25", description: "SALARY AUGUST", amount: 3000 },
    ]);
    const lafarge = c.find((x) => x.key.includes("LAFARGE"));
    expect(lafarge).toMatchObject({ total: 2000, count: 2, reason: null, lastPaid: "2026-08-20" });
    expect(c.find((x) => x.key.includes("SALARY"))?.reason).toBe("payroll");
  });

  it("finds the supplier a payee already belongs to, so no second row is made", () => {
    const list = [{ supplierName: "Lafarge Cement Ltd", bankPayee: "LAFARGE CEMENT CY" }];
    expect(existingSupplierFor({ key: "LAFARGE CEMENT", label: "Lafarge Cement" }, list)).toBe("Lafarge Cement Ltd");
    expect(existingSupplierFor({ key: "PETROLINA", label: "Petrolina" }, list)).toBeNull();
  });

  it("treats the same day, amount and payee as one payment", () => {
    expect(paymentFingerprint("2026-08-02", -1200, "LAFARGE CEMENT")).toBe(paymentFingerprint("2026-08-02", 1200.0, "LAFARGE CEMENT"));
  });

  it("keeps every money-out line from a statement export, not only energy ones", () => {
    const s = readBankRows([
      ["Date", "Description", "Debit", "Credit"],
      ["02/08/2026", "LAFARGE CEMENT", "1200.00", ""],
      ["03/08/2026", "EAC ELECTRICITY", "310.50", ""],
      ["04/08/2026", "CUSTOMER PAYMENT", "", "900"],
    ]);
    expect(s?.debits).toHaveLength(2);
    expect(s?.candidates?.map((c) => c.key)).toContain("LAFARGE CEMENT");
  });
});
