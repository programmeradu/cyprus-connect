import { db } from '../index';
import { user, emissions, historicalEmissions, dashboardMetrics } from '../schema';

// Seed emissions and dashboard metrics
async function seedEmissions() {
  console.log('📊 Creating emissions and dashboard metrics...');
  
  // Get all users
  const users = await db.select().from(user);
  
  if (users.length === 0) {
    console.log('⚠️ No users found. Run cleanup-and-reseed first.');
    return;
  }
  
  const teamSizeMultipliers = {
    '1-10': 1,
    '11-50': 3,
    '51-200': 8,
  };
  
  // Create historical emissions for Sep, Oct, Nov 2024
  for (const currentUser of users) {
    const multiplier = teamSizeMultipliers[currentUser.teamSize as keyof typeof teamSizeMultipliers] || 1;
    
    // Generate 3 months of data
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const date = new Date('2024-09-01');
      date.setMonth(date.getMonth() + monthOffset);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      // Add some randomness and trends
      const trendFactor = 1 - (monthOffset * 0.05); // Slight improvement over time
      const randomFactor = 0.9 + Math.random() * 0.2;
      
      const electricityKwh = (1200 + Math.random() * 800) * multiplier * trendFactor * randomFactor;
      const gasM3 = (150 + Math.random() * 100) * multiplier * trendFactor * randomFactor;
      const waterLiters = (5000 + Math.random() * 3000) * multiplier * randomFactor;
      const wasteKg = (200 + Math.random() * 150) * multiplier * trendFactor * randomFactor;
      const transportKm = (500 + Math.random() * 400) * multiplier * randomFactor;
      
      // Calculate CO2e (rough estimates)
      const totalCo2e = (electricityKwh * 0.5) + (gasM3 * 2.2) + (wasteKg * 0.5) + (transportKm * 0.2);
      const renewablePercentage = 20 + Math.random() * 40 + (monthOffset * 5);
      const efficiencyScore = 60 + Math.random() * 25 + (monthOffset * 3);
      const wasteDiversionRate = 30 + Math.random() * 40;
      
      await db.insert(historicalEmissions).values({
        userId: currentUser.id,
        year,
        month,
        electricityKwh: parseFloat(electricityKwh.toFixed(2)),
        gasM3: parseFloat(gasM3.toFixed(2)),
        waterLiters: parseFloat(waterLiters.toFixed(2)),
        wasteKg: parseFloat(wasteKg.toFixed(2)),
        transportKm: parseFloat(transportKm.toFixed(2)),
        totalCo2e: parseFloat(totalCo2e.toFixed(2)),
        renewablePercentage: parseFloat(renewablePercentage.toFixed(1)),
        efficiencyScore: parseFloat(efficiencyScore.toFixed(1)),
        wasteDiversionRate: parseFloat(wasteDiversionRate.toFixed(1)),
        createdAt: new Date(year, month - 1, 1).toISOString(),
      });
    }
    
    // Create current dashboard metrics
    const latestMultiplier = teamSizeMultipliers[currentUser.teamSize as keyof typeof teamSizeMultipliers] || 1;
    const currentCarbonFootprint = (800 + Math.random() * 600) * latestMultiplier;
    const previousCarbonFootprint = currentCarbonFootprint * 1.08;
    
    const currentEfficiency = 65 + Math.random() * 25;
    const previousEfficiency = currentEfficiency - 3;
    
    const currentRenewable = 35 + Math.random() * 40;
    const previousRenewable = currentRenewable - 5;
    
    const currentWaste = 40 + Math.random() * 35;
    const previousWaste = currentWaste - 2;
    
    const now = new Date().toISOString();
    
    // Carbon footprint metric
    await db.insert(dashboardMetrics).values({
      userId: currentUser.id,
      metricType: 'carbon_footprint',
      currentValue: parseFloat(currentCarbonFootprint.toFixed(2)),
      previousValue: parseFloat(previousCarbonFootprint.toFixed(2)),
      trendPercentage: parseFloat((((currentCarbonFootprint - previousCarbonFootprint) / previousCarbonFootprint) * 100).toFixed(2)),
      periodStart: '2024-10-01',
      periodEnd: '2024-10-31',
      updatedAt: now,
      createdAt: now,
    });
    
    // Resource efficiency metric
    await db.insert(dashboardMetrics).values({
      userId: currentUser.id,
      metricType: 'resource_efficiency',
      currentValue: parseFloat(currentEfficiency.toFixed(2)),
      previousValue: parseFloat(previousEfficiency.toFixed(2)),
      trendPercentage: parseFloat((((currentEfficiency - previousEfficiency) / previousEfficiency) * 100).toFixed(2)),
      periodStart: '2024-10-01',
      periodEnd: '2024-10-31',
      updatedAt: now,
      createdAt: now,
    });
    
    // Renewable share metric
    await db.insert(dashboardMetrics).values({
      userId: currentUser.id,
      metricType: 'renewable_share',
      currentValue: parseFloat(currentRenewable.toFixed(2)),
      previousValue: parseFloat(previousRenewable.toFixed(2)),
      trendPercentage: parseFloat((((currentRenewable - previousRenewable) / previousRenewable) * 100).toFixed(2)),
      periodStart: '2024-10-01',
      periodEnd: '2024-10-31',
      updatedAt: now,
      createdAt: now,
    });
    
    // Waste diversion metric
    await db.insert(dashboardMetrics).values({
      userId: currentUser.id,
      metricType: 'waste_diversion',
      currentValue: parseFloat(currentWaste.toFixed(2)),
      previousValue: parseFloat(previousWaste.toFixed(2)),
      trendPercentage: parseFloat((((currentWaste - previousWaste) / previousWaste) * 100).toFixed(2)),
      periodStart: '2024-10-01',
      periodEnd: '2024-10-31',
      updatedAt: now,
      createdAt: now,
    });
  }
  
  console.log(`✅ Created emissions data and dashboard metrics for ${users.length} users`);
}

// Run the seed
async function main() {
  try {
    await seedEmissions();
    console.log('🎉 Emissions seeding complete!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main();
