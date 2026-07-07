import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { creditPurchases, paymentHistory, subscriptions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Autumn as autumn } from 'autumn-js';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/config';

const autumnSDK = new autumn({
  secretKey: process.env.AUTUMN_SECRET_KEY!,
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get subscription from database
    const userSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    // Get credit purchases
    const creditPurchaseRecords = await db
      .select()
      .from(creditPurchases)
      .where(eq(creditPurchases.userId, userId))
      .orderBy(desc(creditPurchases.createdAt));

    // ===== AUTUMN CUSTOMER DATA INTEGRATION =====
    let autumnCustomer: any = null;
    let autumnPayments: any[] = [];
    
    try {
      autumnCustomer = await autumnSDK.customers.get(userId);
      
      // Transform Autumn products into payment history entries
      if (autumnCustomer?.products && Array.isArray(autumnCustomer.products)) {
        autumnPayments = autumnCustomer.products
          .filter((product: any) => {
            // Only include subscription products (Enterprise/Professional)
            const isSubscription = product.name?.toLowerCase().includes('professional') || 
                                  product.name?.toLowerCase().includes('enterprise');
            return isSubscription && product.started_at;
          })
          .map((product: any, index: number) => {
            // Extract price from items array
            const priceItem = product.items?.find((item: any) => item.type === 'price');
            const price = priceItem?.price || 0;
            
            return {
              id: `autumn_${product.id}_${index}`,
              userId,
              stripePaymentId: `autumn_sub_${product.id}`,
              amount: Math.round(price * 100), // Convert to cents
              currency: 'usd',
              status: product.canceled_at ? 'canceled' : (product.status === 'active' ? 'succeeded' : product.status),
              paymentType: 'subscription',
              description: `${product.name} Subscription`,
              createdAt: new Date(product.started_at).toISOString(),
              gateway: 'autumn',
              metadata: JSON.stringify({
                gateway: 'autumn',
                productId: product.id,
                canceledAt: product.canceled_at || undefined,
              }),
            };
          });
      }
    } catch (autumnError) {
      console.error('Failed to fetch Autumn customer data:', autumnError);
    }

    // Fetch all payment history (Stripe, Paystack, Autumn)
    const paymentRecords = await db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.userId, userId))
      .orderBy(desc(paymentHistory.createdAt))
      .limit(50);

    // Merge database payments with Autumn payments
    const allPayments = [...paymentRecords, ...autumnPayments];
    allPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate purchase summary including Autumn
    const totalCredits = creditPurchaseRecords.reduce(
      (sum, purchase) => sum + (purchase.creditsPurchased || 0),
      0
    );
    
    // Include ALL payments: credit purchases + autumn payments (all types) + payments table subscriptions
    const totalSpent = 
      creditPurchaseRecords.reduce((sum, purchase) => sum + (purchase.amountPaid || 0), 0) + 
      autumnPayments.reduce((sum, p) => sum + (p.amount || 0), 0) + 
      paymentRecords.reduce((sum, p) => sum + p.amount, 0);
      
    const lastPurchase = allPayments.length > 0 
      ? allPayments[0].createdAt 
      : null;

    // Detect payment gateway from subscription record or metadata
    let gateway = 'none';
    let currentSubscription = userSubscription[0];
    
    // Check if Autumn has active subscription that overrides database
    if (autumnCustomer?.products) {
      const autumnSub = autumnCustomer.products.find((p: any) => 
        p.status === 'active' && (
          p.name?.toLowerCase().includes('professional') ||
          p.name?.toLowerCase().includes('enterprise')
        )
      );
      
      if (autumnSub) {
        gateway = 'autumn';
        const planId = autumnSub.name?.toLowerCase().includes('enterprise') ? 'enterprise' : 'pro';
        
        // Override with Autumn subscription data
        currentSubscription = {
          id: 0,
          userId,
          stripeCustomerId: userId,
          stripeSubscriptionId: `autumn_${autumnSub.id}`,
          planId,
          status: 'active',
          currentPeriodStart: new Date(autumnSub.current_period_start).toISOString(),
          currentPeriodEnd: new Date(autumnSub.current_period_end).toISOString(),
          cancelAtPeriodEnd: false,
          trialEnd: null,
          createdAt: new Date(autumnSub.started_at).toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    }
    
    if (!gateway || gateway === 'none') {
      if (currentSubscription) {
        // Detect gateway from subscription IDs
        gateway = currentSubscription.stripeCustomerId?.startsWith('paystack_') ? 'paystack' :
                  currentSubscription.stripeSubscriptionId?.startsWith('sub_') ? 'stripe' :
                  currentSubscription.stripeSubscriptionId?.startsWith('autumn_') ? 'autumn' :
                  'stripe';
      }
    }

    // Build subscription response
    let subscriptionData = null;
    if (currentSubscription && currentSubscription.status === 'active') {
      const plan = SUBSCRIPTION_PLANS[currentSubscription.planId as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.free;
      
      subscriptionData = {
        gateway,
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

    // Add gateway information to payment history
    const enhancedPayments = allPayments.map((payment) => {
      const metadata = payment.metadata 
        ? (typeof payment.metadata === 'string' 
          ? JSON.parse(payment.metadata) 
          : payment.metadata)
        : {};
      
      const paymentGateway = payment.gateway || metadata.gateway || 
                            (payment.stripePaymentId?.startsWith('pi_') ? 'stripe' :
                             payment.stripePaymentId?.startsWith('paystack_') ? 'paystack' :
                             payment.stripePaymentId?.startsWith('autumn_') ? 'autumn' :
                             'stripe');

      return {
        ...payment,
        gateway: paymentGateway,
      };
    });

    return NextResponse.json({
      subscription: subscriptionData,
      paymentHistory: enhancedPayments,
      purchases: {
        credits: totalCredits,
        totalSpent,
        lastPurchase,
      },
    });
  } catch (error: any) {
    console.error('Get complete billing data error:', error);
    return NextResponse.json(
      { error: 'Failed to get billing data', details: error.message },
      { status: 500 }
    );
  }
}