import { NextRequest, NextResponse } from 'next/server';
import { getUserSubscription } from '@/lib/stripe/utils';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/server';
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

    // Get current Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: newPlan.priceId,
          },
        ],
        proration_behavior: 'create_prorations',
      }
    );

    return NextResponse.json({
      subscription: updatedSubscription,
      message: 'Subscription updated successfully',
    });
  } catch (error: any) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription', details: error.message },
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

    // Cancel at period end (don't immediately cancel)
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    return NextResponse.json({
      subscription: updatedSubscription,
      message: 'Subscription will be canceled at the end of the billing period',
    });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription', details: error.message },
      { status: 500 }
    );
  }
}