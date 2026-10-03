import { logger } from '@/lib/log';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import type Stripe from 'stripe';
import {
  createStripeClient,
  resolvePriceIdFromLookupKey,
  StripeNotConfiguredError,
} from '@/lib/stripe/server';
import { CREDIT_PACKAGES, lookupKeyFor } from '@/lib/stripe/config';
import { getOrCreateStripeCustomer, ensureFreeSubscription, billingPageUrl } from '@/lib/stripe/utils';
import { auth } from '@/lib/auth';
import { readJson } from '@/lib/validate';

const log = logger('api.stripe.checkout');

const bodySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('subscription'),
    planId: z.enum(['pro', 'enterprise']),
    interval: z.enum(['month', 'year']).default('month'),
    locale: z.enum(['en', 'el']).default('en'),
  }),
  z.object({
    type: z.literal('credits'),
    packageId: z.enum(['small', 'medium', 'large', 'credits_100', 'credits_500', 'credits_1000']),
    locale: z.enum(['en', 'el']).default('en'),
  }),
]);

/**
 * Starts a Stripe Checkout page. VAT is worked out by Stripe Tax from the
 * billing address; a business can enter its VAT number so EU reverse charge
 * applies. Card and SEPA Direct Debit are offered (all prices are EUR).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

    const parsed = await readJson(req, bodySchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const stripe = createStripeClient();
    await ensureFreeSubscription(session.user.id);
    const customerId = await getOrCreateStripeCustomer(session.user.id, session.user.email);

    const common = {
      customer: customerId,
      locale: body.locale as Stripe.Checkout.SessionCreateParams.Locale,
      success_url: billingPageUrl(req, body.locale, 'checkout=success&session_id={CHECKOUT_SESSION_ID}'),
      cancel_url: billingPageUrl(req, body.locale, 'checkout=canceled'),
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      billing_address_collection: 'required' as const,
      customer_update: { address: 'auto' as const, name: 'auto' as const },
      allow_promotion_codes: true,
    };

    let checkout: Stripe.Checkout.Session;
    if (body.type === 'subscription') {
      const priceId = await resolvePriceIdFromLookupKey(stripe, lookupKeyFor(body.planId, body.interval));
      const meta = { userId: session.user.id, planId: body.planId, interval: body.interval, type: 'subscription' };
      checkout = await stripe.checkout.sessions.create({
        ...common,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: meta,
        subscription_data: { metadata: meta },
      });
    } else {
      const pack = Object.entries(CREDIT_PACKAGES).find(([k, v]) => k === body.packageId || v.id === body.packageId)![1];
      const priceId = await resolvePriceIdFromLookupKey(stripe, pack.lookupKey);
      const meta = { userId: session.user.id, type: 'credits', packageId: pack.id, credits: String(pack.credits) };
      checkout = await stripe.checkout.sessions.create({
        ...common,
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: meta,
        payment_intent_data: { description: `${pack.credits} AI credits`, metadata: meta },
        // A proper VAT invoice for one-off purchases too.
        invoice_creation: { enabled: true, invoice_data: { metadata: meta } },
      });
    }

    return NextResponse.json({ sessionId: checkout.id, url: checkout.url });
  } catch (error) {
    if (error instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: 'Payments are not switched on yet.', code: 'PAYMENTS_OFF' }, { status: 503 });
    }
    return NextResponse.json(
      { error: 'Could not open the payment page. Please try again.', ref: log.error('checkout failed', error) },
      { status: 500 },
    );
  }
}
