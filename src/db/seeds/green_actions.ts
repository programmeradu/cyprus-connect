import { db } from '@/db';
import { greenActions } from '@/db/schema';

async function main() {
    const sampleGreenActions = [
        // Energy Efficiency (1-5)
        {
            title: 'Switch to LED lighting',
            impact: '-0.8 tons CO₂e/year',
            credits: 50,
            orderIndex: 1,
        },
        {
            title: 'Optimize HVAC schedule',
            impact: '-1.2 tons CO₂e/year',
            credits: 75,
            orderIndex: 2,
        },
        {
            title: 'Install smart thermostats',
            impact: '-0.6 tons CO₂e/year',
            credits: 45,
            orderIndex: 3,
        },
        {
            title: 'Upgrade to energy-efficient appliances',
            impact: '-1.5 tons CO₂e/year',
            credits: 90,
            orderIndex: 4,
        },
        {
            title: 'Implement motion-sensor lighting',
            impact: '-0.4 tons CO₂e/year',
            credits: 35,
            orderIndex: 5,
        },
        // Renewable Energy (6-8)
        {
            title: 'Use renewable energy',
            impact: '-3.2 tons CO₂e/year',
            credits: 150,
            orderIndex: 6,
        },
        {
            title: 'Install solar panels',
            impact: '-4.5 tons CO₂e/year',
            credits: 200,
            orderIndex: 7,
        },
        {
            title: 'Purchase renewable energy certificates',
            impact: '-2.0 tons CO₂e/year',
            credits: 100,
            orderIndex: 8,
        },
        // Waste Management (9-11)
        {
            title: 'Implement recycling program',
            impact: '-0.5 tons CO₂e/year',
            credits: 40,
            orderIndex: 9,
        },
        {
            title: 'Start composting organic waste',
            impact: '-0.7 tons CO₂e/year',
            credits: 55,
            orderIndex: 10,
        },
        {
            title: 'Reduce single-use plastics',
            impact: '-0.3 tons CO₂e/year',
            credits: 30,
            orderIndex: 11,
        },
        // Water Conservation (12-13)
        {
            title: 'Install low-flow fixtures',
            impact: '-0.4 tons CO₂e/year',
            credits: 40,
            orderIndex: 12,
        },
        {
            title: 'Implement rainwater harvesting',
            impact: '-0.6 tons CO₂e/year',
            credits: 65,
            orderIndex: 13,
        },
        // Transportation (14-16)
        {
            title: 'Switch to electric vehicles',
            impact: '-2.8 tons CO₂e/year',
            credits: 140,
            orderIndex: 14,
        },
        {
            title: 'Promote remote work policies',
            impact: '-1.8 tons CO₂e/year',
            credits: 85,
            orderIndex: 15,
        },
        {
            title: 'Install EV charging stations',
            impact: '-1.2 tons CO₂e/year',
            credits: 70,
            orderIndex: 16,
        },
        // Sustainable Practices (17-20)
        {
            title: 'Source from local suppliers',
            impact: '-0.9 tons CO₂e/year',
            credits: 60,
            orderIndex: 17,
        },
        {
            title: 'Conduct energy audit',
            impact: '-1.0 tons CO₂e/year',
            credits: 50,
            orderIndex: 18,
        },
        {
            title: 'Implement paperless operations',
            impact: '-0.5 tons CO₂e/year',
            credits: 45,
            orderIndex: 19,
        },
        {
            title: 'Create employee sustainability training',
            impact: '-0.8 tons CO₂e/year',
            credits: 55,
            orderIndex: 20,
        },
    ];

    await db.insert(greenActions).values(sampleGreenActions);
    
    console.log('✅ Green actions seeder completed successfully - 20 actions added');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});