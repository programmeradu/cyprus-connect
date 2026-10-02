import { logger } from '@/lib/log';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { creditPurchases, subscriptions } from '@/db/schema';
import { SUBSCRIPTION_PLANS, priceFor, type SubscriptionPlanId } from '@/lib/stripe/config';
import { isStripeConfigured } from '@/lib/stripe/server';
import { listInvoicesForCustomer, type InvoiceSummary } from '@/lib/stripe/utils';

const log = logger('api.billing.complete');

// Everything the Plan page shows, in one call.
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    const userId = session.user.id;

    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).orderBy(desc(subscriptions.createdAt)).limit(1);
    const credits = await db.select().from(creditPurchases).where(eq(creditPurchases.userId, userId));

    let invoices: InvoiceSummary[] = [];
    let invoicesError = false;
    if (sub?.stripeCustomerId && isStripeConfigured()) {
      try {
        invoices = await listInvoicesForCustomer(sub.stripeCustomerId);
      } catch (e) {
        invoicesError = true;
        log.warn('invoices unavailable', { ref: log.error('invoice list failed', e) });
      }
    }

    const planId = (sub?.planId || 'free') as SubscriptionPlanId;
    const interval = (sub?.billingInterval === 'year' ? 'year' : 'month') as 'month' | 'year';
    const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;
    const paid = planId !== 'free' && sub?.stripeSubscriptionId;

    return NextResponse.json({
      paymentsOn: isStripeConfigured(),
      subscription: paid
        ? {
            status: sub!.status,
            planId,
            planName: plan.name,
            price: priceFor(planId, interval),
            currency: 'EUR',
            interval,
            collectionMethod: sub!.collectionMethod || 'charge_automatically',
            currentPeriodEnd: sub!.currentPeriodEnd,
            cancelAtPeriodEnd: !!sub!.cancelAtPeriodEnd,
          }
        : null,
      hasBillingAccount: !!sub?.stripeCustomerId,
      invoices,
      invoicesError,
      purchases: { credits: credits.reduce((s, p) => s + (p.creditsPurchased || 0), 0) },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Could not load billing.', ref: log.error('request failed', error) }, { status: 500 });
  }
}
