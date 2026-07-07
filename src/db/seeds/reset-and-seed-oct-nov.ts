import { db } from "@/db";
import { 
  user as userTable, 
  paymentHistory, 
  subscriptions,
  session,
  emissions,
  userProgress
} from "@/db/schema";
import { sql } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

// Helper to generate random date between Oct 1 and Nov 30, 2024
function randomDateInRange(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  
  const date = new Date(randomTime);
  // Favor weekdays over weekends
  const dayOfWeek = date.getDay();
  if ((dayOfWeek === 0 || dayOfWeek === 6) && Math.random() > 0.3) {
    // 70% chance to skip weekends
    return randomDateInRange(start, end);
  }
  return date;
}

// Helper to add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Email providers with weights
const emailProviders = [
  { domain: '@gmail.com', weight: 50 },
  { domain: '@outlook.com', weight: 10 },
  { domain: '@hotmail.com', weight: 10 },
  { domain: '@yahoo.com', weight: 15 },
  { domain: '@company.com', weight: 3 },
  { domain: '@business.co', weight: 3 },
  { domain: '@tech.io', weight: 2 },
  { domain: '@startup.dev', weight: 2 },
  { domain: '@protonmail.com', weight: 3 },
  { domain: '@icloud.com', weight: 2 },
];

function getRandomEmail(firstName: string, lastName: string): string {
  const total = emailProviders.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * total;
  
  for (const provider of emailProviders) {
    random -= provider.weight;
    if (random <= 0) {
      const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.random() > 0.5 ? Math.floor(Math.random() * 99) : ''}`;
      return username + provider.domain;
    }
  }
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`;
}

// Plan distribution
const plans = [
  { id: 'free', name: 'Free', weight: 40, price: 0 },
  { id: 'starter', name: 'Starter', weight: 25, price: 29 },
  { id: 'pro', name: 'Pro', weight: 25, price: 79 },
  { id: 'enterprise', name: 'Enterprise', weight: 10, price: 199 },
];

function getRandomPlan() {
  const total = plans.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * total;
  
  for (const plan of plans) {
    random -= plan.weight;
    if (random <= 0) {
      return plan;
    }
  }
  return plans[0];
}

// Sample names
const firstNames = [
  'James', 'Emma', 'Michael', 'Sophia', 'David', 'Olivia', 'Robert', 'Ava',
  'William', 'Isabella', 'Richard', 'Mia', 'Joseph', 'Charlotte', 'Thomas', 'Amelia',
  'Daniel', 'Harper', 'Matthew', 'Evelyn', 'Christopher', 'Abigail', 'Andrew', 'Emily',
  'Joshua', 'Elizabeth', 'Ryan', 'Sofia', 'Nicholas', 'Avery', 'Alexander', 'Ella',
  'Jonathan', 'Scarlett', 'Benjamin', 'Grace', 'Samuel', 'Chloe', 'Gabriel', 'Victoria',
  'Nathan', 'Madison', 'Caleb', 'Luna', 'Tyler', 'Penelope', 'Aaron', 'Layla',
  'Kyle', 'Riley', 'Dylan', 'Zoey', 'Brandon', 'Nora', 'Jordan', 'Lily',
  'Kevin', 'Hannah', 'Eric', 'Addison', 'Brian', 'Eleanor', 'Adam', 'Natalie',
  'Jason', 'Lucy', 'Peter', 'Audrey', 'Jacob', 'Bella', 'Henry', 'Claire'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
  'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen',
  'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
  'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter',
  'Roberts', 'Turner', 'Phillips', 'Evans', 'Parker', 'Collins', 'Edwards', 'Stewart',
  'Morris', 'Murphy', 'Cook', 'Rogers', 'Morgan', 'Peterson', 'Cooper', 'Reed'
];

const companies = [
  'TechFlow', 'GreenLeaf Solutions', 'EcoVenture', 'SustainCo', 'CleanTech Industries',
  'RenewEnergy', 'BioCycle', 'EarthFirst', 'NatureWorks', 'PureAir Systems',
  'CarbonZero', 'EcoSmart', 'GreenHorizon', 'SolarWave', 'WindPower Pro',
  'RecycleTech', 'CleanWater Solutions', 'BioFuture', 'GreenGrid', 'EcoLogic',
  'SustainTech', 'NatureCraft', 'PlanetGuard', 'EcoStream', 'GreenPath',
  'CleanEdge', 'BioPower', 'EarthSafe', 'RenewTech', 'EcoWise',
  'GreenMotion', 'PureTech', 'SustainWorks', 'NatureBridge', 'EcoCore',
  'CleanFuture', 'BioSphere', 'GreenVista', 'EarthTech', 'RenewWorks'
];

const industries = [
  'manufacturing', 'technology', 'retail', 'healthcare', 'finance',
  'hospitality', 'transportation', 'construction', 'agriculture', 'education'
];

const companySizes = ['1-10', '11-50', '51-200', '201-500', '500+'];

const timezones = [
  'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/Denver',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
  'Asia/Shanghai', 'Australia/Sydney', 'America/Toronto', 'Asia/Singapore'
];

const currencies = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD'];

async function resetAndSeed() {
  console.log('🧹 Cleaning existing data...');
  
  // Delete in correct order (respecting foreign keys)
  await db.delete(userProgress);
  await db.delete(emissions);
  await db.delete(session);
  await db.delete(subscriptions);
  await db.delete(paymentHistory);
  await db.delete(userTable);
  
  console.log('✅ All tables cleaned');
  
  // Date range: October 1 - November 30, 2024
  const startDate = new Date('2024-10-01T00:00:00Z');
  const endDate = new Date('2024-11-30T23:59:59Z');
  
  const numUsers = 85; // Create 85 users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  console.log(`👥 Creating ${numUsers} users spread across Oct-Nov 2024...`);
  
  let freeCount = 0;
  let starterCount = 0;
  let proCount = 0;
  let enterpriseCount = 0;
  let paymentCount = 0;
  let subscriptionCount = 0;
  
  const emailCounts: Record<string, number> = {};
  
  for (let i = 0; i < numUsers; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = getRandomEmail(firstName, lastName);
    const createdAt = randomDateInRange(startDate, endDate);
    const plan = getRandomPlan();
    
    // Track email provider
    const domain = email.substring(email.indexOf('@'));
    emailCounts[domain] = (emailCounts[domain] || 0) + 1;
    
    // Track plan counts
    if (plan.id === 'free') freeCount++;
    else if (plan.id === 'starter') starterCount++;
    else if (plan.id === 'pro') proCount++;
    else if (plan.id === 'enterprise') enterpriseCount++;
    
    // Create user
    const [newUser] = await db.insert(userTable).values({
      id: `user_${Date.now()}_${i}`,
      email,
      name: `${firstName} ${lastName}`,
      emailVerified: true,
      onboardingCompleted: true,
      companyName: companies[Math.floor(Math.random() * companies.length)],
      companyIndustry: industries[Math.floor(Math.random() * industries.length)],
      teamSize: companySizes[Math.floor(Math.random() * companySizes.length)],
      timezone: timezones[Math.floor(Math.random() * timezones.length)],
      preferredCurrency: currencies[Math.floor(Math.random() * currencies.length)],
      createdAt,
      updatedAt: createdAt,
    }).returning();
    
    // Create Stripe data for paid plans only
    if (plan.id !== 'free') {
      const stripeCustomerId = `cus_${Math.random().toString(36).substring(2, 15)}`;
      const stripeSubscriptionId = `sub_${Math.random().toString(36).substring(2, 15)}`;
      
      // Create 1-3 payment records
      const numPayments = Math.floor(Math.random() * 3) + 1;
      for (let p = 0; p < numPayments; p++) {
        const paymentDate = addDays(createdAt, Math.floor(Math.random() * 7) + 1 + (p * 30));
        
        await db.insert(paymentHistory).values({
          userId: newUser.id,
          stripePaymentId: `pi_${Math.random().toString(36).substring(2, 15)}`,
          amount: plan.price * 100,
          currency: newUser.preferredCurrency?.toLowerCase() || 'usd',
          status: 'succeeded',
          paymentType: 'subscription',
          description: `${plan.name} Plan - Monthly Subscription`,
          metadata: JSON.stringify({ planId: plan.id }),
          createdAt: paymentDate.toISOString(),
        });
        
        paymentCount++;
      }
      
      // Create active subscription
      const subscriptionStart = createdAt;
      const subscriptionEnd = addDays(subscriptionStart, 30);
      
      await db.insert(subscriptions).values({
        userId: newUser.id,
        stripeSubscriptionId,
        stripeCustomerId,
        planId: plan.id,
        status: 'active',
        currentPeriodStart: subscriptionStart.toISOString(),
        currentPeriodEnd: subscriptionEnd.toISOString(),
        cancelAtPeriodEnd: false,
        createdAt: subscriptionStart.toISOString(),
        updatedAt: subscriptionStart.toISOString(),
      });
      
      subscriptionCount++;
    }
    
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Created ${i + 1}/${numUsers} users...`);
    }
  }
  
  console.log('\n📊 Seed Summary:');
  console.log('================');
  console.log(`Total Users: ${numUsers}`);
  console.log(`\nPlan Distribution:`);
  console.log(`  Free: ${freeCount} (${((freeCount/numUsers)*100).toFixed(1)}%)`);
  console.log(`  Starter: ${starterCount} (${((starterCount/numUsers)*100).toFixed(1)}%)`);
  console.log(`  Pro: ${proCount} (${((proCount/numUsers)*100).toFixed(1)}%)`);
  console.log(`  Enterprise: ${enterpriseCount} (${((enterpriseCount/numUsers)*100).toFixed(1)}%)`);
  console.log(`\nEmail Providers:`);
  Object.entries(emailCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count} (${((count/numUsers)*100).toFixed(1)}%)`);
    });
  console.log(`\nStripe Data:`);
  console.log(`  Payment Records: ${paymentCount}`);
  console.log(`  Active Subscriptions: ${subscriptionCount}`);
  console.log(`\n✨ Seed complete! Data spread across Oct 1 - Nov 30, 2024`);
}

resetAndSeed()
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });