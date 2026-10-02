import { NextResponse } from 'next/server';
import { currentStripeMode } from '@/lib/stripe/server';
import type { PaymentsStatus } from '@/lib/stripe/env';

// Whether payments are on, and in test or live mode. No secrets, no account data.
export async function GET() {
  const mode = currentStripeMode();
  const body: PaymentsStatus = { configured: mode !== null, mode };
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
}
