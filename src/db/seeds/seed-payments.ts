import { db } from '../index';
import { user, paymentHistory, subscriptions } from '../schema';

// Seed payment history and subscriptions
async function seedPayments() {
  console.log('💳 Creating payment history and subscriptions...');
  
  // Get all users
  const users = await db.select().from(user);
  
  if (users.length === 0) {
    console.log('⚠️ No users found. Run cleanup-and-reseed first.');
    return;
  }
  
  // Select ~40% of users for paid plans
  const paidUserCount = Math.floor(users.length * 0.4);
  const paidUsers = users.slice(0, paidUserCount);
  
  const plans = ['pro', 'enterprise'] as const;
  const planPrices = { pro: 29, enterprise: 99 } satisfies Record<(typeof plans)[number], number>;
  
  // Create subscriptions and payment history for paid users
  for (const paidUser of paidUsers) {
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const userCreatedAt = new Date(paidUser.createdAt);
    
    // Subscription started 1-5 days after user creation
    const subStartDate = new Date(userCreatedAt);
    subStartDate.setDate(subStartDate.getDate() + Math.floor(Math.random() * 5) + 1);
    
    // Current period is monthly
    const currentPeriodEnd = new Date(subStartDate);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    
    // Create subscription
    await db.insert(subscriptions).values({
      userId: paidUser.id,
      stripeCustomerId: `cus_${Math.random().toString(36).substring(7)}`,
      stripeSubscriptionId: `sub_${Math.random().toString(36).substring(7)}`,
      planId: plan,
      status: Math.random() > 0.9 ? 'past_due' : 'active',
      currentPeriodStart: subStartDate.toISOString(),
      currentPeriodEnd: currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      trialEnd: Math.random() > 0.7 ? new Date(subStartDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() : null,
      createdAt: subStartDate.toISOString(),
      updatedAt: subStartDate.toISOString(),
    });
    
    // Create initial payment
    await db.insert(paymentHistory).values({
      userId: paidUser.id,
      stripePaymentId: `pi_${Math.random().toString(36).substring(7)}`,
      amount: planPrices[plan] * 100,
      currency: 'usd',
      status: 'succeeded',
      paymentType: 'subscription',
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - Monthly`,
      createdAt: subStartDate.toISOString(),
    });
  }
  
  // Create additional one-time payments spread across Oct-Nov
  const totalPayments = 45;
  const paymentsCreated = paidUsers.length;
  const additionalPayments = totalPayments - paymentsCreated;
  
  const startDate = new Date('2024-10-01T00:00:00Z');
  const endDate = new Date('2024-11-28T23:59:59Z');
  const dateRange = endDate.getTime() - startDate.getTime();
  
  for (let i = 0; i < additionalPayments; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomDate = new Date(startDate.getTime() + Math.random() * dateRange);
    
    const paymentTypes = ['subscription', 'credits', 'one_time'] as const;
    const paymentType = paymentTypes[Math.floor(Math.random() * paymentTypes.length)];
    const amounts = [2900, 4900, 9900, 19900, 29900];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    
    const descriptions: Record<(typeof paymentTypes)[number], string> = {
      subscription: 'Monthly Subscription Payment',
      credits: 'Credit Pack Purchase',
      one_time: 'Carbon Offset Purchase',
    };
    
    await db.insert(paymentHistory).values({
      userId: randomUser.id,
      stripePaymentId: `pi_${Math.random().toString(36).substring(7)}${i}`,
      amount,
      currency: 'usd',
      status: 'succeeded',
      paymentType,
      description: descriptions[paymentType],
      metadata: JSON.stringify({ source: 'seed' }),
      createdAt: randomDate.toISOString(),
    });
  }
  
  console.log(`✅ Created ${paidUsers.length} subscriptions and ${totalPayments} payment records`);
}

// Run the seed
async function main() {
  try {
    await seedPayments();
    console.log('🎉 Payment seeding complete!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main();
