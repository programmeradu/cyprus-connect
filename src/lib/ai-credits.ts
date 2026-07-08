/**
 * AI credits helper — replaces the removed Autumn `check` / `track` endpoints.
 *
 * Single source of truth for AI credit balance:
 *   user.aiCreditsBalance  (see src/db/schema.ts)
 *
 * Usage in a server route:
 *   const gate = await checkAndDeductAiCredits(request, 1, 'gemini');
 *   if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
 *   // ... do the AI work ...
 *   // (deduction has already happened; call refundAiCredits(gate.userId, 1) if the work fails)
 */

import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { user, creditsHistory } from '@/db/schema';
import { auth } from '@/lib/auth';

export interface CreditGateSuccess {
  ok: true;
  userId: string;
  remaining: number;
}

export interface CreditGateFailure {
  ok: false;
  status: 401 | 402 | 403;
  error: string;
}

export type CreditGateResult = CreditGateSuccess | CreditGateFailure;

async function resolveUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    // Better-Auth accepts either a session cookie or a Bearer token via the
    // `bearer()` plugin. Passing the incoming headers covers both.
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Atomically check and deduct AI credits for the authenticated user.
 * Returns 401 if unauthenticated, 402 if insufficient credits.
 */
export async function checkAndDeductAiCredits(
  request: Request,
  amount: number,
  reason: string,
): Promise<CreditGateResult> {
  const userId = await resolveUserIdFromRequest(request);
  if (!userId) {
    return { ok: false, status: 401, error: 'Unauthorized — please log in.' };
  }

  // Atomic decrement guarded by a balance check. If the WHERE clause matches
  // no row (balance too low), `returning()` is empty and we surface 402.
  const updated = await db
    .update(user)
    .set({
      aiCreditsBalance: sql`${user.aiCreditsBalance} - ${amount}`,
      updatedAt: new Date(),
    })
    .where(sql`${user.id} = ${userId} AND ${user.aiCreditsBalance} >= ${amount}`)
    .returning({ remaining: user.aiCreditsBalance });

  if (updated.length === 0) {
    return {
      ok: false,
      status: 402,
      error: 'Insufficient AI credits. Please upgrade your plan or top up credits.',
    };
  }

  // Best-effort audit trail; never blocks the caller.
  db.insert(creditsHistory)
    .values({
      userId,
      amount: -amount,
      reason: `ai:${reason}`,
      createdAt: new Date().toISOString(),
    } as any)
    .catch(() => {
      /* audit log is optional */
    });

  return { ok: true, userId, remaining: updated[0].remaining };
}

/**
 * Refund credits if the downstream AI call fails after we've already deducted.
 * Fire-and-forget from the catch block.
 */
export async function refundAiCredits(userId: string, amount: number, reason = 'refund'): Promise<void> {
  try {
    await db
      .update(user)
      .set({
        aiCreditsBalance: sql`${user.aiCreditsBalance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
    db.insert(creditsHistory)
      .values({
        userId,
        amount,
        reason: `ai:${reason}`,
        createdAt: new Date().toISOString(),
      } as any)
      .catch(() => {});
  } catch {
    /* refund is best-effort */
  }
}

/** Convenience wrapper that returns a NextResponse on gate failure. */
export function creditGateResponse(gate: CreditGateFailure): NextResponse {
  return NextResponse.json({ error: gate.error }, { status: gate.status });
}
