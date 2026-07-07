import { stripe } from './server';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from './config';
import { db } from '@/db';
import { subscriptions, paymentHistory, creditPurchases, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(userId: string, email: string) {
  // Check if customer already exists in our database
  const existingSub = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  
  if (existingSub[0]?.stripeCustomerId) {
    return existingSub[0].stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  // Create subscription record with free plan
  await db.insert(subscriptions).values({
    userId,
    stripeCustomerId: customer.id,
    planId: 'free',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return customer.id;
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: string) {
  const subs = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return subs[0] || null;
}

/**
 * Check if user has access to a feature based on their plan
 */
export async function checkFeatureAccess(
  userId: string,
  feature: keyof typeof SUBSCRIPTION_PLANS.free.limits
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  const planId = (subscription?.planId || 'free') as SubscriptionPlanId;
  const plan = SUBSCRIPTION_PLANS[planId];
  
  const limit = plan.limits[feature];
  
  // -1 means unlimited
  if (limit === -1) return true;
  
  // Boolean features
  if (typeof limit === 'boolean') return limit;
  
  // For numeric limits, you'd check against current usage
  // This is a simplified version - in production, track actual usage
  return true;
}

/**
 * Update subscription status from Stripe webhook
 */
export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string,
  currentPeriodStart?: number,
  currentPeriodEnd?: number,
  cancelAtPeriodEnd?: boolean
) {
  const updateData: any = {
    status,
    updatedAt: new Date().toISOString(),
  };

  if (currentPeriodStart) {
    updateData.currentPeriodStart = new Date(currentPeriodStart * 1000).toISOString();
  }
  
  if (currentPeriodEnd) {
    updateData.currentPeriodEnd = new Date(currentPeriodEnd * 1000).toISOString();
  }
  
  if (cancelAtPeriodEnd !== undefined) {
    updateData.cancelAtPeriodEnd = cancelAtPeriodEnd;
  }

  await db
    .update(subscriptions)
    .set(updateData)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}

/**
 * Record a payment in history
 */
export async function recordPayment(
  userId: string,
  stripePaymentId: string,
  amount: number,
  currency: string,
  status: string,
  paymentType: 'subscription' | 'one_time' | 'credits',
  description: string,
  metadata?: Record<string, any>
) {
  await db.insert(paymentHistory).values({
    userId,
    stripePaymentId,
    amount,
    currency,
    status,
    paymentType,
    description,
    metadata: metadata ? JSON.stringify(metadata) : null,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Record a credit purchase
 */
export async function recordCreditPurchase(
  userId: string,
  stripePaymentId: string,
  creditsPurchased: number,
  amountPaid: number,
  currency: string
) {
  // Record the purchase
  await db.insert(creditPurchases).values({
    userId,
    stripePaymentId,
    creditsPurchased,
    amountPaid,
    currency,
    createdAt: new Date().toISOString(),
  });

  // Update user's total credits
  const currentUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  const currentCredits = currentUser[0]?.totalCredits || 0;
  
  await db
    .update(user)
    .set({
      totalCredits: currentCredits + creditsPurchased,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));
}

/**
 * Get subscription plan details
 */
export function getSubscriptionPlanDetails(planId: SubscriptionPlanId) {
  return SUBSCRIPTION_PLANS[planId];
}

/**
 * Calculate prorated amount for plan upgrade/downgrade
 */
export async function calculateProration(
  userId: string,
  newPlanId: SubscriptionPlanId
): Promise<number> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription?.stripeSubscriptionId) {
    return 0;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
  
  const newPlan = SUBSCRIPTION_PLANS[newPlanId];
  
  if (!newPlan.priceId) {
    return 0;
  }

  // Create a preview invoice to calculate proration
  const upcomingInvoice = await (stripe.invoices as any).retrieveUpcoming({
    customer: subscription.stripeCustomerId!,
    subscription: subscription.stripeSubscriptionId,
    subscription_items: [
      {
        id: stripeSubscription.items.data[0].id,
        price: newPlan.priceId,
      },
    ],
    subscription_proration_behavior: 'create_prorations',
  });

  return upcomingInvoice.amount_due;
}