import { NextRequest, NextResponse } from 'next/server';
import { getUserSubscription } from '@/lib/stripe/utils';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createStripeClient, resolvePriceIdFromLookupKey, getStripeErrorMessage } from '@/lib/stripe/server';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/config';
import { Autumn as autumn } from 'autumn-js';


const autumnSDK = new autumn({
  secretKey: process.env.AUTUMN_SECRET_KEY!,
});

// GET - Get current subscription
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check Autumn for active subscription FIRST
    try {
      const autumnCustomerResult = await autumnSDK.customers.get(session.user.id);
      const autumnCustomer: any = (autumnCustomerResult as any)?.data ?? autumnCustomerResult;
      const products = autumnCustomer?.products;
      
      // Look for active Autumn subscription
      const autumnSub = Array.isArray(products) ? products.find((p: any) => 
        p.status === 'active' && (
          p.name?.toLowerCase().includes('professional') ||
          p.name?.toLowerCase().includes('enterprise')
        )
      ) : null;

      if (autumnSub) {
        const planId = autumnSub.name?.toLowerCase().includes('enterprise') ? 'enterprise' : 'pro';
        const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
        
        return NextResponse.json({
          subscription: {
            id: 0,
            userId: session.user.id,
            stripeCustomerId: session.user.id,
            stripeSubscriptionId: `autumn_${autumnSub.id}`,
            planId,
            status: 'active',
            currentPeriodStart: new Date(autumnSub.current_period_start).toISOString(),
            currentPeriodEnd: new Date(autumnSub.current_period_end).toISOString(),
            cancelAtPeriodEnd: false,
            trialEnd: null,
            createdAt: new Date(autumnSub.started_at).toISOString(),
            updatedAt: new Date().toISOString(),
          },
          plan,
        });
      }
    } catch (autumnError) {
      console.error('Failed to check Autumn subscription:', autumnError);
    }

    // Fall back to database subscription
    const subscription = await getUserSubscription(session.user.id);

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        plan: SUBSCRIPTION_PLANS.free,
      });
    }

    const plan = SUBSCRIPTION_PLANS[subscription.planId as keyof typeof SUBSCRIPTION_PLANS];

    return NextResponse.json({
      subscription,
      plan,
    });
  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Update subscription (upgrade/downgrade)
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { newPlanId } = body;

    const subscription = await getUserSubscription(session.user.id);

    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const newPlan = SUBSCRIPTION_PLANS[newPlanId as keyof typeof SUBSCRIPTION_PLANS];
    
    if (!newPlan || !newPlan.priceId) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    const stripe = createStripeClient('sandbox');

    // Resolve the plan's stable lookup_key → real Stripe price ID
    const priceId = await resolvePriceIdFromLookupKey(stripe, newPlan.priceId);

    // Get current Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    // Immediate switch with prorated invoice (user chose immediate upgrade/downgrade)
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: priceId,
          },
        ],
        proration_behavior: 'always_invoice',
      }
    );

    return NextResponse.json({
      subscription: updatedSubscription,
      message: 'Subscription updated successfully',
    });
  } catch (error: any) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription', details: getStripeErrorMessage(error) },
      { status: 500 }
    );
  }
}


// DELETE - Cancel subscription
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscription = await getUserSubscription(session.user.id);

    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const stripe = createStripeClient('sandbox');

    // Immediate cancellation (per user's business logic choice).
    // Webhook customer.subscription.deleted downgrades the row to Free.
    const canceledSubscription = await stripe.subscriptions.cancel(
      subscription.stripeSubscriptionId,
      { invoice_now: true, prorate: true }
    );

    return NextResponse.json({
      subscription: canceledSubscription,
      message: 'Subscription canceled immediately',
    });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription', details: getStripeErrorMessage(error) },
      { status: 500 }
    );
  }
}
