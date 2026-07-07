import { db } from '@/db';
import { userProgress } from '@/db/schema';

async function main() {
    const sampleUserProgress = [
        {
            userId: 'demo_user',
            greenCredits: 0,
            leaderboardRank: 47,
            completedActionIds: '[]',
            updatedAt: new Date(),
        }
    ];

    await db.insert(userProgress).values(sampleUserProgress);
    
    console.log('✅ User progress seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});