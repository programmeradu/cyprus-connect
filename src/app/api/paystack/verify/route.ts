import { NextRequest, NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack/server';
import { db } from '@/db';
import { subscriptions, paymentHistory, creditPurchases, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    const response = await verifyTransaction(reference);
    const { data } = response;

    if (data.status !== 'success') {
      return NextResponse.json({ 
        success: false, 
        message: data.gateway_response || 'Payment verification failed' 
      });
    }

    const metadata = data.metadata as { userId?: string; type?: string; planId?: string; packageId?: string; credits?: number };

    if (metadata.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.insert(paymentHistory).values({
      userId: metadata.userId!,
      stripePaymentId: reference,
      amount: data.amount,
      currency: data.currency,
      status: 'succeeded',
      paymentType: metadata.type === 'credits' ? 'credits' : 'subscription',
      description: metadata.type === 'credits' 
        ? `${metadata.credits} AI Credits (Paystack)` 
        : `${metadata.planId} subscription (Paystack)`,
      metadata: JSON.stringify({ ...metadata, gateway: 'paystack', paystackReference: reference }),
      createdAt: new Date().toISOString(),
    });

    if (metadata.type === 'credits' && metadata.credits) {
      await db.insert(creditPurchases).values({
        userId: metadata.userId!,
        stripePaymentId: reference,
        creditsPurchased: metadata.credits,
        amountPaid: data.amount,
        currency: data.currency,
        createdAt: new Date().toISOString(),
      });

      const currentUser = await db.select().from(user).where(eq(user.id, metadata.userId!)).limit(1);
      const currentCredits = currentUser[0]?.totalCredits || 0;
      
      await db.update(user).set({
        totalCredits: currentCredits + metadata.credits,
        updatedAt: new Date(),
      }).where(eq(user.id, metadata.userId!));
    }

    if (metadata.type === 'subscription' && metadata.planId) {
      const existing = await db.select().from(subscriptions).where(eq(subscriptions.userId, metadata.userId!)).limit(1);

      if (existing[0]) {
        await db.update(subscriptions).set({
          planId: metadata.planId,
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        }).where(eq(subscriptions.userId, metadata.userId!));
      } else {
        await db.insert(subscriptions).values({
          userId: metadata.userId!,
          stripeCustomerId: `paystack_${data.customer.customer_code}`,
          planId: metadata.planId,
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        reference: data.reference,
        amount: data.amount,
        currency: data.currency,
        type: metadata.type,
        planId: metadata.planId,
        credits: metadata.credits,
      },
    });
  } catch (error: unknown) {
    console.error('Paystack verify error:', error);
    const message = error instanceof Error ? error.message : 'Verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
