import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentsWebhook, type StripeEnv } from '@/lib/stripe/server';
import { db } from '@/db';
import { subscriptions, paymentHistory, creditPurchases, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendWelcomeEmail } from '@/lib/email/notifications';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/config';

/**
 * Lovable Payments (Stripe-via-gateway) webhook.
 * Registered by enable_stripe_payments at:
 *   /api/public/payments/webhook?env=sandbox
 *   /api/public/payments/webhook?env=live
 *
 * Business logic mapping (approved by user):
 *  - subscription active → upsert row, grant plan's monthly AI credits,
 *    send welcome email, log analytics event
 *  - subscription canceled → IMMEDIATE revoke, downgrade to Free
 *  - subscription updated (plan change) → upsert with new plan, refresh credits,
 *    log plan_changed event (Stripe handles proration invoice)
 *  - checkout.session.completed with credits metadata → grant one-time credits
 */

function planIdFromLookupKey(lookupKey?: string | null): 'free' | 'pro' | 'enterprise' {
  if (!lookupKey) return 'free';
  if (lookupKey.startsWith('pro_')) return 'pro';
  if (lookupKey.startsWith('enterprise_')) return 'enterprise';
  return 'free';
}

async function trackEvent(userId: string, event: string, metadata: Record<string, any>) {
  try {
    console.log('[analytics]', JSON.stringify({ userId, event, ...metadata }));
    // Extension point: forward to PostHog / Mixpanel here.
  } catch (e) {
    console.error('[analytics] failed', e);
  }
}

async function grantMonthlyCredits(userId: string, credits: number) {
  if (!credits || credits <= 0) return;
  const current = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!current[0]) return;
  const balance = current[0].totalCredits || 0;
  await db
    .update(user)
    .set({ totalCredits: balance + credits, updatedAt: new Date() })
    .where(eq(user.id, userId));
}

async function upsertSubscription(sub: any, env: StripeEnv) {
  const userId = sub.metadata?.userId;
  if (!userId) {
    console.error('[payments-webhook] missing userId in subscription metadata', sub.id);
    return null;
  }

  const item = sub.items?.data?.[0];
  const lookupKey =
    item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || null;
  const planId = planIdFromLookupKey(lookupKey);

  const periodStart = item?.current_period_start ?? sub.current_period_start;
  const periodEnd = item?.current_period_end ?? sub.current_period_end;

  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const values = {
    userId,
    stripeCustomerId: sub.customer as string,
    stripeSubscriptionId: sub.id,
    planId,
    status: sub.status,
    currentPeriodStart: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    updatedAt: new Date().toISOString(),
  };

  if (existing[0]) {
    await db.update(subscriptions).set(values).where(eq(subscriptions.userId, userId));
  } else {
    await db.insert(subscriptions).values({
      ...values,
      createdAt: new Date().toISOString(),
    });
  }

  return { userId, planId, previousPlanId: existing[0]?.planId ?? 'free', isNew: !existing[0] };
}

async function handleSubscriptionActive(sub: any, env: StripeEnv, eventType: string) {
  const result = await upsertSubscription(sub, env);
  if (!result) return;
  const { userId, planId, previousPlanId } = result;

  if (sub.status !== 'active' && sub.status !== 'trialing') return;

  const plan = SUBSCRIPTION_PLANS[planId];
  const changed = previousPlanId !== planId;

  // Grant monthly AI credits (on new activation OR plan change)
  if (changed && plan?.limits?.aiCredits) {
    await grantMonthlyCredits(userId, plan.limits.aiCredits);
  }

  if (eventType === 'customer.subscription.created' || (changed && previousPlanId === 'free')) {
    // Welcome email + analytics
    try {
      const userRow = await db.select().from(user).where(eq(user.id, userId)).limit(1);
      if (userRow[0]) {
        await sendWelcomeEmail(userRow[0].email, userRow[0].name || 'there');
      }
    } catch (e) {
      console.error('[payments-webhook] welcome email failed', e);
    }
    await trackEvent(userId, 'plan_started', { planId, env });
  } else if (changed) {
    await trackEvent(userId, 'plan_changed', { from: previousPlanId, to: planId, env });
  }
}

