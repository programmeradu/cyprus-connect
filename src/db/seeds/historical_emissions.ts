import { db } from '@/db';
import { historicalEmissions } from '@/db/schema';

async function main() {
    const sampleData = [
        {
            userId: '87uxgGsqbZVPCLCnzCCJCJdTYnNvU33L',
            year: 2024,
            month: 7,
            electricityKwh: 11500,
            gasM3: 750,
            waterLiters: 75000,
            wasteKg: 3200,
            transportKm: 1850,
            totalCo2e: 70.8,
            renewablePercentage: 32,
            efficiencyScore: 72,
            wasteDiversionRate: 42,
            createdAt: new Date('2024-07-15T12:00:00Z').toISOString(),
        },
        {
            userId: '87uxgGsqbZVPCLCnzCCJCJdTYnNvU33L',
            year: 2024,
            month: 8,
            electricityKwh: 11000,
            gasM3: 720,
            waterLiters: 72000,
            wasteKg: 3050,
            transportKm: 1750,
            totalCo2e: 67.4,
            renewablePercentage: 35,
            efficiencyScore: 74,
            wasteDiversionRate: 45,
            createdAt: new Date('2024-08-15T12:00:00Z').toISOString(),
        },
        {
            userId: '87uxgGsqbZVPCLCnzCCJCJdTYnNvU33L',
            year: 2024,
            month: 9,
            electricityKwh: 10500,
            gasM3: 690,
            waterLiters: 68000,
            wasteKg: 2900,
            transportKm: 1650,
            totalCo2e: 63.9,
            renewablePercentage: 38,
            efficiencyScore: 76,
            wasteDiversionRate: 48,
            createdAt: new Date('2024-09-15T12:00:00Z').toISOString(),
        },
        {
            userId: '87uxgGsqbZVPCLCnzCCJCJdTYnNvU33L',
            year: 2024,
            month: 10,
            electricityKwh: 10000,
            gasM3: 660,
            waterLiters: 65000,
            wasteKg: 2750,
            transportKm: 1550,
            totalCo2e: 60.7,
            renewablePercentage: 40,
            efficiencyScore: 79,
            wasteDiversionRate: 52,
            createdAt: new Date('2024-10-15T12:00:00Z').toISOString(),
        },
        {
            userId: '87uxgGsqbZVPCLCnzCCJCJdTYnNvU33L',
            year: 2024,
            month: 11,
            electricityKwh: 9500,
            gasM3: 630,
            waterLiters: 62000,
            wasteKg: 2600,
            transportKm: 1450,
            totalCo2e: 57.6,
            renewablePercentage: 42,
            efficiencyScore: 81,
            wasteDiversionRate: 55,
            createdAt: new Date('2024-11-15T12:00:00Z').toISOString(),
        },
        {
            userId: '87uxgGsqbZVPCLCnzCCJCJdTYnNvU33L',
            year: 2024,
            month: 12,
            electricityKwh: 9000,
            gasM3: 600,
            waterLiters: 58000,
            wasteKg: 2450,
            transportKm: 1350,
            totalCo2e: 54.4,
            renewablePercentage: 45,
            efficiencyScore: 84,
            wasteDiversionRate: 58,
            createdAt: new Date('2024-12-15T12:00:00Z').toISOString(),
        },
    ];

    await db.insert(historicalEmissions).values(sampleData);
    
    console.log('✅ Historical emissions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});