import { NextRequest, NextResponse } from 'next/server';
import { getUserSubscription, ensureFreeSubscription } from '@/lib/stripe/utils';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createStripeClient, resolvePriceIdFromLookupKey, getStripeErrorMessage } from '@/lib/stripe/server';
import { resolveStripeEnvFromRequest } from '@/lib/stripe/env';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/config';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET - Get current subscription (single source of truth: our DB, populated by webhook).
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Guarantee every user has at least a Free-tier row.
    const subscription = await ensureFreeSubscription(session.user.id);
    const plan = SUBSCRIPTION_PLANS[subscription.planId as keyof typeof SUBSCRIPTION_PLANS]
      || SUBSCRIPTION_PLANS.free;

    return NextResponse.json({ subscription, plan });
  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription', details: error.message },
      { status: 500 },
    );
  }
}

// POST - Upgrade / downgrade with immediate switch + prorated invoice.
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { newPlanId } = await req.json();
    const subscription = await getUserSubscription(session.user.id);
    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const newPlan = SUBSCRIPTION_PLANS[newPlanId as keyof typeof SUBSCRIPTION_PLANS];
    if (!newPlan || !newPlan.priceId) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const env = resolveStripeEnvFromRequest(req);
    const stripe = createStripeClient(env);
    const priceId = await resolvePriceIdFromLookupKey(stripe, newPlan.priceId);

    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    const updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{ id: stripeSubscription.items.data[0].id, price: priceId }],
      proration_behavior: 'always_invoice',
      metadata: { ...stripeSubscription.metadata, planId: newPlan.id, userId: session.user.id },
    });

    return NextResponse.json({ subscription: updated, message: 'Subscription updated successfully' });
  } catch (error: any) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription', details: getStripeErrorMessage(error) },
      { status: 500 },
    );
  }
}

// DELETE - Immediate cancel (matches business rule: revoke on cancel).
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const subscription = await getUserSubscription(session.user.id);
    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const env = resolveStripeEnvFromRequest(req);
    const stripe = createStripeClient(env);
    // Immediate cancellation with a final prorated invoice for unused time.
    const canceled = await stripe.subscriptions.cancel(subscription.stripeSubscriptionId, {
      invoice_now: true,
      prorate: true,
    });

    // Optimistically flip local row to Free; the webhook will confirm.
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
      .where(eq(subscriptions.userId, session.user.id));

    return NextResponse.json({ subscription: canceled, message: 'Subscription canceled' });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription', details: getStripeErrorMessage(error) },
      { status: 500 },
    );
  }
}
