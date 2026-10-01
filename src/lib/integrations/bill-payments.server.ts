/**
 * Bank side of utility bills: reads the workspace's water or electricity
 * payments (already sorted by the bank rules) and matches them to the bills.
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bankTransactions } from "@/db/schema";
import { matchBillsToPayments, type BillLite, type BillPaymentCheck } from "./bill-match";

export async function billPaymentCheck(
  workspaceId: string,
  category: "water" | "electricity",
  bills: BillLite[],
): Promise<BillPaymentCheck> {
  const [cover] = await db
    .select({ from: sql<string | null>`min(${bankTransactions.bookedOn})::text` })
    .from(bankTransactions)
    .where(eq(bankTransactions.workspaceId, workspaceId));
  const payments = await db
    .select({ id: bankTransactions.id, bookedOn: bankTransactions.bookedOn, amount: bankTransactions.amount, description: bankTransactions.description })
    .from(bankTransactions)
    .where(
      and(
        eq(bankTransactions.workspaceId, workspaceId),
        eq(bankTransactions.category, category),
        eq(bankTransactions.direction, "debit"),
        eq(bankTransactions.currency, "EUR"),
      ),
    )
    .limit(500);
  return matchBillsToPayments(bills, payments, cover?.from ?? null, new Date().toISOString().slice(0, 10));
}
