import { logger } from '@/lib/log';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserSubscription, listInvoicesForCustomer } from '@/lib/stripe/utils';
import { isStripeConfigured } from '@/lib/stripe/server';

const log = logger('api.stripe.payment-history');

// The customer's Stripe invoices (VAT receipts and bank-transfer bills) with PDF links.
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

    const sub = await getUserSubscription(session.user.id);
    if (!sub?.stripeCustomerId || !isStripeConfigured()) return NextResponse.json({ invoices: [] });
    return NextResponse.json({ invoices: await listInvoicesForCustomer(sub.stripeCustomerId) });
  } catch (error) {
    return NextResponse.json({ error: 'Could not load invoices.', ref: log.error('list failed', error) }, { status: 500 });
  }
}
