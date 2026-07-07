import Stripe from 'stripe';

const STRIPE_API_VERSION = '2025-12-15.clover' as const;

const stripe = new Stripe(process.env.STRIPE_TEST_KEY || '', {
  apiVersion: STRIPE_API_VERSION,
});

async function cleanup() {
  console.log('🧹 Cleaning up all Stripe test data...\n');
  
  try {
    // Delete all subscriptions first
    console.log('📋 Fetching subscriptions...');
    const subscriptions = await stripe.subscriptions.list({ limit: 100 });
    console.log(`   Found ${subscriptions.data.length} subscriptions\n`);
    
    for (const sub of subscriptions.data) {
      console.log(`   ❌ Deleting subscription: ${sub.id}`);
      await stripe.subscriptions.cancel(sub.id);
    }
    
    // Delete all customers
    console.log('\n👥 Fetching customers...');
    const customers = await stripe.customers.list({ limit: 100 });
    console.log(`   Found ${customers.data.length} customers\n`);
    
    for (const customer of customers.data) {
      console.log(`   ❌ Deleting customer: ${customer.id} (${customer.email})`);
      await stripe.customers.del(customer.id);
    }
    
    console.log('\n✅ Cleanup complete!\n');
    console.log('💡 All test subscriptions and customers have been removed from Stripe.');
    console.log('   You can now run a fresh seeder with new data.\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

cleanup();
