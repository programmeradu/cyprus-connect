import { NextRequest, NextResponse } from 'next/server';
import { initializeTransaction, generateReference } from '@/lib/paystack/server';
import { PAYSTACK_PLANS, PAYSTACK_CREDIT_PACKAGES } from '@/lib/paystack/config';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, planId, packageId, currency = 'NGN' } = body;

    const reference = generateReference();
    let amount: number;
    let metadata: Record<string, unknown>;

    if (type === 'subscription') {
      const plan = PAYSTACK_PLANS[planId as keyof typeof PAYSTACK_PLANS];
      
      if (!plan || plan.amount === 0) {
        return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
      }

      amount = plan.amount;
      metadata = {
        userId: session.user.id,
        type: 'subscription',
        planId: plan.id,
        custom_fields: [
          { display_name: 'User ID', variable_name: 'user_id', value: session.user.id },
          { display_name: 'Plan', variable_name: 'plan', value: plan.name },
        ],
      };
    } else if (type === 'credits') {
      const pkg = PAYSTACK_CREDIT_PACKAGES[packageId as keyof typeof PAYSTACK_CREDIT_PACKAGES];
      
      if (!pkg) {
        return NextResponse.json({ error: 'Invalid package selected' }, { status: 400 });
      }

      amount = pkg.amount;
      metadata = {
        userId: session.user.id,
        type: 'credits',
        packageId: pkg.id,
        credits: pkg.credits,
        custom_fields: [
          { display_name: 'User ID', variable_name: 'user_id', value: session.user.id },
          { display_name: 'Credits', variable_name: 'credits', value: pkg.credits.toString() },
        ],
      };
    } else {
      return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 });
    }

    const response = await initializeTransaction({
      email: session.user.email,
      amount,
      reference,
      currency,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?tab=billing&paystack=true&reference=${reference}`,
      metadata,
    });

    return NextResponse.json({
      authorization_url: response.data.authorization_url,
      access_code: response.data.access_code,
      reference: response.data.reference,
    });
  } catch (error: unknown) {
    console.error('Paystack initialize error:', error);
    const message = error instanceof Error ? error.message : 'Failed to initialize payment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
