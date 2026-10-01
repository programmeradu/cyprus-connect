import { describe, expect, it } from "vitest";
import { matchBillsToPayments } from "@/lib/integrations/bill-match";
import { billHint, gmailConfirmation, newInboxToken, tokenFromAddress, INBOX_TOKEN } from "@/lib/integrations/bill-inbox";

const bill = (id: number, end: string, amountEur: number | null = null) => ({ id, periodStart: "2026-01-01", periodEnd: end, amountEur });
const pay = (id: number, bookedOn: string, amount: number) => ({ id, bookedOn, amount, description: "WATER BOARD" });

describe("matchBillsToPayments", () => {
  it("prefers the payment with the exact amount", () => {
    const r = matchBillsToPayments([bill(1, "2026-03-01", 42.1)], [pay(10, "2026-03-05", 30), pay(11, "2026-03-20", 42.1)], "2026-01-01", "2026-09-01");
    expect(r.matched).toEqual([{ billId: 1, paymentId: 11, bookedOn: "2026-03-20", amount: 42.1, amountMatches: true }]);
    expect(r.paymentsWithoutBill.map((p) => p.id)).toEqual([10]);
  });

  it("falls back to the earliest payment in the window and uses each payment once", () => {
    const r = matchBillsToPayments([bill(1, "2026-03-01"), bill(2, "2026-05-01")], [pay(10, "2026-03-10", 20), pay(11, "2026-05-10", 25)], "2026-01-01", "2026-09-01");
    expect(r.matched.map((m) => [m.billId, m.paymentId])).toEqual([[1, 10], [2, 11]]);
    expect(r.paymentsWithoutBill).toEqual([]);
  });

  it("ignores payments outside the window", () => {
    const r = matchBillsToPayments([bill(1, "2026-03-01")], [pay(10, "2026-06-30", 20)], "2026-01-01", "2026-09-01");
    expect(r.matched).toEqual([]);
    expect(r.billsWithoutPayment).toEqual([1]);
  });

  it("only calls a bill unpaid when the bank read covers the whole window", () => {
    const r = matchBillsToPayments([bill(1, "2026-08-01"), bill(2, "2025-06-01")], [], "2026-01-01", "2026-09-01");
    expect(r.billsWithoutPayment).toEqual([]);
  });

  it("reports no bank when nothing was read", () => {
    const r = matchBillsToPayments([bill(1, "2026-03-01")], [], null, "2026-09-01");
    expect(r.bankLinked).toBe(false);
    expect(r.billsWithoutPayment).toEqual([]);
  });

  it("treats negative bank amounts as money out", () => {
    const r = matchBillsToPayments([bill(1, "2026-03-01", 12.5)], [pay(10, "2026-03-04", -12.5)], "2026-01-01", "2026-09-01");
    expect(r.matched[0].amountMatches).toBe(true);
  });
});

describe("bill inbox helpers", () => {
  it("makes 20-character base32 tokens", () => {
    expect(newInboxToken()).toMatch(INBOX_TOKEN);
  });
  it("reads the token only on the inbox domain", () => {
    const tok = "abcdefghijklmnopqrst";
    expect(tokenFromAddress(`${tok}@bills.vuneli.com`, "bills.vuneli.com")).toBe(tok);
    expect(tokenFromAddress(`<${tok.toUpperCase()}+eac@Bills.Vuneli.com>`, "bills.vuneli.com")).toBe(tok);
    expect(tokenFromAddress(`${tok}@evil.com`, "bills.vuneli.com")).toBeNull();
    expect(tokenFromAddress("short@bills.vuneli.com", "bills.vuneli.com")).toBeNull();
  });
  it("pulls the Gmail forwarding code and link", () => {
    const c = gmailConfirmation(
      "Gmail Team <forwarding-noreply@google.com>",
      "(#123456789) Gmail Forwarding Confirmation",
      "Confirmation code: 123456789\nhttps://mail-settings.google.com/mail/vf-abc123 to confirm",
    );
    expect(c).toEqual({ code: "123456789", link: "https://mail-settings.google.com/mail/vf-abc123" });
    expect(gmailConfirmation("eac@eac.com.cy", "Bill", "Confirmation code: 1234567")).toBeNull();
  });
  it("guesses the reader from sender and subject", () => {
    expect(billHint("ebill@eac.com.cy", "Your bill", null)).toBe("electricity");
    expect(billHint("info@wbn.org.cy", null, null)).toBe("water");
    expect(billHint(null, "Λογαριασμός Υδατοπρομήθειας", null)).toBe("water");
    expect(billHint("x@y.com", "Invoice", "doc.pdf")).toBeNull();
  });
});
