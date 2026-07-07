import { db } from '@/db';
import { leaderboard } from '@/db/schema';

async function main() {
    const sampleLeaderboard = [
        {
            companyName: 'EcoTech Solutions',
            credits: 2450,
            rank: 1,
            isDemoUser: false,
        },
        {
            companyName: 'GreenVentures Inc',
            credits: 2280,
            rank: 2,
            isDemoUser: false,
        },
        {
            companyName: 'Sustainable Systems',
            credits: 2150,
            rank: 3,
            isDemoUser: false,
        },
        {
            companyName: 'CleanTech Corp',
            credits: 920,
            rank: 44,
            isDemoUser: false,
        },
        {
            companyName: 'EarthFirst Ltd',
            credits: 905,
            rank: 45,
            isDemoUser: false,
        },
        {
            companyName: 'Green Innovations',
            credits: 892,
            rank: 46,
            isDemoUser: false,
        },
        {
            companyName: 'Your Company',
            credits: 0,
            rank: 47,
            isDemoUser: true,
        },
        {
            companyName: 'Sustainable Co',
            credits: 875,
            rank: 48,
            isDemoUser: false,
        },
        {
            companyName: 'EcoWorks Global',
            credits: 860,
            rank: 49,
            isDemoUser: false,
        },
        {
            companyName: 'GreenPath Industries',
            credits: 845,
            rank: 50,
            isDemoUser: false,
        },
    ];

    await db.insert(leaderboard).values(sampleLeaderboard);
    
    console.log('✅ Leaderboard seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});