async function handleSubscriptionCanceled(sub: any, env: StripeEnv) {
  const userId = sub.metadata?.userId;
  if (!userId) return;

  // Immediate revoke: downgrade to free, period_end = now
  await db
    .update(subscriptions)
    .set({
      planId: 'free',
      status: 'canceled',
      stripeSubscriptionId: null,
      currentPeriodEnd: new Date().toISOString(),
      cancelAtPeriodEnd: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(subscriptions.userId, userId));

  await trackEvent(userId, 'plan_canceled', { subscriptionId: sub.id, env });
}

async function handleCheckoutCompleted(sessionObj: any, env: StripeEnv) {
  const meta = sessionObj.metadata || {};
  const userId = meta.userId;
  if (!userId) return;

  if (sessionObj.mode === 'payment' && meta.type === 'credits' && meta.credits) {
    const credits = parseInt(meta.credits, 10);
    if (!Number.isFinite(credits) || credits <= 0) return;

    // Idempotency: skip if we've already recorded this session
    const existing = await db
      .select()
      .from(creditPurchases)
      .where(eq(creditPurchases.stripePaymentId, sessionObj.id))
      .limit(1);
    if (existing[0]) return;

    await db.insert(creditPurchases).values({
      userId,
      stripePaymentId: sessionObj.id,
      creditsPurchased: credits,
      amountPaid: sessionObj.amount_total || 0,
      currency: sessionObj.currency || 'usd',
      createdAt: new Date().toISOString(),
    });
    await grantMonthlyCredits(userId, credits);

    await db.insert(paymentHistory).values({
      userId,
      stripePaymentId: sessionObj.payment_intent || sessionObj.id,
      amount: sessionObj.amount_total || 0,
      currency: sessionObj.currency || 'usd',
      status: 'succeeded',
      paymentType: 'credits',
      description: `${credits} AI Credits`,
      metadata: JSON.stringify(meta),
      createdAt: new Date().toISOString(),
    });

    await trackEvent(userId, 'credits_purchased', { credits, env });
  }
}

async function handleInvoicePaid(invoice: any, env: StripeEnv) {
  const customerId = invoice.customer;
  if (!customerId) return;
  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);
  if (!sub[0]) return;

  await db.insert(paymentHistory).values({
    userId: sub[0].userId,
    stripePaymentId: invoice.payment_intent || invoice.id,
    amount: invoice.amount_paid || 0,
    currency: invoice.currency || 'usd',
    status: 'succeeded',
    paymentType: 'subscription',
    description: `Subscription payment — ${sub[0].planId}`,
    metadata: JSON.stringify({ invoiceId: invoice.id, subscriptionId: invoice.subscription }),
    createdAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const rawEnv = req.nextUrl.searchParams.get('env');
  if (rawEnv !== 'sandbox' && rawEnv !== 'live') {
    console.error('[payments-webhook] invalid env query param:', rawEnv);
    return NextResponse.json({ received: true, ignored: 'invalid env' });
  }
  const env: StripeEnv = rawEnv;

  let event;
  try {
    event = await verifyPaymentsWebhook(req, env);
  } catch (err: any) {
    console.error('[payments-webhook] verification failed:', err.message);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionActive(event.data.object, env, event.type);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object, env);
        break;
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, env);
        break;
      case 'invoice.payment_succeeded':
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object, env);
        break;
      default:
        console.log('[payments-webhook] unhandled:', event.type);
    }
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[payments-webhook] handler error:', error);
    // Return 200 to avoid Stripe retry storms on our internal errors after
    // the signature is verified — we've already logged for investigation.
    return NextResponse.json({ received: true, error: error.message });
  }
}
