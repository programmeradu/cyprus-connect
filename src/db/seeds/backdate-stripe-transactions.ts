import { db } from "@/db";
import { 
  paymentHistory, 
  creditPurchases, 
  offsetPurchases, 
  subscriptions,
  user
} from "@/db/schema";
import { eq } from "drizzle-orm";

async function backdateStripeTransactions() {
  console.log("🕐 Starting Stripe transaction backdating...\n");

  try {
    // Get all users ordered by creation
    const users = await db.select().from(user).orderBy(user.createdAt);
    
    if (users.length === 0) {
      console.log("❌ No users found");
      return;
    }

    console.log(`📊 Found ${users.length} users`);

    // Backdate payment history
    const payments = await db.select().from(paymentHistory);
    console.log(`💳 Processing ${payments.length} payment history records...`);
    
    for (const payment of payments) {
      // Find the user for this payment
      const paymentUser = users.find(u => u.id === payment.userId);
      if (!paymentUser) continue;

      // Set payment date to 1-7 days after user creation
      const userCreatedAt = new Date(paymentUser.createdAt);
      const daysAfterSignup = Math.floor(Math.random() * 7) + 1;
      const paymentDate = new Date(userCreatedAt);
      paymentDate.setDate(paymentDate.getDate() + daysAfterSignup);

      await db
        .update(paymentHistory)
        .set({ createdAt: paymentDate.toISOString() })
        .where(eq(paymentHistory.id, payment.id));
    }
    console.log(`✅ Updated ${payments.length} payment history records\n`);

    // Backdate credit purchases
    const credits = await db.select().from(creditPurchases);
    console.log(`🪙 Processing ${credits.length} credit purchase records...`);
    
    for (const credit of credits) {
      const creditUser = users.find(u => u.id === credit.userId);
      if (!creditUser) continue;

      // Set credit purchase date to 1-10 days after user creation
      const userCreatedAt = new Date(creditUser.createdAt);
      const daysAfterSignup = Math.floor(Math.random() * 10) + 1;
      const creditDate = new Date(userCreatedAt);
      creditDate.setDate(creditDate.getDate() + daysAfterSignup);

      await db
        .update(creditPurchases)
        .set({ createdAt: creditDate.toISOString() })
        .where(eq(creditPurchases.id, credit.id));
    }
    console.log(`✅ Updated ${credits.length} credit purchase records\n`);

    // Backdate offset purchases
    const offsets = await db.select().from(offsetPurchases);
    console.log(`🌳 Processing ${offsets.length} offset purchase records...`);
    
    for (const offset of offsets) {
      const offsetUser = users.find(u => u.id === offset.userId);
      if (!offsetUser) continue;

      // Set offset purchase date to 1-14 days after user creation
      const userCreatedAt = new Date(offsetUser.createdAt);
      const daysAfterSignup = Math.floor(Math.random() * 14) + 1;
      const offsetDate = new Date(userCreatedAt);
      offsetDate.setDate(offsetDate.getDate() + daysAfterSignup);

      await db
        .update(offsetPurchases)
        .set({ purchasedAt: offsetDate.toISOString() })
        .where(eq(offsetPurchases.id, offset.id));
    }
    console.log(`✅ Updated ${offsets.length} offset purchase records\n`);

    // Backdate subscriptions
    const subs = await db.select().from(subscriptions);
    console.log(`📅 Processing ${subs.length} subscription records...`);
    
    for (const sub of subs) {
      const subUser = users.find(u => u.id === sub.userId);
      if (!subUser) continue;

      // Set subscription start to user creation date (subscribed immediately)
      const userCreatedAt = new Date(subUser.createdAt);
      const subscriptionStart = userCreatedAt.toISOString();
      
      // Set current period to 30 days from subscription start
      const periodEnd = new Date(userCreatedAt);
      periodEnd.setDate(periodEnd.getDate() + 30);
      
      await db
        .update(subscriptions)
        .set({ 
          createdAt: subscriptionStart,
          updatedAt: subscriptionStart,
          currentPeriodStart: subscriptionStart,
          currentPeriodEnd: periodEnd.toISOString()
        })
        .where(eq(subscriptions.id, sub.id));
    }
    console.log(`✅ Updated ${subs.length} subscription records\n`);

    // Summary
    console.log("📊 BACKDATING SUMMARY:");
    console.log(`   💳 Payment History: ${payments.length} records updated`);
    console.log(`   🪙 Credit Purchases: ${credits.length} records updated`);
    console.log(`   🌳 Offset Purchases: ${offsets.length} records updated`);
    console.log(`   📅 Subscriptions: ${subs.length} records updated`);
    console.log("\n✅ Stripe transaction backdating complete!");

  } catch (error) {
    console.error("❌ Error backdating transactions:", error);
    throw error;
  }
}

backdateStripeTransactions()
  .then(() => {
    console.log("\n🎉 Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
