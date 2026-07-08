import { NextRequest, NextResponse } from 'next/server';
import { createStripeClient, resolvePriceIdFromLookupKey, getStripeErrorMessage } from '@/lib/stripe/server';
import { resolveStripeEnvFromRequest } from '@/lib/stripe/env';
import {
  SUBSCRIPTION_PLANS,
  CREDIT_PACKAGES,
  resolveStripeVariant,
} from '@/lib/stripe/config';
import { getOrCreateStripeCustomer, ensureFreeSubscription } from '@/lib/stripe/utils';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, planId, packageId, successUrl, cancelUrl, currency, locale } = body;

    const env = resolveStripeEnvFromRequest(req);
    const stripe = createStripeClient(env);

    // Guarantee a Free-tier row exists first — used as fallback if payment
    // is cancelled and needed for the customer id backfill below.
    await ensureFreeSubscription(session.user.id);
    const customerId = await getOrCreateStripeCustomer(env, session.user.id, session.user.email);
    const variant = resolveStripeVariant(currency);
    const isEur = variant === 'eur';

    // Full compliance handling: Stripe handles tax + fraud + disputes +
    // support end-to-end for buyers in the ~80 supported countries and
    // falls back to tax calculation only for buyers elsewhere. Adds +3.5%
    // per transaction. Customer bank statements show `LINK.COM* …`.
    const managedPayments = { managed_payments: { enabled: true } as any };

    let checkoutSession;

    if (type === 'subscription') {
      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      const lookupKey = isEur ? plan?.priceIdEur : plan?.priceId;
      if (!plan || !lookupKey) {
        return NextResponse.json(
          { error: `Invalid plan or missing ${variant.toUpperCase()} price` },
          { status: 400 },
        );
      }
      const priceId = await resolvePriceIdFromLookupKey(stripe, lookupKey);

      checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url:
          successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?tab=billing&success=true`,
        cancel_url:
          cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?tab=billing`,
        locale: (locale === 'el' ? 'el' : 'en') as 'el' | 'en',
        metadata: {
          userId: session.user.id,
          planId: plan.id,
          type: 'subscription',
          currency: variant,
          managed_payments: 'true',
        },
        subscription_data: {
          metadata: { userId: session.user.id, planId: plan.id, currency: variant },
        },
        ...managedPayments,
      } as any);
    } else if (type === 'credits') {
      const package_ = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES];
      const lookupKey = isEur ? package_?.priceIdEur : package_?.priceId;
      if (!package_ || !lookupKey) {
        return NextResponse.json(
          { error: `Invalid package or missing ${variant.toUpperCase()} price` },
          { status: 400 },
        );
      }
      const priceId = await resolvePriceIdFromLookupKey(stripe, lookupKey);

      checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url:
          successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?tab=billing&success=true`,
        cancel_url:
          cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?tab=billing`,
        locale: (locale === 'el' ? 'el' : 'en') as 'el' | 'en',
        payment_intent_data: {
          description: `${package_.credits} AI Credits`,
          metadata: {
            userId: session.user.id,
            type: 'credits',
            packageId: package_.id,
            credits: package_.credits.toString(),
            currency: variant,
          },
        },
        metadata: {
          userId: session.user.id,
          type: 'credits',
          packageId: package_.id,
          credits: package_.credits.toString(),
          managed_payments: 'true',
        },
        ...managedPayments,
      } as any);
    } else {
      return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 });
    }

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: getStripeErrorMessage(error) },
      { status: 500 },
    );
  }
}
