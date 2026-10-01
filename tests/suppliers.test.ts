import { describe, expect, it } from "vitest";
import { payeeKey, payeeLabel, payeeMatches, suggestNextSteps, totalsByPayee, type SupplierView } from "@/lib/suppliers";

describe("supplier payees", () => {
  it("strips card noise, references and dates", () => {
    expect(payeeKey("POS 4402 ALPHAMEGA HYPERMARKETS 12/09/26")).toBe("ALPHAMEGA HYPERMARKETS");
    expect(payeeKey("SEPA TRANSFER REF AB12345 KYPROS METALS LTD")).toBe("KYPROS METALS LTD");
    expect(payeeKey("12345")).toBeNull();
    expect(payeeKey(null)).toBeNull();
    expect(payeeLabel("KYPROS METALS LTD")).toBe("Kypros Metals Ltd");
  });

  it("matches by saved payee first, else by whole-word name", () => {
    expect(payeeMatches("KYPROS METALS LTD", { supplierName: "Kypros Metals Limited", bankPayee: null })).toBe(true);
    expect(payeeMatches("KYPROS METALSMITH", { supplierName: "Kypros Metals", bankPayee: null })).toBe(false);
    expect(payeeMatches("EAC", { supplierName: "Anything", bankPayee: "EAC" })).toBe(true);
    expect(payeeMatches("EAC BILL", { supplierName: "EAC", bankPayee: "EAC" })).toBe(false);
  });

  it("totals spend per payee, largest first", () => {
    const t = totalsByPayee([
      { key: "A", amount: -10, bookedOn: "2026-01-01" },
      { key: "B", amount: -50, bookedOn: "2026-02-01" },
      { key: "A", amount: -5.555, bookedOn: "2026-03-01" },
    ]);
    expect(t.map((x) => [x.key, x.total, x.count, x.lastPaid])).toEqual([["B", 50, 1, "2026-02-01"], ["A", 15.56, 2, "2026-03-01"]]);
  });

  it("orders next steps by urgency and caps the list", () => {
    const base: SupplierView = { name: "X", email: null, registrationNo: null, registryCheckedAt: null, wikirateCheckedAt: null, spend12m: 0, cbamNeedsData: false, pendingTaskId: null };
    const steps = suggestNextSteps(
      [
        { ...base, name: "Low", spend12m: 10 },
        { ...base, name: "Owes", cbamNeedsData: true },
        { ...base, name: "Waiting", cbamNeedsData: true, email: "a@b.cy", pendingTaskId: 7, registryCheckedAt: "x" },
      ],
      [{ key: "P", label: "P", total: 900, count: 3, lastPaid: "2026-09-01" }],
    );
    expect(steps.map((s) => s.kind)).toEqual(["review_email", "add_email_cbam", "add_payee", "check_registry", "check_registry"]);
    expect(steps[3]).toMatchObject({ supplier: "Low" });
    expect(suggestNextSteps([], [], 0)).toEqual([]);
  });
});
