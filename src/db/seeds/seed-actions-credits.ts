import { db } from '../index';
import { user, actions, userActions, creditsHistory, leaderboard } from '../schema';
import { eq, desc } from 'drizzle-orm';

// Seed actions, credits, and leaderboard
async function seedActionsAndCredits() {
  console.log('🎯 Creating actions, credits, and leaderboard...');
  
  // Get all users
  const users = await db.select().from(user);
  
  if (users.length === 0) {
    console.log('⚠️ No users found. Run cleanup-and-reseed first.');
    return;
  }
  
  // Create base actions if they don't exist
  const baseActions = [
    { title: 'Switch to LED Lighting', description: 'Replace traditional bulbs with LED', category: 'energy', impact: 'high', difficulty: 'easy', points: 50, iconName: 'lightbulb' },
    { title: 'Install Smart Thermostat', description: 'Automate heating and cooling', category: 'energy', impact: 'high', difficulty: 'medium', points: 75, iconName: 'thermometer' },
    { title: 'Start Composting Program', description: 'Divert organic waste from landfills', category: 'waste', impact: 'medium', difficulty: 'easy', points: 40, iconName: 'recycle' },
    { title: 'Implement Recycling System', description: 'Proper waste segregation', category: 'waste', impact: 'medium', difficulty: 'easy', points: 35, iconName: 'trash' },
    { title: 'Install Solar Panels', description: 'Generate renewable energy on-site', category: 'energy', impact: 'very_high', difficulty: 'hard', points: 150, iconName: 'sun' },
    { title: 'Switch to Electric Vehicles', description: 'Replace fleet with EVs', category: 'transport', impact: 'high', difficulty: 'hard', points: 120, iconName: 'car' },
    { title: 'Reduce Business Travel', description: 'Use video conferencing instead', category: 'transport', impact: 'medium', difficulty: 'easy', points: 30, iconName: 'plane' },
    { title: 'Water Conservation System', description: 'Install low-flow fixtures', category: 'water', impact: 'medium', difficulty: 'medium', points: 45, iconName: 'droplet' },
    { title: 'Green Supplier Program', description: 'Work with eco-certified vendors', category: 'supply_chain', impact: 'high', difficulty: 'medium', points: 60, iconName: 'package' },
    { title: 'Employee Training Program', description: 'Sustainability awareness training', category: 'culture', impact: 'medium', difficulty: 'easy', points: 40, iconName: 'users' },
    { title: 'Paperless Office Initiative', description: 'Digitize documents and processes', category: 'waste', impact: 'low', difficulty: 'easy', points: 25, iconName: 'file' },
    { title: 'Energy Audit', description: 'Professional energy assessment', category: 'energy', impact: 'medium', difficulty: 'easy', points: 35, iconName: 'search' },
  ];
  
  const createdActions = [];
  for (const action of baseActions) {
    const [inserted] = await db.insert(actions).values({
      ...action,
      isCustom: false,
      createdAt: new Date('2024-10-01T00:00:00Z').toISOString(),
    }).returning();
    createdActions.push(inserted);
  }
  
  // Create user actions and credits spread across Oct-Nov
  let totalActionsCreated = 0;
  const startDate = new Date('2024-10-01T00:00:00Z');
  const endDate = new Date('2024-11-28T23:59:59Z');
  const dateRange = endDate.getTime() - startDate.getTime();
  
  for (const currentUser of users) {
    const userCreatedAt = new Date(currentUser.createdAt);
    const availableStartDate = userCreatedAt.getTime();
    const userDateRange = endDate.getTime() - availableStartDate;
    
    // Each user completes 5-15 actions
    const actionsCount = 5 + Math.floor(Math.random() * 11);
    let userTotalCredits = 0;
    
    // Shuffle actions for variety
    const shuffledActions = [...createdActions].sort(() => Math.random() - 0.5);
    const userSelectedActions = shuffledActions.slice(0, actionsCount);
    
    for (let i = 0; i < userSelectedActions.length; i++) {
      const action = userSelectedActions[i];
      
      // Random date after user creation
      const randomDate = new Date(availableStartDate + Math.random() * userDateRange);
      
      // Create user action
      await db.insert(userActions).values({
        userId: currentUser.id,
        actionId: action.id,
        completedAt: randomDate.toISOString(),
        notes: `Completed as part of sustainability initiative`,
      });
      
      // Create credits history
      await db.insert(creditsHistory).values({
        userId: currentUser.id,
        amount: action.points,
        source: 'action_completed',
        actionId: action.id,
        description: `Earned ${action.points} credits for: ${action.title}`,
        createdAt: randomDate.toISOString(),
      });
      
      userTotalCredits += action.points;
      totalActionsCreated++;
    }
    
    // Update user total credits
    await db.update(user)
      .set({ totalCredits: userTotalCredits })
      .where(eq(user.id, currentUser.id));
  }
  
  // Create leaderboard based on credits
  const usersWithCredits = await db.select().from(user).orderBy(desc(user.totalCredits));
  
  for (let i = 0; i < usersWithCredits.length; i++) {
    await db.insert(leaderboard).values({
      companyName: usersWithCredits[i].companyName || usersWithCredits[i].name,
      credits: usersWithCredits[i].totalCredits,
      rank: i + 1,
      isDemoUser: false,
    });
  }
  
  console.log(`✅ Created ${createdActions.length} base actions`);
  console.log(`✅ Created ${totalActionsCreated} user action completions`);
  console.log(`✅ Created leaderboard with ${usersWithCredits.length} entries`);
}

// Run the seed
async function main() {
  try {
    await seedActionsAndCredits();
    console.log('🎉 Actions and credits seeding complete!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main();