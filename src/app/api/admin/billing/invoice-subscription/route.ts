import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { user } from '@/db/schema';
import { requireAdmin } from '@/lib/admin-auth';
import { readJson } from '@/lib/validate';
import { logger } from '@/lib/log';
import { createStripeClient, resolvePriceIdFromLookupKey, StripeNotConfiguredError, getStripeErrorMessage } from '@/lib/stripe/server';
import { lookupKeyFor } from '@/lib/stripe/config';
import { getOrCreateStripeCustomer, ensureFreeSubscription } from '@/lib/stripe/utils';

const log = logger('api.admin.billing.invoice-subscription');

const bodySchema = z.object({
  email: z.string().trim().email().max(254),
  planId: z.enum(['pro', 'enterprise']),
  interval: z.enum(['month', 'year']).default('year'),
  daysUntilDue: z.number().int().min(7).max(60).default(30),
  // Stripe Tax needs the billing address; a VAT number turns on EU reverse charge.
  companyName: z.string().trim().min(1).max(200),
  address: z.object({
    line1: z.string().trim().min(1).max(200),
    city: z.string().trim().min(1).max(100),
    postalCode: z.string().trim().min(1).max(20),
    country: z.string().trim().length(2).toUpperCase(),
  }),
  vatId: z.string().trim().regex(/^[A-Z]{2}[A-Z0-9]{2,13}$/i, 'VAT number like CY12345678X').optional(),
});

/**
 * Admin only. Starts a subscription for a bigger customer that is billed by
 * invoice and paid by bank transfer. Stripe emails each VAT invoice with the
 * bank details set in the Stripe dashboard.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;

  const parsed = await readJson(req, bodySchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;

  try {
    const [account] = await db.select({ id: user.id, email: user.email }).from(user).where(eq(user.email, b.email.toLowerCase())).limit(1);
    if (!account) return NextResponse.json({ error: 'No Vuneli account uses that email.', code: 'NO_ACCOUNT' }, { status: 404 });

    const stripe = createStripeClient();
    await ensureFreeSubscription(account.id);
    const customerId = await getOrCreateStripeCustomer(account.id, account.email);

    await stripe.customers.update(customerId, {
      name: b.companyName,
      address: { line1: b.address.line1, city: b.address.city, postal_code: b.address.postalCode, country: b.address.country },
    });
    if (b.vatId) {
      const existing = await stripe.customers.listTaxIds(customerId, { limit: 20 });
      const value = b.vatId.toUpperCase();
      if (!existing.data.some((t) => t.value === value)) {
        await stripe.customers.createTaxId(customerId, { type: 'eu_vat', value });
      }
    }

    const live = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
    if (live.data.length) {
      return NextResponse.json({ error: 'This customer already has an active plan. Change it in Stripe instead.', code: 'ALREADY_SUBSCRIBED' }, { status: 409 });
    }

    const priceId = await resolvePriceIdFromLookupKey(stripe, lookupKeyFor(b.planId, b.interval));
    const meta = { userId: account.id, planId: b.planId, interval: b.interval, type: 'subscription', startedBy: admin.userId };
    const sub = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      collection_method: 'send_invoice',
      days_until_due: b.daysUntilDue,
      automatic_tax: { enabled: true },
      payment_settings: { payment_method_types: ['customer_balance', 'sepa_debit', 'card'] },
      metadata: meta,
    });

    log.info('invoice subscription started', { userId: account.id, planId: b.planId, interval: b.interval, by: admin.userId });
    return NextResponse.json({ subscriptionId: sub.id, status: sub.status });
  } catch (error) {
    if (error instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: 'Payments are not switched on yet.', code: 'PAYMENTS_OFF' }, { status: 503 });
    }
    // Stripe's own message (e.g. an invalid VAT number) helps the admin fix the input.
    const ref = log.error('invoice subscription failed', error);
    return NextResponse.json({ error: getStripeErrorMessage(error), ref }, { status: 400 });
  }
}
