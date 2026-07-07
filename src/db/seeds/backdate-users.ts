import { db } from "@/db";
import { user, emissions } from "@/db/schema";
import { sql } from "drizzle-orm";

async function backdateUsers() {
  console.log("🔄 Backdating user records...");

  try {
    // Get all users
    const users = await db.select().from(user);
    console.log(`Found ${users.length} users to backdate`);

    // Spread users across last 30 days
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < users.length; i++) {
      const userId = users[i].id;
      
      // Distribute users across 30 days
      let daysAgo: number;
      const percentage = (i / users.length) * 100;
      
      if (percentage < 30) {
        // 30% of users: 1-7 days ago
        daysAgo = Math.floor(Math.random() * 7) + 1;
      } else if (percentage < 60) {
        // 30% of users: 8-14 days ago
        daysAgo = Math.floor(Math.random() * 7) + 8;
      } else if (percentage < 85) {
        // 25% of users: 15-21 days ago
        daysAgo = Math.floor(Math.random() * 7) + 15;
      } else {
        // 15% of users: 22-30 days ago
        daysAgo = Math.floor(Math.random() * 9) + 22;
      }

      const createdAt = now - (daysAgo * dayInMs);
      const createdAtDate = new Date(createdAt);

      // Update user created_at
      await db.update(user)
        .set({ createdAt: createdAtDate })
        .where(sql`${user.id} = ${userId}`);

      // Update emissions records for this user to be after their creation date
      const userEmissions = await db.select()
        .from(emissions)
        .where(sql`${emissions.userId} = ${userId}`);

      for (const emission of userEmissions) {
        // Emissions should be between user creation and now
        const emissionDaysAfterCreation = Math.floor(Math.random() * Math.min(daysAgo, 5));
        const emissionDate = createdAt + (emissionDaysAfterCreation * dayInMs);
        const emissionDateObj = new Date(emissionDate);

        await db.update(emissions)
          .set({ 
            createdAt: emissionDateObj.toISOString()
          })
          .where(sql`${emissions.id} = ${emission.id}`);
      }

      console.log(`✓ Backdated user ${i + 1}/${users.length} (${users[i].email}) to ${daysAgo} days ago`);
    }

    console.log("✅ Successfully backdated all user records!");
    
    // Show distribution
    const distribution = await db.execute(sql`
      SELECT 
        CASE 
          WHEN julianday('now') - julianday(createdAt) <= 7 THEN '1-7 days'
          WHEN julianday('now') - julianday(createdAt) <= 14 THEN '8-14 days'
          WHEN julianday('now') - julianday(createdAt) <= 21 THEN '15-21 days'
          ELSE '22-30 days'
        END as period,
        COUNT(*) as count
      FROM user
      GROUP BY period
      ORDER BY period
    `);
    
    console.log("\n📊 User Distribution:");
    console.log(distribution);

  } catch (error) {
    console.error("❌ Error backdating users:", error);
    throw error;
  }
}

backdateUsers()
  .then(() => {
    console.log("✅ Backdating complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Backdating failed:", error);
    process.exit(1);
  });