import { db } from "../index";
import { user, actions, userActions, creditsHistory } from "../schema";
import { eq, inArray } from "drizzle-orm";

// Load environment variables
import { config } from "dotenv";
config({ path: ".env" });

async function seedUserActions() {
  console.log("🌱 Seeding completed actions for 9 users...");

  // Fetch all users by email list
  const userEmails = [
    "sarah.chen@ecotech.io",
    "kwame.mensah@greenbuild.gh",
    "emma.schmidt@sustainlog.de",
    "raj.patel@greenmanuf.in",
    "sophie.martin@vertcafe.fr",
    "james.wilson@ecostay.ca",
    "amara.okafor@afritech.ng",
    "liu.wei@greenthreads.cn",
    "oliver.bennett@renewconsult.uk"
  ];

  const users = await db
    .select()
    .from(user)
    .where(inArray(user.email, userEmails));

  if (users.length === 0) {
    console.error("❌ No users found. Please run seed-9-users.ts first.");
    return;
  }

  console.log(`📊 Found ${users.length} users to process`);

  // Fetch all available actions
  const allActions = await db.select().from(actions);
  
  if (allActions.length === 0) {
    console.error("❌ No actions found in database. Cannot proceed.");
    return;
  }

  console.log(`📋 Found ${allActions.length} available actions`);

  // Process each user
  for (const currentUser of users) {
    // Calculate how many actions based on their total credits
    // Assume average action is worth ~100-250 credits
    const avgCreditsPerAction = 175;
    const targetActionCount = Math.floor(currentUser.totalCredits / avgCreditsPerAction);
    
    // Ensure at least 3 actions, max 15 actions
    const actionCount = Math.max(3, Math.min(15, targetActionCount));
    
    // Randomly select actions for this user
    const shuffledActions = [...allActions].sort(() => Math.random() - 0.5);
    const selectedActions = shuffledActions.slice(0, actionCount);
    
    console.log(`\n👤 Processing ${currentUser.name}:`);
    console.log(`   Credits: ${currentUser.totalCredits} → ${actionCount} actions`);
    
    let totalCreditsAwarded = 0;
    
    for (let i = 0; i < selectedActions.length; i++) {
      const action = selectedActions[i];
      
      // Create completion date (spread over last 3 months)
      const daysAgo = Math.floor(Math.random() * 90);
      const completedDate = new Date();
      completedDate.setDate(completedDate.getDate() - daysAgo);
      const completedAt = completedDate.toISOString();
      
      // Insert into userActions table
      await db.insert(userActions).values({
        userId: currentUser.id,
        actionId: action.id,
        completedAt: completedAt,
        notes: null
      });
      
      // Insert into creditsHistory table
      await db.insert(creditsHistory).values({
        userId: currentUser.id,
        amount: action.points,
        source: "action_completion",
        actionId: action.id,
        description: `Completed: ${action.title}`,
        createdAt: completedAt
      });
      
      totalCreditsAwarded += action.points;
      
      console.log(`   ✅ Completed: ${action.title} (+${action.points} credits)`);
    }
    
    console.log(`   💰 Total credits from actions: ${totalCreditsAwarded}`);
    console.log(`   📊 User's total credits: ${currentUser.totalCredits}`);
  }

  console.log("\n🎉 Successfully seeded completed actions for all users!");
}

seedUserActions()
  .then(() => {
    console.log("✅ Seeding complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });