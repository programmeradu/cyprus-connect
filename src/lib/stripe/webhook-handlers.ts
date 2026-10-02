/**
 * What each Stripe event changes in Vuneli. The route verifies the signature
 * and makes sure each event id is handled once; these functions do the work.
 *
 * Rules:
 * - Plan comes from the price's lookup key (same in test and live).
 * - A failed or overdue payment keeps the plan (status past_due/unpaid) so
 *   Home can show a grace notice; only a deleted subscription drops to Free.
 * - One-off purchases are fulfilled when paid, including SEPA payments that
 *   settle days after checkout.
 */
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { creditPurchases, offsetProjects, offsetPurchases, paymentHistory, subscriptions, user } from '@/db/schema';
import { SUBSCRIPTION_PLANS, planFromLookupKey, type SubscriptionPlanId } from './config';
import { createStripeClient } from './server';
import { sendWelcomeEmail } from '@/lib/email/notifications';
import { logger } from '@/lib/log';

const log = logger('stripe.webhook');

const iso = (secs?: number | null) => (secs ? new Date(secs * 1000).toISOString() : null);

/** Pure, exported for tests: the subscription row a Stripe subscription implies. */
export function subscriptionRowFrom(sub: any) {
  const item = sub.items?.data?.[0];
  const lookupKey = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || null;
  const { planId, interval } = planFromLookupKey(lookupKey);
  return {
    stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
    stripeSubscriptionId: sub.id as string,
    planId,
    billingInterval: interval ?? (item?.price?.recurring?.interval === 'year' ? 'year' : 'month'),
    collectionMethod: sub.collection_method || 'charge_automatically',
    status: sub.status as string,
    currentPeriodStart: iso(item?.current_period_start ?? sub.current_period_start),
    currentPeriodEnd: iso(item?.current_period_end ?? sub.current_period_end),
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    trialEnd: iso(sub.trial_end),
  };
}

/** Pure: does this status still give access to the paid plan? */
export function keepsPlan(status: string): boolean {
  return ['active', 'trialing', 'past_due', 'unpaid', 'incomplete'].includes(status);
}

async function userIdFor(obj: { metadata?: Record<string, string>; customer?: any }): Promise<string | null> {
  if (obj.metadata?.userId) return obj.metadata.userId;
  const customerId = typeof obj.customer === 'string' ? obj.customer : obj.customer?.id;
  if (!customerId) return null;
  const [row] = await db.select({ userId: subscriptions.userId }).from(subscriptions).where(eq(subscriptions.stripeCustomerId, customerId)).limit(1);
  if (row) return row.userId;
  try {
    const c = await createStripeClient().customers.retrieve(customerId);
    return ('metadata' in c && c.metadata?.userId) || null;
  } catch {
    return null;
  }
}

async function addCredits(userId: string, credits: number) {
  if (!credits || credits <= 0) return;
  await db.update(user).set({ totalCredits: sql`coalesce(${user.totalCredits}, 0) + ${credits}`, updatedAt: new Date() }).where(eq(user.id, userId));
}

export async function onSubscriptionChanged(sub: any, eventType: string) {
  const userId = await userIdFor(sub);
  if (!userId) {
    log.warn('subscription without a Vuneli user', { subscriptionId: sub.id });
    return;
  }
  const row = subscriptionRowFrom(sub);
  const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  const previousPlan = (existing?.planId || 'free') as SubscriptionPlanId;
  const planId: SubscriptionPlanId = keepsPlan(row.status) ? row.planId : previousPlan;
  const values = { ...row, planId, userId, updatedAt: new Date().toISOString() };

  if (existing) await db.update(subscriptions).set(values).where(eq(subscriptions.userId, userId));
  else await db.insert(subscriptions).values({ ...values, createdAt: new Date().toISOString() });

  const active = row.status === 'active' || row.status === 'trialing';
  if (active && planId !== previousPlan) {
    await addCredits(userId, SUBSCRIPTION_PLANS[planId].limits.aiCredits);
    if (previousPlan === 'free') {
      try {
        const [u] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
        if (u) await sendWelcomeEmail(u.email, u.name || 'there');
      } catch (e) {
        log.warn('welcome email failed', { ref: log.error('welcome email', e) });
      }
    }
    log.info('plan changed', { userId, from: previousPlan, to: planId, eventType });
  }
}

export async function onSubscriptionDeleted(sub: any) {
  const userId = await userIdFor(sub);
  if (!userId) return;
  await db
    .update(subscriptions)
    .set({ planId: 'free', status: 'canceled', stripeSubscriptionId: null, cancelAtPeriodEnd: false, billingInterval: null, collectionMethod: null, updatedAt: new Date().toISOString() })
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.stripeSubscriptionId, sub.id)));
  log.info('plan ended', { userId });
}

