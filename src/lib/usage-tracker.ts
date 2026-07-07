import { db } from '@/db';
import { userActions, user, creditsHistory } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from './stripe/config';
import { getUserSubscription } from './stripe/utils';

/**
 * Get the current month's start and end dates
 */
function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Get the number of actions completed this month
 */
export async function getMonthlyActionCount(userId: string): Promise<number> {
  const { start, end } = getCurrentMonthRange();
  
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(userActions)
    .where(
      and(
        eq(userActions.userId, userId),
        gte(userActions.completedAt, start)
      )
    );
  
  return result[0]?.count ?? 0;
}

/**
 * Check if user can perform an action based on their plan limits
 */
export async function canPerformAction(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
}> {
  const subscription = await getUserSubscription(userId);
  const planId = (subscription?.planId || 'free') as SubscriptionPlanId;
  const plan = SUBSCRIPTION_PLANS[planId];
  
  // -1 means unlimited
  if (plan.limits.actionsPerMonth === -1) {
    return { allowed: true };
  }
  
  const currentCount = await getMonthlyActionCount(userId);
  const limit = plan.limits.actionsPerMonth;
  
  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `Monthly action limit reached (${limit} actions)`,
      limit,
      current: currentCount,
    };
  }
  
  return {
    allowed: true,
    limit,
    current: currentCount,
  };
}

/**
 * Check if user has enough AI credits
 */
export async function hasEnoughCredits(userId: string, requiredCredits: number = 1): Promise<{
  allowed: boolean;
  reason?: string;
  balance?: number;
}> {
  const users = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  const currentUser = users[0];
  
  if (!currentUser) {
    return {
      allowed: false,
      reason: 'User not found',
    };
  }
  
  const balance = currentUser.totalCredits || 0;
  
  if (balance < requiredCredits) {
    return {
      allowed: false,
      reason: `Insufficient AI credits (need ${requiredCredits}, have ${balance})`,
      balance,
    };
  }
  
  return {
    allowed: true,
    balance,
  };
}

/**
 * Deduct AI credits from user balance
 */
export async function deductCredits(
  userId: string,
  amount: number,
  source: string,
  description: string,
  actionId?: number
): Promise<boolean> {
  try {
    // Check if user has enough credits
    const check = await hasEnoughCredits(userId, amount);
    if (!check.allowed) {
      return false;
    }
    
    // Deduct credits
    const currentUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    const newBalance = (currentUser[0]?.totalCredits || 0) - amount;
    
    await db
      .update(user)
      .set({
        totalCredits: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
    
    // Record transaction
    await db.insert(creditsHistory).values({
      userId,
      amount: -amount, // Negative for deduction
      source,
      actionId: actionId || null,
      description,
      createdAt: new Date().toISOString(),
    });
    
    return true;
  } catch (error) {
    console.error('Failed to deduct credits:', error);
    return false;
  }
}

/**
 * Add AI credits to user balance
 */
export async function addCredits(
  userId: string,
  amount: number,
  source: string,
  description: string
): Promise<boolean> {
  try {
    const currentUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    const newBalance = (currentUser[0]?.totalCredits || 0) + amount;
    
    await db
      .update(user)
      .set({
        totalCredits: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
    
    // Record transaction
    await db.insert(creditsHistory).values({
      userId,
      amount, // Positive for addition
      source,
      description,
      createdAt: new Date().toISOString(),
    });
    
    return true;
  } catch (error) {
    console.error('Failed to add credits:', error);
    return false;
  }
}

/**
 * Get user's credit balance
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const users = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  return users[0]?.totalCredits || 0;
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(
  userId: string,
  feature: keyof typeof SUBSCRIPTION_PLANS.free.limits
): Promise<{
  allowed: boolean;
  reason?: string;
  requiredPlan?: string;
}> {
  const subscription = await getUserSubscription(userId);
  const planId = (subscription?.planId || 'free') as SubscriptionPlanId;
  const plan = SUBSCRIPTION_PLANS[planId];
  
  const access = plan.limits[feature];
  
  // -1 means unlimited (allowed)
  if (access === -1) {
    return { allowed: true };
  }
  
  // Boolean features
  if (typeof access === 'boolean') {
    if (!access) {
      // Find which plan has this feature
      const requiredPlan = Object.entries(SUBSCRIPTION_PLANS).find(
        ([_, p]) => p.limits[feature] === true
      )?.[0];
      
      return {
        allowed: false,
        reason: `This feature requires ${requiredPlan} plan`,
        requiredPlan: requiredPlan || 'pro',
      };
    }
    return { allowed: true };
  }
  
  // Numeric limits - in this case we just check if limit > 0
  if (typeof access === 'number') {
    if (access <= 0) {
      return {
        allowed: false,
        reason: 'Feature not available in current plan',
        requiredPlan: 'pro',
      };
    }
    return { allowed: true };
  }
  
  return { allowed: true };
}

/**
 * Get usage statistics for display
 */
export async function getUsageStats(userId: string) {
  const subscription = await getUserSubscription(userId);
  const planId = (subscription?.planId || 'free') as SubscriptionPlanId;
  const plan = SUBSCRIPTION_PLANS[planId];
  
  const actionsThisMonth = await getMonthlyActionCount(userId);
  const creditBalance = await getCreditBalance(userId);
  
  return {
    plan: planId,
    actions: {
      used: actionsThisMonth,
      limit: plan.limits.actionsPerMonth,
      unlimited: plan.limits.actionsPerMonth === -1,
      percentage: plan.limits.actionsPerMonth === -1 
        ? 0 
        : (actionsThisMonth / plan.limits.actionsPerMonth) * 100,
    },
    credits: {
      balance: creditBalance,
      monthlyAllocation: plan.limits.aiCredits,
    },
    features: {
      advancedAnalytics: plan.limits.advancedAnalytics,
      customReports: plan.limits.customReports,
      prioritySupport: plan.limits.prioritySupport,
      teamMembers: plan.limits.teamMembers,
      integrations: plan.limits.integrations,
    },
  };
}

/**
 * Middleware helper for API routes to check feature access
 */
export async function requireFeatureAccess(
  userId: string,
  feature: keyof typeof SUBSCRIPTION_PLANS.free.limits
): Promise<{ allowed: boolean; error?: string }> {
  const access = await hasFeatureAccess(userId, feature);
  
  if (!access.allowed) {
    return {
      allowed: false,
      error: access.reason || 'Feature not available',
    };
  }
  
  return { allowed: true };
}

/**
 * Middleware helper to check and deduct credits for AI operations
 */
export async function requireAndDeductCredits(
  userId: string,
  amount: number,
  operation: string
): Promise<{ success: boolean; error?: string }> {
  const check = await hasEnoughCredits(userId, amount);
  
  if (!check.allowed) {
    return {
      success: false,
      error: check.reason || 'Insufficient credits',
    };
  }
  
  const deducted = await deductCredits(
    userId,
    amount,
    'ai_operation',
    `${operation} (${amount} credits)`
  );
  
  if (!deducted) {
    return {
      success: false,
      error: 'Failed to deduct credits',
    };
  }
  
  return { success: true };
}
