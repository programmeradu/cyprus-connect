import { logger } from '@/lib/log';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { createStripeClient, StripeNotConfiguredError } from '@/lib/stripe/server';
import { getUserSubscription, billingPageUrl } from '@/lib/stripe/utils';
import { auth } from '@/lib/auth';
import { readJson } from '@/lib/validate';

const log = logger('api.stripe.billing-portal');
const bodySchema = z.object({ locale: z.enum(['en', 'el']).default('en') });

// Stripe's customer page: change plan, update card or bank, download invoices, cancel.
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

    const parsed = await readJson(req, bodySchema);
    if (!parsed.ok) return parsed.response;

    const subscription = await getUserSubscription(session.user.id);
    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ error: 'No billing account yet.', code: 'NO_CUSTOMER' }, { status: 404 });
    }

    const stripe = createStripeClient();
    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: billingPageUrl(req, parsed.data.locale),
      locale: parsed.data.locale,
    });
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    if (error instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: 'Payments are not switched on yet.', code: 'PAYMENTS_OFF' }, { status: 503 });
    }
    return NextResponse.json(
      { error: 'Could not open billing settings.', ref: log.error('portal failed', error) },
      { status: 500 },
    );
  }
}
