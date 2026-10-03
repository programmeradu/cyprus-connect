import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { logger } from '@/lib/log';
import { createStripeClient, currentStripeMode, StripeNotConfiguredError } from '@/lib/stripe/server';
import { syncStripeCatalog } from '@/lib/stripe/catalog';

const log = logger('api.admin.billing.setup-prices');

/** Admin only. Creates/updates plans and credit packs in the connected Stripe account. */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  try {
    const lines: string[] = [];
    await syncStripeCatalog(createStripeClient(), (l) => lines.push(l.trim()));
    return NextResponse.json({ ok: true, mode: currentStripeMode(), changes: lines });
  } catch (error) {
    if (error instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: 'PAYMENTS_OFF' }, { status: 503 });
    }
    const ref = log.error('price setup failed', error);
    return NextResponse.json({ error: 'Price setup failed', ref }, { status: 500 });
  }
}
