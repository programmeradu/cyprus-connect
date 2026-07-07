import { db } from '@/db';
import { dashboardMetrics } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date().toISOString();
    
    const sampleMetrics = [
        {
            userId: 'demo_user',
            metricType: 'carbon_footprint',
            currentValue: 34.1,
            previousValue: 36.2,
            trendPercentage: -5.8,
            periodStart: '2024-11-01T00:00:00.000Z',
            periodEnd: '2024-11-30T23:59:59.999Z',
            createdAt: '2024-11-15T10:00:00.000Z',
            updatedAt: currentTimestamp,
        },
        {
            userId: 'demo_user',
            metricType: 'resource_efficiency',
            currentValue: 75,
            previousValue: 71,
            trendPercentage: 5.6,
            periodStart: '2024-11-01T00:00:00.000Z',
            periodEnd: '2024-11-30T23:59:59.999Z',
            createdAt: '2024-11-15T10:00:00.000Z',
            updatedAt: currentTimestamp,
        },
        {
            userId: 'demo_user',
            metricType: 'renewable_share',
            currentValue: 38,
            previousValue: 32,
            trendPercentage: 18.8,
            periodStart: '2024-11-01T00:00:00.000Z',
            periodEnd: '2024-11-30T23:59:59.999Z',
            createdAt: '2024-11-15T10:00:00.000Z',
            updatedAt: currentTimestamp,
        },
        {
            userId: 'demo_user',
            metricType: 'waste_diversion',
            currentValue: 58,
            previousValue: 52,
            trendPercentage: 11.5,
            periodStart: '2024-11-01T00:00:00.000Z',
            periodEnd: '2024-11-30T23:59:59.999Z',
            createdAt: '2024-11-15T10:00:00.000Z',
            updatedAt: currentTimestamp,
        },
    ];

    await db.insert(dashboardMetrics).values(sampleMetrics);
    
    console.log('✅ Dashboard metrics seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});