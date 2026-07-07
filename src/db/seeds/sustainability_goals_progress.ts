import { db } from '@/db';
import { sustainabilityGoalsProgress } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date().toISOString();
    
    const sampleGoalsProgress = [
        {
            userId: 'demo_user',
            goalType: 'carbon-neutral',
            targetValue: 0,
            currentValue: 34.1,
            targetYear: 2030,
            progressPercentage: 25.5,
            createdAt: '2024-01-15T08:00:00.000Z',
            updatedAt: currentTimestamp,
        },
        {
            userId: 'demo_user',
            goalType: 'reduce-energy',
            targetValue: 1200,
            currentValue: 1520,
            targetYear: 2028,
            progressPercentage: 50.8,
            createdAt: '2024-01-20T08:00:00.000Z',
            updatedAt: currentTimestamp,
        },
        {
            userId: 'demo_user',
            goalType: 'zero-waste',
            targetValue: 90,
            currentValue: 58,
            targetYear: 2029,
            progressPercentage: 64.4,
            createdAt: '2024-02-01T08:00:00.000Z',
            updatedAt: currentTimestamp,
        },
        {
            userId: 'demo_user',
            goalType: 'renewable-100',
            targetValue: 100,
            currentValue: 38,
            targetYear: 2027,
            progressPercentage: 38.0,
            createdAt: '2024-02-10T08:00:00.000Z',
            updatedAt: currentTimestamp,
        }
    ];

    await db.insert(sustainabilityGoalsProgress).values(sampleGoalsProgress);
    
    console.log('✅ Sustainability goals progress seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});