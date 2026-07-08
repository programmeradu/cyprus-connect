import Stripe from 'stripe';
import { db } from '@/db';
import { user } from '@/db/schema';

const stripe = new Stripe(process.env.STRIPE_TEST_KEY || '', { 
  apiVersion: '2025-11-17.clover',
});

interface CustomerData {
  name: string;
  email: string;
  company: string;
  industry: string;
  teamSize: string;
  plan: 'pro' | 'enterprise';
  signupDaysAgo: number;
}

// Fresh customer data with NEW emails that don't exist in database
const freshCustomers: CustomerData[] = [
  // Pro Plan Customers - $29/month each
  { name: 'Rachel Morgan', email: 'rachel.morgan@brightwave.io', company: 'BrightWave Marketing', industry: 'professional_services', teamSize: 'small', plan: 'pro', signupDaysAgo: 180 },
  { name: 'Kevin Zhang', email: 'kevin@cloudtech-innovations.com', company: 'CloudTech Innovations', industry: 'technology', teamSize: 'small', plan: 'pro', signupDaysAgo: 165 },
  { name: 'Laura Sanchez', email: 'laura.s@organicbites.co', company: 'Organic Bites Cafe', industry: 'hospitality', teamSize: 'small', plan: 'pro', signupDaysAgo: 150 },
  { name: 'Ahmed Hassan', email: 'ahmed@modernbuilders.ae', company: 'Modern Builders LLC', industry: 'construction', teamSize: 'small', plan: 'pro', signupDaysAgo: 135 },
  { name: 'Nina Petrov', email: 'nina@futurelearning.edu', company: 'Future Learning Academy', industry: 'education', teamSize: 'small', plan: 'pro', signupDaysAgo: 120 },
  { name: 'Carlos Rivera', email: 'carlos@smartmanufacturing.mx', company: 'Smart Manufacturing Co', industry: 'manufacturing', teamSize: 'small', plan: 'pro', signupDaysAgo: 105 },
  { name: 'Yuki Tanaka', email: 'yuki@wellnessmedical.jp', company: 'Wellness Medical Group', industry: 'healthcare', teamSize: 'small', plan: 'pro', signupDaysAgo: 90 },
  { name: 'Sophie Anderson', email: 'sophie@freshfoods-market.com', company: 'FreshFoods Market', industry: 'retail', teamSize: 'small', plan: 'pro', signupDaysAgo: 75 },
  { name: 'Marcus Williams', email: 'marcus@expresstransport.uk', company: 'Express Transport Ltd', industry: 'transportation', teamSize: 'small', plan: 'pro', signupDaysAgo: 60 },
  { name: 'Elena Rodriguez', email: 'elena@creativestudio-pro.com', company: 'CreativeStudio Pro', industry: 'creative_services', teamSize: 'small', plan: 'pro', signupDaysAgo: 45 },
  { name: 'Daniel Park', email: 'daniel@nextech-systems.kr', company: 'NexTech Systems', industry: 'technology', teamSize: 'small', plan: 'pro', signupDaysAgo: 30 },
  { name: 'Isabella Costa', email: 'isabella@renewenergy.br', company: 'RenewEnergy Solutions', industry: 'energy', teamSize: 'small', plan: 'pro', signupDaysAgo: 15 },
  
  // Enterprise Plan Customers - $99/month each
  { name: 'Richard Taylor', email: 'r.taylor@globalindustries.com', company: 'Global Industries Corp', industry: 'manufacturing', teamSize: 'medium', plan: 'enterprise', signupDaysAgo: 210 },
  { name: 'Catherine Wong', email: 'catherine@techventures-intl.com', company: 'TechVentures International', industry: 'technology', teamSize: 'medium', plan: 'enterprise', signupDaysAgo: 195 },
  { name: 'Michael Brown', email: 'michael@premiumretailgroup.com', company: 'Premium Retail Group', industry: 'retail', teamSize: 'medium', plan: 'enterprise', signupDaysAgo: 180 },
  { name: 'Anna Schmidt', email: 'anna@buildpro-construction.de', company: 'BuildPro Construction', industry: 'construction', teamSize: 'medium', plan: 'enterprise', signupDaysAgo: 165 },
  { name: 'David Johnson', email: 'david@hospitalitypremium.com', company: 'Hospitality Premium Hotels', industry: 'hospitality', teamSize: 'medium', plan: 'enterprise', signupDaysAgo: 150 },
  { name: 'Maria Gonzales', email: 'maria@transportmax.es', company: 'TransportMax Logistics', industry: 'transportation', teamSize: 'medium', plan: 'enterprise', signupDaysAgo: 135 },
  { name: 'Jennifer Lee', email: 'jennifer@medicalcare-systems.com', company: 'MedicalCare Systems', industry: 'healthcare', teamSize: 'medium', plan: 'enterprise', signupDaysAgo: 120 },
  { name: 'Robert Chen', email: 'robert@powerenergy-corp.cn', company: 'PowerEnergy Corporation', industry: 'energy', teamSize: 'medium', plan: 'enterprise', signupDaysAgo: 105 },
  { name: 'Patricia White', email: 'patricia@consultingpro-group.com', company: 'ConsultingPro Group', industry: 'professional_services', teamSize: 'medium', plan: 'enterprise', signupDaysAgo: 90 },
];

