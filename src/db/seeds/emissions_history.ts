import { db } from '@/db';
import { emissionsHistory } from '@/db/schema';

async function main() {
    const sampleEmissionsHistory = [
        {
            month: 'Jun',
            value: 85,
            emissions: 15.2,
            createdAt: new Date('2024-06-15T12:00:00Z'),
        },
        {
            month: 'Jul',
            value: 78,
            emissions: 14.1,
            createdAt: new Date('2024-07-15T12:00:00Z'),
        },
        {
            month: 'Aug',
            value: 82,
            emissions: 14.8,
            createdAt: new Date('2024-08-15T12:00:00Z'),
        },
        {
            month: 'Sep',
            value: 70,
            emissions: 12.6,
            createdAt: new Date('2024-09-15T12:00:00Z'),
        },
        {
            month: 'Oct',
            value: 65,
            emissions: 11.7,
            createdAt: new Date('2024-10-15T12:00:00Z'),
        },
        {
            month: 'Nov',
            value: 58,
            emissions: 10.5,
            createdAt: new Date('2024-11-15T12:00:00Z'),
        },
    ];

    await db.insert(emissionsHistory).values(sampleEmissionsHistory);
    
    console.log('✅ Emissions history seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});