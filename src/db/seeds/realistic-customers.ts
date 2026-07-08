/**
 * Realistic Customer & MRR Seeder - October & November 2024
 * Generates ~$1,700 MRR with realistic customer data spread across 2 months
 * 
 * Run with: bun run src/db/seeds/realistic-customers.ts
 */

import { db } from "@/db";
import { user, emissions, dashboardMetrics } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_TEST_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

// Helper to get random date in October or November 2024
function getRandomDateInOctNov(): Date {
  // October 1, 2024 to November 30, 2024
  const startDate = new Date('2024-10-01T00:00:00Z');
  const endDate = new Date('2024-11-30T23:59:59Z');
  const timestamp = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
  return new Date(timestamp);
}

// Helper to get date N days after another date
function daysAfter(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

// Realistic company data for seeding - MIXED PLANS AND LOTS OF GMAIL
const REALISTIC_COMPANIES = [
  {
    name: "Sarah Mitchell",
    email: "sarah.mitchell@gmail.com",
    company: "GreenLeaf Consulting",
    industry: "professional_services",
    plan: "pro",
  },
  {
    name: "Marcus Chen",
    email: "marcus.chen@gmail.com",
    company: "Urban Roots Cafe",
    industry: "hospitality",
    plan: "enterprise",
  },
  {
    name: "Emily Rodriguez",
    email: "emily.rodriguez@gmail.com",
    company: "Bright Future Academy",
    industry: "education",
    plan: "pro",
  },
  {
    name: "David Thompson",
    email: "david@coastalbuilders.com",
    company: "Coastal Builders LLC",
    industry: "construction",
    plan: "enterprise",
  },
  {
    name: "Jessica Park",
    email: "jessica.park@gmail.com",
    company: "TechForward Solutions",
    industry: "technology",
    plan: "pro",
  },
  {
    name: "Michael O'Brien",
    email: "michael.obrien@gmail.com",
    company: "Precision Manufacturing",
    industry: "manufacturing",
    plan: "enterprise",
  },
  {
    name: "Aisha Patel",
    email: "aisha.patel@gmail.com",
    company: "HealthFirst Clinic",
    industry: "healthcare",
    plan: "pro",
  },
  {
    name: "Robert Kim",
    email: "robert.kim@gmail.com",
    company: "Fresh Harvest Market",
    industry: "retail",
    plan: "pro",
  },
  {
    name: "Linda Martinez",
    email: "linda.martinez@gmail.com",
    company: "Swift Logistics",
    industry: "transportation",
    plan: "enterprise",
  },
  {
    name: "James Wilson",
    email: "james.wilson@gmail.com",
    company: "Innovate Design Studio",
    industry: "creative_services",
    plan: "pro",
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@gmail.com",
    company: "TechStartup Inc",
    industry: "technology",
    plan: "enterprise",
  },
  {
    name: "Thomas Anderson",
    email: "thomas.anderson@gmail.com",
    company: "GreenEnergy Solutions",
    industry: "energy",
    plan: "pro",
  },
  {
    name: "Rachel Foster",
    email: "rachel.foster@gmail.com",
    company: "Sustainable Design Co",
    industry: "creative_services",
    plan: "pro",
  },
  {
    name: "Victoria Sterling",
    email: "victoria.sterling@gmail.com",
    company: "Global Manufacturing Corp",
    industry: "manufacturing",
    plan: "enterprise",
  },
  {
    name: "Alexander Ross",
    email: "alex.ross@gmail.com",
    company: "Innovative Solutions Inc",
    industry: "technology",
    plan: "pro",
  },
  {
    name: "Olivia Bennett",
    email: "olivia.bennett@gmail.com",
    company: "Premium Retail Group",
    industry: "retail",
    plan: "enterprise",
  },
  {
    name: "Nathan Foster",
    email: "nathan.foster@gmail.com",
    company: "ConstructionPro International",
    industry: "construction",
    plan: "pro",
  },
  {
    name: "Sophia Williams",
    email: "sophia.williams@gmail.com",
    company: "Hospitality Excellence",
    industry: "hospitality",
    plan: "enterprise",
  },
  {
    name: "Daniel Chang",
    email: "d.chang@advancedlogistics.net",
    company: "Advanced Logistics Network",
    industry: "transportation",
    plan: "pro",
  },
  {
    name: "Isabella Martinez",
    email: "isabella.martinez@gmail.com",
    company: "Healthcare Pro Systems",
    industry: "healthcare",
    plan: "enterprise",
  },
  {
    name: "Christopher Lee",
    email: "christopher.lee@gmail.com",
    company: "Energy Innovations Ltd",
    industry: "energy",
    plan: "pro",
  },
  {
    name: "Emma Thompson",
    email: "emma.thompson@gmail.com",
    company: "Consulting Experts Group",
    industry: "professional_services",
    plan: "enterprise",
  },
  {
    name: "Ryan Murphy",
    email: "ryan.murphy@gmail.com",
    company: "Tech Innovators LLC",
    industry: "technology",
    plan: "pro",
  },
  {
    name: "Maya Johnson",
    email: "maya.johnson@gmail.com",
    company: "Eco-Friendly Retail",
    industry: "retail",
    plan: "enterprise",
  },
  {
    name: "Kevin Zhang",
    email: "kevin.zhang@gmail.com",
    company: "Modern Manufacturing Group",
    industry: "manufacturing",
    plan: "pro",
  },
  {
    name: "Amanda Brooks",
    email: "amanda.brooks@gmail.com",
    company: "Premium Hospitality Services",
    industry: "hospitality",
    plan: "enterprise",
  },
];

// Plan configuration
const PLAN_CONFIG = {
  pro: {
    productId: "pro",
    amount: 2900, // $29.00 in cents
  },
  enterprise: {
    productId: "enterprise",
    amount: 9900, // $99.00 in cents
  },
};

// Helper to generate realistic emissions data
function generateRealisticEmissions(industry: string, plan: string) {
  const baseEmissions: Record<string, number> = {
    manufacturing: 850,
    construction: 720,
    transportation: 680,
    energy: 950,
    retail: 320,
    hospitality: 410,
    healthcare: 530,
    technology: 280,
    professional_services: 190,
    education: 240,
    creative_services: 150,
  };

  const base = baseEmissions[industry] || 400;
  const multiplier = plan === "enterprise" ? 1.8 : 1.0;
  const variation = base * 0.2; // ±20% variation
  return Math.round((base + (Math.random() - 0.5) * variation * 2) * multiplier);
}

async function seedRealisticCustomers() {
  console.log("🌱 Starting realistic customer seeding (October & November 2024)...\n");
  console.log("🧹 First, cleaning up existing data...\n");

  // Delete existing data
  try {
    await db.delete(dashboardMetrics);
    await db.delete(emissions);
    await db.delete(user);
    console.log("   ✓ Existing database records cleaned\n");
  } catch (error) {
    console.error("   ⚠️  Error cleaning database:", error);
  }

  // Create Stripe products and prices
  console.log("📦 Creating Stripe products and prices...\n");
  
  const proProduct = await stripe.products.create({
    name: "Pro Plan",
    description: "VerdeIQ Pro Subscription",
  });
  
  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 2900,
    currency: "usd",
    recurring: { interval: "month" },
  });
  
  const enterpriseProduct = await stripe.products.create({
    name: "Enterprise Plan",
    description: "VerdeIQ Enterprise Subscription",
  });
  
  const enterprisePrice = await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 9900,
    currency: "usd",
    recurring: { interval: "month" },
  });
  
  console.log(`   ✓ Pro Plan: ${proProduct.id} / ${proPrice.id}`);
  console.log(`   ✓ Enterprise Plan: ${enterpriseProduct.id} / ${enterprisePrice.id}\n`);
  
  const PRICE_IDS = {
    pro: proPrice.id,
    enterprise: enterprisePrice.id,
  };

  let totalMRR = 0;
  const createdCustomers = [];

  for (const company of REALISTIC_COMPANIES) {
    try {
      // Random signup date in Oct-Nov (for database only)
      const signupDate = getRandomDateInOctNov();
      
      console.log(`📝 Creating: ${company.name} - ${company.company} (${company.plan})`);
      console.log(`   📅 Database Signup Date: ${signupDate.toLocaleDateString()}`);

      // 1. Create Stripe customer (with current date)
      const stripeCustomer = await stripe.customers.create({
        name: company.name,
        email: company.email,
        metadata: {
          company: company.company,
          industry: company.industry,
          source: "verdeiq_platform",
          actual_signup_date: signupDate.toISOString(),
        },
      });

      console.log(`   ✓ Stripe customer: ${stripeCustomer.id}`);

      // 2. Add test payment method
      const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: {
          token: "tok_visa",
        },
      });

      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: stripeCustomer.id,
      });

      await stripe.customers.update(stripeCustomer.id, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });

      console.log(`   ✓ Test payment method attached`);

      // 3. Create Stripe subscription (with current date - no backdating)
      const planConfig = PLAN_CONFIG[company.plan as keyof typeof PLAN_CONFIG];
      
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [
          {
            price: PRICE_IDS[company.plan as keyof typeof PRICE_IDS],
          },
        ],
        metadata: {
          plan: company.plan,
          company: company.company,
          actual_signup_date: signupDate.toISOString(),
        },
      });

      console.log(`   ✓ Stripe subscription: ${subscription.id}`);

      // 4. Create user in database (backdated to Oct/Nov)
      const [newUser] = await db
        .insert(user)
        .values({
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: company.email,
          name: company.name,
          emailVerified: true,
          companyName: company.company,
          companyIndustry: company.industry,
          teamSize: company.plan === "enterprise" ? "medium" : "small",
          onboardingCompleted: true,
          totalCredits: Math.floor(Math.random() * 500) + 100,
          preferredCurrency: "USD",
          countryCode: "US",
          timezone: "America/New_York",
          createdAt: signupDate,
          updatedAt: new Date(),
        })
        .returning();

      console.log(`   ✓ Database user: ${newUser.id}`);

      // 5. Create emissions data for October and November
      const carbonFootprint = generateRealisticEmissions(company.industry, company.plan);
      
      // October emissions (if signed up in October)
      if (signupDate.getMonth() === 9) { // October is month 9 (0-indexed)
        await db.insert(emissions).values({
          userId: newUser.id,
          electricity: carbonFootprint * 0.6,
          gas: carbonFootprint * 0.2,
          water: carbonFootprint * 0.05,
          waste: carbonFootprint * 0.1,
          transport: carbonFootprint * 0.05,
          totalCo2e: carbonFootprint,
          periodMonth: 10,
          periodYear: 2024,
          createdAt: signupDate.toISOString(),
        });
        console.log(`   ✓ October emissions: ${carbonFootprint} tCO2e`);
      }

      // November emissions (for everyone)
      const novCarbonFootprint = Math.round(carbonFootprint * (0.85 + Math.random() * 0.3)); // Some variation
      await db.insert(emissions).values({
        userId: newUser.id,
        electricity: novCarbonFootprint * 0.6,
        gas: novCarbonFootprint * 0.2,
        water: novCarbonFootprint * 0.05,
        waste: novCarbonFootprint * 0.1,
        transport: novCarbonFootprint * 0.05,
        totalCo2e: novCarbonFootprint,
        periodMonth: 11,
        periodYear: 2024,
        createdAt: daysAfter(signupDate, 15).toISOString(),
      });
      console.log(`   ✓ November emissions: ${novCarbonFootprint} tCO2e`);

      // 6. Create dashboard metrics
      const now = new Date().toISOString();
      const thirtyDaysAgo = daysAfter(signupDate, -30).toISOString();

      await db.insert(dashboardMetrics).values({
        userId: newUser.id,
        metricType: "carbon_footprint",
        currentValue: novCarbonFootprint,
        previousValue: carbonFootprint,
        trendPercentage: ((novCarbonFootprint - carbonFootprint) / carbonFootprint) * 100,
        periodStart: thirtyDaysAgo,
        periodEnd: now,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(dashboardMetrics).values({
        userId: newUser.id,
        metricType: "resource_efficiency",
        currentValue: Math.round(60 + Math.random() * 30),
        previousValue: Math.round(55 + Math.random() * 25),
        trendPercentage: 8.5,
        periodStart: thirtyDaysAgo,
        periodEnd: now,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(dashboardMetrics).values({
        userId: newUser.id,
        metricType: "renewable_share",
        currentValue: Math.round(20 + Math.random() * 40),
        previousValue: Math.round(15 + Math.random() * 35),
        trendPercentage: 12.3,
        periodStart: thirtyDaysAgo,
        periodEnd: now,
        createdAt: now,
        updatedAt: now,
      });

      console.log(`   ✓ Dashboard metrics created`);

      const mrr = planConfig.amount / 100;
      totalMRR += mrr;

      createdCustomers.push({
        name: company.name,
        company: company.company,
        plan: company.plan,
        mrr: `$${mrr}`,
        signupDate: signupDate.toLocaleDateString(),
        stripeId: stripeCustomer.id,
      });

      console.log(`   💰 MRR contribution: $${mrr}\n`);
    } catch (error) {
      console.error(`   ❌ Failed to create ${company.name}:`, error);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ SEEDING COMPLETE!");
  console.log("=".repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Period: October 1 - November 30, 2024 (Database)`);
  console.log(`   Total Customers: ${createdCustomers.length}`);
  console.log(`   Pro Plan ($29/mo): ${createdCustomers.filter((c) => c.plan === "pro").length}`);
  console.log(`   Enterprise Plan ($99/mo): ${createdCustomers.filter((c) => c.plan === "enterprise").length}`);
  console.log(`   Gmail Addresses: ${createdCustomers.filter((c) => c.name.includes('@gmail')).length}/${createdCustomers.length}`);
  console.log(`   Total MRR: $${totalMRR.toFixed(2)}`);
  console.log("\n📋 Customer List (chronological):");
  console.log("-".repeat(80));
  
  // Sort by signup date
  createdCustomers.sort((a, b) => new Date(a.signupDate).getTime() - new Date(b.signupDate).getTime());
  
  createdCustomers.forEach((customer, i) => {
    console.log(`${(i + 1).toString().padStart(2)}. ${customer.signupDate.padEnd(12)} | ${customer.name.padEnd(22)} | ${customer.plan.padEnd(10)} | ${customer.mrr}`);
  });

  console.log("\n💡 Next steps:");
  console.log("   • Database records backdated to Oct-Nov 2024");
  console.log("   • Stripe subscriptions active today (can't backdate)");
  console.log("   • View analytics at /app/analytics");
  console.log("   • Check database through studio tab");
}

// Run the seeder
seedRealisticCustomers()
  .then(() => {
    console.log("\n✨ All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  });
