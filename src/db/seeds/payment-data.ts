import { db } from '@/db';
import { user, subscriptions, paymentHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Generate random Stripe IDs
function generateStripeId(prefix: string, length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix + '_';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate random date in past N days
function randomDateInPast(days: number): Date {
  const now = new Date();
  const past = new Date(now.getTime() - (Math.random() * days * 24 * 60 * 60 * 1000));
  return past;
}

const customers = [
  { name: 'Sarah Chen', email: 'sarah@greentech-solutions.com', company: 'GreenTech Solutions', plan: 'enterprise', amount: 299 },
  { name: 'Michael Rodriguez', email: 'michael@ecoware-mfg.com', company: 'EcoWare Manufacturing', plan: 'enterprise', amount: 299 },
  { name: 'Emma Thompson', email: 'emma@sustainable-retail.com', company: 'Sustainable Retail Co', plan: 'enterprise', amount: 299 },
  { name: 'James Wilson', email: 'james@cleanenergy-consulting.com', company: 'CleanEnergy Consulting', plan: 'pro', amount: 99 },
  { name: 'Olivia Martinez', email: 'olivia@urbanfarms.com', company: 'Urban Farms LLC', plan: 'pro', amount: 99 },
  { name: 'Liam Anderson', email: 'liam@healthfirst-medical.com', company: 'HealthFirst Medical', plan: 'pro', amount: 99 },
  { name: 'Sophia Taylor', email: 'sophia@edugreen-academy.com', company: 'EduGreen Academy', plan: 'pro', amount: 99 },
  { name: 'Noah Brown', email: 'noah@buildgreen-construction.com', company: 'BuildGreen Construction', plan: 'pro', amount: 99 },
  { name: 'Isabella Garcia', email: 'isabella@freshfood-logistics.com', company: 'FreshFood Logistics', plan: 'starter', amount: 29 },
  { name: 'Ethan Davis', email: 'ethan@techrecycle-corp.com', company: 'TechRecycle Corp', plan: 'starter', amount: 29 },
  { name: 'Ava Johnson', email: 'ava@greentransport.com', company: 'Green Transport Ltd', plan: 'starter', amount: 29 },
  { name: 'Mason Lee', email: 'mason@ecopackaging.com', company: 'EcoPackaging Inc', plan: 'starter', amount: 29 },
  { name: 'Charlotte White', email: 'charlotte@sustainable-coffee.com', company: 'Sustainable Coffee Co', plan: 'starter', amount: 29 },
  { name: 'Lucas Harris', email: 'lucas@greendesign-studio.com', company: 'GreenDesign Studio', plan: 'starter', amount: 29 },
  { name: 'Amelia Clark', email: 'amelia@ecotextiles.com', company: 'EcoTextiles Ltd', plan: 'starter', amount: 29 },
  { name: 'Benjamin Lewis', email: 'benjamin@cleanhome-services.com', company: 'CleanHome Services', plan: 'starter', amount: 29 },
  { name: 'Mia Walker', email: 'mia@renewable-tech.com', company: 'Renewable Tech Solutions', plan: 'starter', amount: 29 },
];

async function seedPaymentData() {
  console.log('🌱 Seeding realistic payment data...\n');

  let totalMRR = 0;
  const planCounts = { enterprise: 0, pro: 0, starter: 0 };
  const statusDistribution = ['active', 'active', 'active', 'active', 'active', 'active', 'active', 'active', 'trialing', 'past_due'];

  for (const customer of customers) {
    try {
      // Create user
      const [newUser] = await db.insert(user).values({
        id: generateStripeId('usr', 16),
        email: customer.email,
        name: customer.name,
        emailVerified: true,
        createdAt: randomDateInPast(180),
        updatedAt: new Date(),
      }).returning();

      // Generate Stripe IDs
      const stripeCustomerId = generateStripeId('cus', 14);
      const stripeSubscriptionId = generateStripeId('sub', 14);
      const stripePaymentId = generateStripeId('pi', 24);

      // Random status
      const status = statusDistribution[Math.floor(Math.random() * statusDistribution.length)];
      
      // Subscription dates
      const createdAt = randomDateInPast(180); // 0-6 months ago
      const currentPeriodStart = new Date(createdAt);
      const currentPeriodEnd = new Date(createdAt.getTime() + (30 * 24 * 60 * 60 * 1000)); // +30 days

      // Create subscription
      await db.insert(subscriptions).values({
        userId: newUser.id,
        stripeCustomerId,
        stripeSubscriptionId,
        planId: customer.plan,
        status,
        currentPeriodStart: currentPeriodStart.toISOString(),
        currentPeriodEnd: currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: false,
        createdAt: createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Create initial payment
      await db.insert(paymentHistory).values({
        userId: newUser.id,
        stripePaymentId,
        amount: customer.amount * 100, // cents
        currency: 'usd',
        status: status === 'past_due' ? 'failed' : 'succeeded',
        paymentType: 'subscription',
        description: `${customer.plan.charAt(0).toUpperCase() + customer.plan.slice(1)} Plan - ${customer.company}`,
        metadata: JSON.stringify({ company: customer.company, plan: customer.plan }),
        createdAt: createdAt.toISOString(),
      });

      // Add renewal payments for older subscriptions
      const daysSinceCreation = (Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceCreation > 30) {
        const renewals = Math.floor(daysSinceCreation / 30);
        for (let i = 1; i <= Math.min(renewals, 5); i++) {
          const renewalDate = new Date(createdAt.getTime() + (i * 30 * 24 * 60 * 60 * 1000));
          await db.insert(paymentHistory).values({
            userId: newUser.id,
            stripePaymentId: generateStripeId('pi', 24),
            amount: customer.amount * 100,
            currency: 'usd',
            status: 'succeeded',
            paymentType: 'subscription',
            description: `${customer.plan.charAt(0).toUpperCase() + customer.plan.slice(1)} Plan Renewal - ${customer.company}`,
            metadata: JSON.stringify({ company: customer.company, plan: customer.plan, renewal: i }),
            createdAt: renewalDate.toISOString(),
          });
        }
      }

      totalMRR += customer.amount;
      planCounts[customer.plan as keyof typeof planCounts]++;

      console.log(`✅ ${customer.company} (${customer.plan}) - $${customer.amount}/mo - ${status}`);
    } catch (error) {
      console.error(`❌ Failed to create ${customer.company}:`, error);
    }
  }

  console.log('\n📊 SUMMARY:');
  console.log('─────────────────────────────────────');
  console.log(`Total Customers: ${customers.length}`);
  console.log(`Total MRR: $${totalMRR.toLocaleString()}`);
  console.log(`\nBy Plan:`);
  console.log(`  Enterprise ($299/mo): ${planCounts.enterprise} = $${planCounts.enterprise * 299}`);
  console.log(`  Pro ($99/mo): ${planCounts.pro} = $${planCounts.pro * 99}`);
  console.log(`  Starter ($29/mo): ${planCounts.starter} = $${planCounts.starter * 29}`);
  console.log('─────────────────────────────────────\n');
}

seedPaymentData()
  .then(() => {
    console.log('✨ Payment data seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding payment data:', error);
    process.exit(1);
  });
