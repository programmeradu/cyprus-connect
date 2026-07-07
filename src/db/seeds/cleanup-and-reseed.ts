import { db } from '../index';
import { 
  user, paymentHistory, subscriptions, userActions, creditsHistory,
  emissions, historicalEmissions, dashboardMetrics, leaderboard,
  offsetPurchases, userImpactTracking, complianceDocuments, complianceAuditLogs,
  session, account
} from '../schema';

// Clean up all existing seed data
async function cleanup() {
  console.log('🧹 Cleaning up existing data...');
  
  await db.delete(complianceAuditLogs);
  await db.delete(complianceDocuments);
  await db.delete(userImpactTracking);
  await db.delete(offsetPurchases);
  await db.delete(leaderboard);
  await db.delete(dashboardMetrics);
  await db.delete(historicalEmissions);
  await db.delete(emissions);
  await db.delete(creditsHistory);
  await db.delete(userActions);
  await db.delete(paymentHistory);
  await db.delete(subscriptions);
  await db.delete(session);
  await db.delete(account);
  await db.delete(user);
  
  console.log('✅ Cleanup complete');
}

// Generate realistic users
async function seedUsers() {
  console.log('👥 Creating users...');
  
  const gmailUsers = [
    { name: 'John Smith', email: 'john.smith@gmail.com', company: 'Smith Consulting', industry: 'consulting', size: 'small' },
    { name: 'Sarah Chen', email: 'sarah.chen@gmail.com', company: 'Chen Innovations', industry: 'technology', size: 'medium' },
    { name: 'Miguel Rodriguez', email: 'miguel.rodriguez@gmail.com', company: 'Rodriguez Manufacturing', industry: 'manufacturing', size: 'large' },
    { name: 'Emma Wilson', email: 'emma.wilson@gmail.com', company: 'Wilson Retail', industry: 'retail', size: 'medium' },
    { name: 'David Park', email: 'david.park@gmail.com', company: 'Park Foods', industry: 'food_beverage', size: 'medium' },
    { name: 'Lisa Anderson', email: 'lisa.anderson@gmail.com', company: 'Anderson Health', industry: 'healthcare', size: 'large' },
    { name: 'James Taylor', email: 'james.taylor@gmail.com', company: 'Taylor Tech Solutions', industry: 'technology', size: 'small' },
    { name: 'Maria Garcia', email: 'maria.garcia@gmail.com', company: 'Garcia Sustainable Goods', industry: 'retail', size: 'small' },
    { name: 'Thomas Brown', email: 'thomas.brown@gmail.com', company: 'Brown Manufacturing Co', industry: 'manufacturing', size: 'medium' },
    { name: 'Jennifer Lee', email: 'jennifer.lee@gmail.com', company: 'Lee Consulting Group', industry: 'consulting', size: 'medium' },
    { name: 'Robert Kim', email: 'robert.kim@gmail.com', company: 'Kim Food Services', industry: 'food_beverage', size: 'large' },
    { name: 'Anna Schmidt', email: 'anna.schmidt@gmail.com', company: 'Schmidt Healthcare', industry: 'healthcare', size: 'medium' },
    { name: 'Michael Chen', email: 'michael.chen@gmail.com', company: 'Chen Enterprises', industry: 'technology', size: 'large' },
    { name: 'Sophie Martin', email: 'sophie.martin@gmail.com', company: 'Martin Retail Group', industry: 'retail', size: 'medium' },
    { name: 'Daniel Nguyen', email: 'daniel.nguyen@gmail.com', company: 'Nguyen Manufacturing', industry: 'manufacturing', size: 'small' },
  ];
  
  const businessUsers = [
    { name: 'Alex Thompson', email: 'alex.thompson@greentech.com', company: 'GreenTech Solutions', industry: 'technology', size: 'large' },
    { name: 'Rachel Green', email: 'rachel.green@ecoventures.io', company: 'EcoVentures Inc', industry: 'consulting', size: 'medium' },
    { name: 'Chris Wang', email: 'chris.wang@sustainableco.com', company: 'Sustainable Co', industry: 'manufacturing', size: 'large' },
    { name: 'Laura Martinez', email: 'laura.martinez@carbonfree.biz', company: 'CarbonFree Business', industry: 'retail', size: 'medium' },
    { name: 'Kevin O\'Brien', email: 'kevin.obrien@renewableplus.com', company: 'RenewablePlus Energy', industry: 'technology', size: 'large' },
    { name: 'Nina Patel', email: 'nina.patel@greentech.com', company: 'GreenTech Solutions', industry: 'technology', size: 'large' },
    { name: 'Marcus Johnson', email: 'marcus.johnson@ecoventures.io', company: 'EcoVentures Inc', industry: 'consulting', size: 'medium' },
    { name: 'Yuki Tanaka', email: 'yuki.tanaka@sustainableco.com', company: 'Sustainable Co', industry: 'food_beverage', size: 'medium' },
    { name: 'Isabella Rossi', email: 'isabella.rossi@carbonfree.biz', company: 'CarbonFree Business', industry: 'healthcare', size: 'large' },
    { name: 'Ahmed Hassan', email: 'ahmed.hassan@renewableplus.com', company: 'RenewablePlus Energy', industry: 'technology', size: 'medium' },
  ];
  
  const allUsers = [...gmailUsers, ...businessUsers];
  const teamSizeMap: Record<'small' | 'medium' | 'large', string> = { small: '1-10', medium: '11-50', large: '51-200' };
  
  // Spread dates across October 1-30, 2024
  const baseDate = new Date('2024-10-01T00:00:00Z');
  
  for (let i = 0; i < allUsers.length; i++) {
    const userData = allUsers[i];
    const daysOffset = Math.floor((i / allUsers.length) * 29);
    const hoursOffset = Math.floor(Math.random() * 24);
    const minutesOffset = Math.floor(Math.random() * 60);
    
    const createdAt = new Date(baseDate);
    createdAt.setDate(createdAt.getDate() + daysOffset);
    createdAt.setHours(hoursOffset, minutesOffset, 0, 0);
    
    await db.insert(user).values({
      id: `user_${i + 1}_${Date.now() + i}`,
      name: userData.name,
      email: userData.email,
      emailVerified: true,
      companyName: userData.company,
      companyIndustry: userData.industry,
      teamSize: teamSizeMap[userData.size as keyof typeof teamSizeMap] || '1-10',
      sustainabilityGoals: 'Reduce carbon footprint and increase renewable energy usage',
      totalCredits: 0,
      onboardingCompleted: true,
      preferredCurrency: 'USD',
      countryCode: 'US',
      timezone: 'America/New_York',
      energyZone: 'US-EAST',
      createdAt: createdAt,
      updatedAt: createdAt,
    });
  }
  
  console.log(`✅ Created ${allUsers.length} users`);
}

// Run the cleanup and seed
async function main() {
  try {
    await cleanup();
    await seedUsers();
    console.log('🎉 Database cleanup and reseeding complete!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main();