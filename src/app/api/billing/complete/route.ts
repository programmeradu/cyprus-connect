import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { creditPurchases, paymentHistory, subscriptions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/config';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const userSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    const creditPurchaseRecords = await db
      .select()
      .from(creditPurchases)
      .where(eq(creditPurchases.userId, userId))
      .orderBy(desc(creditPurchases.createdAt));

    const paymentRecords = await db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.userId, userId))
      .orderBy(desc(paymentHistory.createdAt))
      .limit(50);

    const totalCredits = creditPurchaseRecords.reduce(
      (sum, purchase) => sum + (purchase.creditsPurchased || 0),
      0,
    );
    const totalSpent =
      creditPurchaseRecords.reduce((sum, p) => sum + (p.amountPaid || 0), 0) +
      paymentRecords.reduce((sum, p) => sum + p.amount, 0);
    const lastPurchase = paymentRecords[0]?.createdAt ?? creditPurchaseRecords[0]?.createdAt ?? null;

    const currentSubscription = userSubscription[0];
    let subscriptionData: any = null;
    if (currentSubscription && currentSubscription.status === 'active') {
      const plan =
        SUBSCRIPTION_PLANS[currentSubscription.planId as keyof typeof SUBSCRIPTION_PLANS] ||
        SUBSCRIPTION_PLANS.free;
      subscriptionData = {
        gateway: 'stripe',
        status: currentSubscription.status,
        planId: currentSubscription.planId,
        planName: plan.name,
        price: plan.price,
        currency: 'USD',
        interval: plan.interval,
        currentPeriodEnd: currentSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: currentSubscription.cancelAtPeriodEnd || false,
      };
    }

    const enhancedPayments = paymentRecords.map((payment) => ({ ...payment, gateway: 'stripe' }));

    return NextResponse.json({
      subscription: subscriptionData,
      paymentHistory: enhancedPayments,
      purchases: { credits: totalCredits, totalSpent, lastPurchase },
    });
  } catch (error: any) {
    console.error('Get complete billing data error:', error);
    return NextResponse.json(
      { error: 'Failed to get billing data', details: error.message },
      { status: 500 },
    );
  }
}
