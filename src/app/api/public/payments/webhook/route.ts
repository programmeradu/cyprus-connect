import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/log';
import { db } from '@/db';
import { stripeEvents } from '@/db/schema';
import { verifyWebhook, type StripeWebhookEvent } from '@/lib/stripe/server';
import {
  onCheckoutPaid,
  onCheckoutPaymentFailed,
  onInvoicePaid,
  onInvoiceProblem,
  onSubscriptionChanged,
  onSubscriptionDeleted,
} from '@/lib/stripe/webhook-handlers';

const log = logger('api.public.payments.webhook');

/**
 * Stripe webhook for Vuneli's own account. Point Stripe at
 * https://vuneli.com/api/public/payments/webhook and set
 * STRIPE_WEBHOOK_SECRET. Any ?env= query from the old setup is ignored:
 * the secret key decides test vs live.
 */
async function handle(event: StripeWebhookEvent) {
  const obj = event.data.object;
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      return onSubscriptionChanged(obj, event.type);
    case 'customer.subscription.deleted':
      return onSubscriptionDeleted(obj);
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      return onCheckoutPaid(obj);
    case 'checkout.session.async_payment_failed':
      return onCheckoutPaymentFailed(obj);
    case 'invoice.paid':
      return onInvoicePaid(obj);
    case 'invoice.payment_failed':
      return onInvoiceProblem(obj, 'payment_failed');
    case 'invoice.overdue':
      return onInvoiceProblem(obj, 'overdue');
    default:
      return undefined;
  }
}

export async function POST(req: NextRequest) {
  let event: StripeWebhookEvent;
  try {
    event = await verifyWebhook(req);
  } catch (err) {
    log.warn('signature rejected', { reason: err instanceof Error ? err.message : 'unknown' });
    return new NextResponse('Invalid signature', { status: 400 });
  }

  // Claim the event id; a retry of an event already handled stops here.
  const claimed = await db
    .insert(stripeEvents)
    .values({ id: event.id, type: event.type, livemode: !!event.livemode })
    .onConflictDoNothing({ target: stripeEvents.id })
    .returning({ id: stripeEvents.id });
  if (claimed.length === 0) return NextResponse.json({ received: true, duplicate: true });

  try {
    await handle(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    // Release the claim so Stripe's retry can try again.
    await db.delete(stripeEvents).where(eq(stripeEvents.id, event.id)).catch(() => undefined);
    const ref = log.error('webhook handling failed', error, { type: event.type, eventId: event.id });
    return NextResponse.json({ received: false, ref }, { status: 500 });
  }
}
