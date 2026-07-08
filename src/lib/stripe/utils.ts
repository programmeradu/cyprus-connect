import { createStripeClient, type StripeEnv } from './server';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from './config';
import { db } from '@/db';
import { subscriptions, paymentHistory, creditPurchases, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Ensure the user has a `subscriptions` row. Every user gets a Free-tier
 * entitlement row on first read; downstream code can then rely on the row
 * always existing. Also grants the plan's monthly AI credit floor on first
 * insert.
 */
export async function ensureFreeSubscription(userId: string) {
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing[0]) return existing[0];

  const now = new Date().toISOString();
  const inserted = await db
    .insert(subscriptions)
    .values({
      userId,
      planId: 'free',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Grant the Free plan's monthly AI credit floor on signup.
  const freeCredits = SUBSCRIPTION_PLANS.free.limits.aiCredits;
  if (freeCredits > 0) {
    const u = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (u[0]) {
      await db
        .update(user)
        .set({ totalCredits: (u[0].totalCredits || 0) + freeCredits, updatedAt: new Date() })
        .where(eq(user.id, userId));
    }
  }
  console.log('[analytics]', JSON.stringify({ userId, event: 'plan_started', planId: 'free' }));
  return inserted[0];
}

/**
 * Resolve or create a Stripe customer for a user, tagged with
 * metadata.userId so webhook + portal + Search API can find them later.
 * Uses stripe.customers.search first (works even if we have no local row),
 * then falls back to email match, then creates.
 */
export async function getOrCreateStripeCustomer(
  env: StripeEnv,
  userId: string,
  email: string,
): Promise<string> {
  const stripe = createStripeClient(env);

  // 1) Local shortcut: reuse the customer id we already know about.
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  if (existing[0]?.stripeCustomerId) return existing[0].stripeCustomerId;

  // 2) Search Stripe by userId metadata (survives DB resets, avoids dupes).
  if (/^[a-zA-Z0-9_-]+$/.test(userId)) {
    try {
      const found = await stripe.customers.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 1,
      });
      if (found.data.length) {
        await db
          .update(subscriptions)
          .set({ stripeCustomerId: found.data[0].id, updatedAt: new Date().toISOString() })
          .where(eq(subscriptions.userId, userId));
        return found.data[0].id;
      }
    } catch {
      // search unavailable in some envs — ignore, fall through
    }
  }

  // 3) Fallback: match by email, backfill metadata.
  const byEmail = await stripe.customers.list({ email, limit: 1 });
  if (byEmail.data.length) {
    const c = byEmail.data[0];
    if (c.metadata?.userId !== userId) {
      await stripe.customers.update(c.id, { metadata: { ...c.metadata, userId } });
    }
    await db
      .update(subscriptions)
      .set({ stripeCustomerId: c.id, updatedAt: new Date().toISOString() })
      .where(eq(subscriptions.userId, userId));
    return c.id;
  }

  // 4) Create fresh.
  const customer = await stripe.customers.create({ email, metadata: { userId } });

  await ensureFreeSubscription(userId);
  await db
    .update(subscriptions)
    .set({ stripeCustomerId: customer.id, updatedAt: new Date().toISOString() })
    .where(eq(subscriptions.userId, userId));

  return customer.id;
}

export async function getUserSubscription(userId: string) {
  const subs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return subs[0] || null;
}

export async function checkFeatureAccess(
  userId: string,
  feature: keyof typeof SUBSCRIPTION_PLANS.free.limits,
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  const planId = (subscription?.planId || 'free') as SubscriptionPlanId;
  const plan = SUBSCRIPTION_PLANS[planId];
  const limit = plan.limits[feature];
  if (limit === -1) return true;
  if (typeof limit === 'boolean') return limit;
  return true;
}

export async function recordPayment(
  userId: string,
  stripePaymentId: string,
  amount: number,
  currency: string,
  status: string,
  paymentType: 'subscription' | 'one_time' | 'credits',
  description: string,
  metadata?: Record<string, any>,
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

export async function recordCreditPurchase(
  userId: string,
  stripePaymentId: string,
  creditsPurchased: number,
  amountPaid: number,
  currency: string,
) {
  await db.insert(creditPurchases).values({
    userId,
    stripePaymentId,
    creditsPurchased,
    amountPaid,
    currency,
    createdAt: new Date().toISOString(),
  });
  const currentUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  const currentCredits = currentUser[0]?.totalCredits || 0;
  await db
    .update(user)
    .set({ totalCredits: currentCredits + creditsPurchased, updatedAt: new Date() })
    .where(eq(user.id, userId));
}

export function getSubscriptionPlanDetails(planId: SubscriptionPlanId) {
  return SUBSCRIPTION_PLANS[planId];
}
