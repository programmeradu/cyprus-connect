import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import {
  SUBSCRIPTION_PLANS,
  CREDIT_PACKAGES,
  resolveStripeVariant,
} from '@/lib/stripe/config';
import { getOrCreateStripeCustomer } from '@/lib/stripe/utils';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, planId, packageId, successUrl, cancelUrl, currency, locale } = body;

    const customerId = await getOrCreateStripeCustomer(session.user.id, session.user.email);
    const variant = resolveStripeVariant(currency);
    const isEur = variant === 'eur';

    // Shared EU/Cyprus tax settings: Stripe Tax computes VAT (19% for CY)
    // from the collected billing address; tax_id_collection lets EU B2B
    // customers enter their VAT number for a reverse-charge invoice.
    const taxSettings = {
      automatic_tax: { enabled: true as const },
      tax_id_collection: { enabled: true as const },
      billing_address_collection: 'required' as const,
      customer_update: {
        address: 'auto' as const,
        name: 'auto' as const,
      },
      locale: (locale === 'el' ? 'el' : 'en') as 'el' | 'en',
    };

    let checkoutSession;

    if (type === 'subscription') {
      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      const priceId = isEur ? plan?.priceIdEur : plan?.priceId;

      if (!plan || !priceId) {
        return NextResponse.json(
          { error: `Invalid plan or missing ${variant.toUpperCase()} price` },
          { status: 400 }
        );
      }

      checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?tab=billing&success=true`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?tab=billing`,
        metadata: {
          userId: session.user.id,
          planId: plan.id,
          type: 'subscription',
          currency: variant,
        },
        subscription_data: {
          metadata: {
            userId: session.user.id,
            planId: plan.id,
            currency: variant,
          },
        },
        ...taxSettings,
      });
    } else if (type === 'credits') {
      const package_ = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES];
      const priceId = isEur ? package_?.priceIdEur : package_?.priceId;

      if (!package_ || !priceId) {
        return NextResponse.json(
          { error: `Invalid package or missing ${variant.toUpperCase()} price` },
          { status: 400 }
        );
      }

      checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?tab=billing&success=true`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?tab=billing`,
        payment_intent_data: {
          metadata: {
            userId: session.user.id,
            type: 'credits',
            packageId: package_.id,
            credits: package_.credits.toString(),
            currency: variant,
            description: `${package_.credits} AI Credits`,
          },
        },
        ...taxSettings,
      });
    } else {
      return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 });
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
