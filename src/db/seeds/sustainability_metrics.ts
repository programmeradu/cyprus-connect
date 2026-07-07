import { db } from '@/db';
import { sustainabilityMetrics } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date();
    
    const sampleMetrics = [
        {
            metricType: 'carbon',
            value: 12.4,
            unit: 'tons CO₂e',
            trend: 'down',
            trendValue: 18,
            color: 'oklch(0.7 0.15 142)',
            updatedAt: currentTimestamp,
        },
        {
            metricType: 'energy',
            value: 8.2,
            unit: 'MWh',
            trend: 'down',
            trendValue: 12,
            color: 'oklch(0.75 0.15 60)',
            updatedAt: currentTimestamp,
        },
        {
            metricType: 'waste',
            value: 3.7,
            unit: 'tons',
            trend: 'down',
            trendValue: 25,
            color: 'oklch(0.7 0.15 280)',
            updatedAt: currentTimestamp,
        },
        {
            metricType: 'water',
            value: 156,
            unit: 'm³',
            trend: 'down',
            trendValue: 8,
            color: 'oklch(0.65 0.15 220)',
            updatedAt: currentTimestamp,
        }
    ];

    await db.insert(sustainabilityMetrics).values(sampleMetrics);
    
    console.log('✅ Sustainability metrics seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});