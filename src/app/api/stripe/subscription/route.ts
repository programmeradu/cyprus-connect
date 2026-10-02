import { logger } from '@/lib/log';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getUserSubscription, ensureFreeSubscription } from '@/lib/stripe/utils';
import { auth } from '@/lib/auth';
import { createStripeClient, resolvePriceIdFromLookupKey, StripeNotConfiguredError } from '@/lib/stripe/server';
import { SUBSCRIPTION_PLANS, lookupKeyFor } from '@/lib/stripe/config';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { readJson } from '@/lib/validate';

const log = logger('api.stripe.subscription');

function paymentsOff(error: unknown) {
  return error instanceof StripeNotConfiguredError
    ? NextResponse.json({ error: error.message, code: 'PAYMENTS_OFF' }, { status: 503 })
    : null;
}

// GET - current plan (our DB, kept in sync by the webhook).
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    const subscription = await ensureFreeSubscription(session.user.id);
    const plan = SUBSCRIPTION_PLANS[subscription.planId as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.free;
    return NextResponse.json({ subscription, plan });
  } catch (error) {
    return NextResponse.json({ error: 'Could not load your plan.', ref: log.error('get failed', error) }, { status: 500 });
  }
}

const changeSchema = z.object({
  newPlanId: z.enum(['pro', 'enterprise']),
  interval: z.enum(['month', 'year']).default('month'),
});

// POST - switch plan or billing interval now, with a prorated invoice.
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

    const parsed = await readJson(req, changeSchema);
    if (!parsed.ok) return parsed.response;
    const { newPlanId, interval } = parsed.data;

    const subscription = await getUserSubscription(session.user.id);
    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No paid plan to change.', code: 'NO_SUBSCRIPTION' }, { status: 404 });
    }

    const stripe = createStripeClient();
    const priceId = await resolvePriceIdFromLookupKey(stripe, lookupKeyFor(newPlanId, interval));
    const current = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    const updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{ id: current.items.data[0].id, price: priceId }],
      proration_behavior: 'always_invoice',
      metadata: { ...current.metadata, planId: newPlanId, interval, userId: session.user.id },
    });
    return NextResponse.json({ status: updated.status });
  } catch (error) {
    return paymentsOff(error) ?? NextResponse.json({ error: 'Could not change your plan.', ref: log.error('change failed', error) }, { status: 500 });
  }
}

// DELETE - cancel at the end of the paid period; access stays until then.
export async function DELETE() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

    const subscription = await getUserSubscription(session.user.id);
    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No paid plan to cancel.', code: 'NO_SUBSCRIPTION' }, { status: 404 });
    }

    const stripe = createStripeClient();
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, { cancel_at_period_end: true });
    await db
      .update(subscriptions)
      .set({ cancelAtPeriodEnd: true, updatedAt: new Date().toISOString() })
      .where(eq(subscriptions.userId, session.user.id));
    return NextResponse.json({ cancelAtPeriodEnd: true, currentPeriodEnd: subscription.currentPeriodEnd });
  } catch (error) {
    return paymentsOff(error) ?? NextResponse.json({ error: 'Could not cancel your plan.', ref: log.error('cancel failed', error) }, { status: 500 });
  }
}
