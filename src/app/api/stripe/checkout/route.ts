import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { SUBSCRIPTION_PLANS, CREDIT_PACKAGES } from '@/lib/stripe/config';
import { getOrCreateStripeCustomer } from '@/lib/stripe/utils';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

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
    const { type, planId, packageId, successUrl, cancelUrl } = body;

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(session.user.id, session.user.email);

    let checkoutSession;

    if (type === 'subscription') {
      // Subscription checkout
      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      
      if (!plan || !plan.priceId) {
        return NextResponse.json(
          { error: 'Invalid plan selected' },
          { status: 400 }
        );
      }

      checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?tab=billing&success=true`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?tab=billing`,
        metadata: {
          userId: session.user.id,
          planId: plan.id,
          type: 'subscription',
        },
        subscription_data: {
          metadata: {
            userId: session.user.id,
            planId: plan.id,
          },
        },
      });
    } else if (type === 'credits') {
      // One-time credit purchase
      const package_ = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES];
      
      if (!package_ || !package_.priceId) {
        return NextResponse.json(
          { error: 'Invalid package selected' },
          { status: 400 }
        );
      }

      checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price: package_.priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?tab=billing&success=true`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?tab=billing`,
        payment_intent_data: {
          metadata: {
            userId: session.user.id,
            type: 'credits',
            packageId: package_.id,
            credits: package_.credits.toString(),
            description: `${package_.credits} AI Credits`,
          },
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid checkout type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    );
  }
}