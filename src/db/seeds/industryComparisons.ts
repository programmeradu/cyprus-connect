import { db } from '@/db';
import { industryComparisons } from '@/db/schema';

async function main() {
    const sampleIndustryComparisons = [
        {
            industry: 'technology',
            metricType: 'carbon_footprint',
            averageValue: 18.7,
            topQuartileValue: 14.96,
            bottomQuartileValue: 24.31,
            unit: 'tons CO2e/month',
            updatedAt: new Date().toISOString(),
        },
        {
            industry: 'manufacturing',
            metricType: 'carbon_footprint',
            averageValue: 35.2,
            topQuartileValue: 28.16,
            bottomQuartileValue: 45.76,
            unit: 'tons CO2e/month',
            updatedAt: new Date().toISOString(),
        },
        {
            industry: 'retail',
            metricType: 'carbon_footprint',
            averageValue: 22.5,
            topQuartileValue: 18.0,
            bottomQuartileValue: 29.25,
            unit: 'tons CO2e/month',
            updatedAt: new Date().toISOString(),
        },
        {
            industry: 'healthcare',
            metricType: 'carbon_footprint',
            averageValue: 28.3,
            topQuartileValue: 22.64,
            bottomQuartileValue: 36.79,
            unit: 'tons CO2e/month',
            updatedAt: new Date().toISOString(),
        },
        {
            industry: 'finance',
            metricType: 'carbon_footprint',
            averageValue: 15.8,
            topQuartileValue: 12.64,
            bottomQuartileValue: 20.54,
            unit: 'tons CO2e/month',
            updatedAt: new Date().toISOString(),
        }
    ];

    await db.insert(industryComparisons).values(sampleIndustryComparisons);
    
    console.log('✅ Industry comparisons seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});