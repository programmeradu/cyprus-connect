import { NextResponse } from 'next/server';

// This endpoint is superseded by /api/public/payments/webhook (Lovable
// built-in payments). Kept as a 410 Gone stub in case Stripe still holds the
// old URL from the legacy BYOK integration.
export async function POST() {
  return NextResponse.json(
    {
      error: 'Endpoint retired',
      message:
        'Stripe webhooks are now handled at /api/public/payments/webhook. Update your Stripe dashboard.',
    },
    { status: 410 },
  );
}

export async function GET() {
  return NextResponse.json({ status: 'retired' }, { status: 410 });
}
