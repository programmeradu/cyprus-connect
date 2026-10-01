/**
 * Matches utility bills to the bank payments that paid them.
 *
 * Pure and deterministic. A payment can pay a bill when it is booked between
 * a few days before the period ends and PAY_WINDOW_DAYS after it (Cyprus
 * boards issue the bill after the period and give about a month to pay).
 * A payment with the bill's exact amount wins; otherwise the earliest
 * payment in the window. Each payment pays at most one bill.
 *
 * The result answers two questions a consultant would ask:
 *  - "You paid the board on this date, where is that bill?" (payment, no bill)
 *  - "This bill shows no payment in the bank" (only when the bank read covers
 *    the whole window, so a missing payment is a fact, not a gap in the read).
 */

export const PAY_WINDOW_DAYS = 75;
const EARLY_DAYS = 3;
const AMOUNT_TOLERANCE_EUR = 0.05;
const DAY = 86_400_000;

export interface BillLite {
  id: number;
  periodStart: string;
  periodEnd: string;
  amountEur: number | null;
}

export interface PaymentLite {
  id: number;
  bookedOn: string;
  amount: number;
  description: string | null;
}

export interface BillPaymentMatch {
  billId: number;
  paymentId: number;
  bookedOn: string;
  amount: number;
  amountMatches: boolean;
}

export interface BillPaymentCheck {
  /** No bank link with payments: nothing can be checked. */
  bankLinked: boolean;
  /** First day the bank read covers (any category), or null. */
  coveredFrom: string | null;
  matched: BillPaymentMatch[];
  paymentsWithoutBill: PaymentLite[];
  /** Bills whose whole payment window is inside the bank read, with no payment found. */
  billsWithoutPayment: number[];
}

const t = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

export function matchBillsToPayments(
  bills: BillLite[],
  payments: PaymentLite[],
  coveredFrom: string | null,
  today: string,
): BillPaymentCheck {
  const pays = payments
    .map((p) => ({ ...p, amount: Math.abs(p.amount) }))
    .filter((p) => !Number.isNaN(t(p.bookedOn)))
    .sort((a, b) => a.bookedOn.localeCompare(b.bookedOn) || a.id - b.id);
  const used = new Set<number>();
  const matchedBy = new Map<number, BillPaymentMatch>();
  const ordered = [...bills].filter((b) => !Number.isNaN(t(b.periodEnd))).sort((a, b) => a.periodEnd.localeCompare(b.periodEnd));

  const inWindow = (b: BillLite, p: PaymentLite) => {
    const end = t(b.periodEnd);
    const at = t(p.bookedOn);
    return at >= end - EARLY_DAYS * DAY && at <= end + PAY_WINDOW_DAYS * DAY;
  };
  const sameAmount = (b: BillLite, p: PaymentLite) =>
    b.amountEur !== null && Math.abs(b.amountEur - p.amount) <= AMOUNT_TOLERANCE_EUR;

  // Pass 1: exact amount. Pass 2: any payment in the window.
  for (const exact of [true, false]) {
    for (const b of ordered) {
      if (matchedBy.has(b.id)) continue;
      const p = pays.find((x) => !used.has(x.id) && inWindow(b, x) && (!exact || sameAmount(b, x)));
      if (!p) continue;
      used.add(p.id);
      matchedBy.set(b.id, { billId: b.id, paymentId: p.id, bookedOn: p.bookedOn, amount: p.amount, amountMatches: sameAmount(b, p) });
    }
  }

  const from = coveredFrom ? t(coveredFrom) : null;
  const now = t(today);
  const billsWithoutPayment =
    from === null
      ? []
      : ordered
          .filter((b) => !matchedBy.has(b.id))
          .filter((b) => t(b.periodEnd) - EARLY_DAYS * DAY >= from && t(b.periodEnd) + PAY_WINDOW_DAYS * DAY <= now)
          .map((b) => b.id);

  return {
    bankLinked: from !== null,
    coveredFrom,
    matched: [...matchedBy.values()],
    paymentsWithoutBill: pays.filter((p) => !used.has(p.id)).reverse(),
    billsWithoutPayment,
  };
}