/** Checkout finished, or a delayed (SEPA) payment settled. */
export async function onCheckoutPaid(session: any) {
  if (session.payment_status === 'unpaid') return; // SEPA still settling; async event follows
  const meta = session.metadata || {};
  const userId = meta.userId;
  if (!userId || session.mode !== 'payment') return;
  const paymentId = (session.payment_intent as string) || session.id;

  if (meta.type === 'credits') {
    const credits = Number.parseInt(meta.credits, 10);
    if (!Number.isFinite(credits) || credits <= 0) return;
    const [dupe] = await db.select({ id: creditPurchases.id }).from(creditPurchases).where(eq(creditPurchases.stripePaymentId, session.id)).limit(1);
    if (dupe) return;
    await db.insert(creditPurchases).values({ userId, stripePaymentId: session.id, creditsPurchased: credits, amountPaid: session.amount_total || 0, currency: session.currency || 'eur', createdAt: new Date().toISOString() });
    await addCredits(userId, credits);
    return;
  }

  if (meta.type === 'carbon_offset') {
    const projectId = Number(meta.projectId);
    const tons = Number(meta.tons);
    if (!Number.isFinite(projectId) || !Number.isFinite(tons) || tons <= 0) return;
    const inserted = await db
      .insert(offsetPurchases)
      .values({
        userId,
        projectId,
        tonsPurchased: tons,
        pricePaid: (session.amount_total || 0) / 100,
        stripePaymentId: paymentId,
        stripeInvoiceId: typeof session.invoice === 'string' ? session.invoice : session.invoice?.id ?? null,
        platformFeeCents: Number(meta.platformFeeCents) || 0,
        status: 'paid',
        purchasedAt: new Date().toISOString(),
      })
      .onConflictDoNothing({ target: offsetPurchases.stripePaymentId })
      .returning({ id: offsetPurchases.id });
    if (inserted.length) {
      await db.update(offsetProjects).set({ availableTons: sql`greatest(${offsetProjects.availableTons} - ${tons}, 0)` }).where(eq(offsetProjects.id, projectId));
    }
  }
}

export async function onCheckoutPaymentFailed(session: any) {
  const userId = session.metadata?.userId;
  if (!userId) return;
  await db
    .insert(paymentHistory)
    .values({ userId, stripePaymentId: `${session.id}:failed`, amount: session.amount_total || 0, currency: session.currency || 'eur', status: 'failed', paymentType: 'one_time', description: 'Bank payment did not go through', createdAt: new Date().toISOString() })
    .onConflictDoNothing({ target: paymentHistory.stripePaymentId });
}

function invoiceSubscriptionId(inv: any): string | null {
  return inv.parent?.subscription_details?.subscription ?? inv.subscription ?? null;
}

export async function onInvoicePaid(inv: any) {
  const userId = await userIdFor(inv);
  if (!userId) return;
  await db
    .insert(paymentHistory)
    .values({
      userId,
      stripePaymentId: inv.id,
      amount: inv.amount_paid || 0,
      currency: inv.currency || 'eur',
      status: 'succeeded',
      paymentType: invoiceSubscriptionId(inv) ? 'subscription' : 'one_time',
      description: inv.lines?.data?.[0]?.description || 'Vuneli invoice',
      metadata: JSON.stringify({ invoiceNumber: inv.number, hostedUrl: inv.hosted_invoice_url, pdfUrl: inv.invoice_pdf, subscriptionId: invoiceSubscriptionId(inv) }),
      createdAt: new Date().toISOString(),
    })
    .onConflictDoNothing({ target: paymentHistory.stripePaymentId });
}

export async function onInvoiceProblem(inv: any, kind: 'payment_failed' | 'overdue') {
  const userId = await userIdFor(inv);
  if (!userId) return;
  await db
    .insert(paymentHistory)
    .values({
      userId,
      stripePaymentId: `${inv.id}:${kind}:${inv.attempt_count ?? 0}`,
      amount: inv.amount_due || 0,
      currency: inv.currency || 'eur',
      status: 'failed',
      paymentType: invoiceSubscriptionId(inv) ? 'subscription' : 'one_time',
      description: kind === 'overdue' ? 'Invoice overdue' : 'Payment failed',
      metadata: JSON.stringify({ invoiceNumber: inv.number, hostedUrl: inv.hosted_invoice_url }),
      createdAt: new Date().toISOString(),
    })
    .onConflictDoNothing({ target: paymentHistory.stripePaymentId });
  log.warn('invoice problem', { userId, kind, invoiceId: inv.id });
}