async function seedFreshCustomers() {
  console.log('🌱 Starting fresh realistic customer seeding...\n');
  
  let totalMRR = 0;
  let proCount = 0;
  let enterpriseCount = 0;
  const successfulCustomers: string[] = [];
  
  try {
    // Create Stripe products and prices first
    console.log('📦 Creating Stripe products and prices...\n');
    
    const proProduct = await stripe.products.create({
      name: 'Pro Plan',
      description: 'Professional sustainability features',
    });
    
    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      currency: 'usd',
      unit_amount: 2900, // $29.00
      recurring: { interval: 'month' },
    });
    
    const enterpriseProduct = await stripe.products.create({
      name: 'Enterprise Plan',
      description: 'Advanced sustainability features for larger teams',
    });
    
    const enterprisePrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      currency: 'usd',
      unit_amount: 9900, // $99.00
      recurring: { interval: 'month' },
    });
    
    console.log(`   ✓ Pro Plan: ${proProduct.id} / ${proPrice.id}`);
    console.log(`   ✓ Enterprise Plan: ${enterpriseProduct.id} / ${enterprisePrice.id}\n`);
    
    // Create customers
    for (const customerData of freshCustomers) {
      console.log(`📝 Creating: ${customerData.name} - ${customerData.company} (${customerData.plan})`);
      
      try {
        // Create Stripe customer
        const stripeCustomer = await stripe.customers.create({
          name: customerData.name,
          email: customerData.email,
          metadata: {
            company: customerData.company,
            plan: customerData.plan,
          },
        });
        console.log(`   ✓ Stripe customer: ${stripeCustomer.id}`);
        
        // Attach test payment method
        const paymentMethod = await stripe.paymentMethods.create({
          type: 'card',
          card: {
            token: 'tok_visa', // Test token
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
        
        // Create subscription
        const priceId = customerData.plan === 'pro' ? proPrice.id : enterprisePrice.id;
        const subscription = await stripe.subscriptions.create({
          customer: stripeCustomer.id,
          items: [{ price: priceId }],
          payment_settings: {
            payment_method_types: ['card'],
          },
        });
        console.log(`   ✓ Stripe subscription: ${subscription.id}`);
        
        // Calculate signup timestamp
        const now = Date.now();
        const signupTimestamp = Math.floor((now - (customerData.signupDaysAgo * 24 * 60 * 60 * 1000)) / 1000);
        
        // Create user in database
        const userId = `user_${now}_${Math.random().toString(36).substr(2, 9)}`;
        await db.insert(user).values({
          id: userId,
          name: customerData.name,
          email: customerData.email,
          emailVerified: true,
          companyName: customerData.company,
          companyIndustry: customerData.industry,
          teamSize: customerData.teamSize,
          totalCredits: Math.floor(Math.random() * 500) + 100,
          onboardingCompleted: true,
          preferredCurrency: 'USD',
          countryCode: 'US',
          timezone: 'America/New_York',
          createdAt: new Date(signupTimestamp * 1000),
          updatedAt: new Date(now),
        });
        console.log(`   ✓ Database user created: ${userId}\n`);
        
        // Track success
        successfulCustomers.push(`${customerData.name} (${customerData.email})`);
        if (customerData.plan === 'pro') {
          proCount++;
          totalMRR += 29;
        } else {
          enterpriseCount++;
          totalMRR += 99;
        }
        
      } catch (error) {
        console.log(`   ❌ Failed to create ${customerData.name}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
  
  // Print summary
  console.log('\n============================================================');
  console.log('✅ SEEDING COMPLETE!');
  console.log('============================================================\n');
  console.log('📊 Summary:');
  console.log(`   Total Customers: ${successfulCustomers.length}`);
  console.log(`   Pro Plan: ${proCount} × $29`);
  console.log(`   Enterprise Plan: ${enterpriseCount} × $99`);
  console.log(`   Total MRR: $${totalMRR.toFixed(2)}\n`);
  
  if (successfulCustomers.length > 0) {
    console.log('📋 Customer List:');
    console.log('------------------------------------------------------------');
    successfulCustomers.forEach((customer, i) => {
      console.log(`   ${i + 1}. ${customer}`);
    });
    console.log('');
  }
  
  console.log('💡 You can now:');
  console.log('   • View customers in Stripe Dashboard (test mode)');
  console.log('   • Check analytics at /app/analytics');
  console.log('   • See payment history at /app/billing');
  console.log('   • Manage customers in database studio\n');
  console.log('✨ All done!\n');
  
  process.exit(0);
}

seedFreshCustomers();
