import { NextRequest, NextResponse } from 'next/server';
import { createStripeClient, getStripeErrorMessage } from '@/lib/stripe/server';
import { getUserSubscription } from '@/lib/stripe/utils';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const subscription = await getUserSubscription(session.user.id);
    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { returnUrl } = body as { returnUrl?: string };
    const stripe = createStripeClient('sandbox');

    // Configure the portal so:
    //  - Plan changes apply immediately with prorated invoicing
    //  - Cancellation revokes access immediately (matches webhook behavior)
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?tab=billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session', details: getStripeErrorMessage(error) },
      { status: 500 },
    );
  }
}
