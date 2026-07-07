import { NextRequest, NextResponse } from 'next/server';
import { ClimateTraceClient } from '@/lib/api-clients/climate-trace';
import { db } from '@/db';
import { emissions, user } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

interface CompanyData {
  sector: string;
  annual_emissions: number; // tCO2e
  employees: number;
  annual_revenue: number; // millions
  country?: string;
  userId?: string;
}

interface BenchmarkComparison {
  company_emissions: number;
  industry_average: number;
  global_average: number;
  regional_average: number;
  percentile_rank: number;
  global_percentile_rank: number;
  vs_average_percent: number;
  vs_global_percent: number;
  interpretation: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'ABOVE_AVERAGE' | 'NEEDS_IMPROVEMENT';
  emissions_per_employee: number;
  industry_emissions_per_employee: number;
  emissions_per_revenue: number;
  industry_emissions_per_revenue: number;
  recommendations: string[];
  location_context: {
    country: string;
    country_total_emissions: number;
    user_percentage_of_country: number;
  };
}

// Sector to Climate TRACE sector mapping
const SECTOR_MAPPING: Record<string, string> = {
  'retail': 'buildings',
  'manufacturing': 'manufacturing',
  'hospitality': 'buildings',
  'technology': 'power',
  'logistics': 'transportation',
  'food-service': 'agriculture',
};

// Industry benchmark fallback data (avoid internal fetch)
const INDUSTRY_BENCHMARKS: Record<string, {
  emissions_avg: number;
  emissions_per_employee: number;
  emissions_per_revenue: number;
}> = {
  'retail': { emissions_avg: 250, emissions_per_employee: 5.0, emissions_per_revenue: 50 },
  'manufacturing': { emissions_avg: 800, emissions_per_employee: 16.0, emissions_per_revenue: 160 },
  'hospitality': { emissions_avg: 180, emissions_per_employee: 3.6, emissions_per_revenue: 36 },
  'technology': { emissions_avg: 150, emissions_per_employee: 3.0, emissions_per_revenue: 30 },
  'logistics': { emissions_avg: 600, emissions_per_employee: 12.0, emissions_per_revenue: 120 },
  'food-service': { emissions_avg: 200, emissions_per_employee: 4.0, emissions_per_revenue: 40 },
};

export async function POST(request: NextRequest) {
  try {
    const companyData: CompanyData = await request.json();
    const climateTraceClient = new ClimateTraceClient();

    // Determine country from user data or request
    let country = companyData.country || 'USA';
    let actualEmissions = companyData.annual_emissions;
    
    // If userId provided, fetch real user data
    if (companyData.userId) {
      try {
        const userData = await db.select()
          .from(user)
          .where(eq(user.id, companyData.userId))
          .limit(1);
        
        if (userData.length > 0) {
          // Get user's latest emissions
          const userEmissions = await db.select()
            .from(emissions)
            .where(eq(emissions.userId, companyData.userId))
            .orderBy(desc(emissions.createdAt))
            .limit(1);
          
          if (userEmissions.length > 0) {
            actualEmissions = userEmissions[0].totalCo2e;
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    }

    // Fetch real-time country emissions data
    let countryData: any;
    try {
      countryData = await climateTraceClient.getCountryEmissions(country);
      console.log(`Climate TRACE data for ${country}:`, countryData);
    } catch (error) {
      console.error(`No Climate TRACE data for ${country}, using fallback`);
      // Use fallback
      countryData = {
        country_iso3: country,
        total_emissions_mtco2e: 5000000000,
        sectors: []
      };
    }

    // Map company sector to Climate TRACE sector
    const traceSector = SECTOR_MAPPING[companyData.sector.toLowerCase()] || 'manufacturing';
    
    // Calculate sector emissions from country data
    let sectorEmissionsInCountry = 0;
    const sectorData = countryData.sectors?.find((s: any) => 
      s.sector.toLowerCase().includes(traceSector.toLowerCase())
    );
    
    if (sectorData) {
      sectorEmissionsInCountry = sectorData.emissions;
    }

    // Use direct benchmark data instead of internal fetch
    const benchmarkData = INDUSTRY_BENCHMARKS[companyData.sector.toLowerCase()] || INDUSTRY_BENCHMARKS['retail'];
    
    let regionalAverage = benchmarkData.emissions_avg;
    let globalAverage = regionalAverage * 1.25; // Global average is typically 20-30% higher
    let industryEmissionsPerEmployee = benchmarkData.emissions_per_employee;
    let industryEmissionsPerRevenue = benchmarkData.emissions_per_revenue;

    // Calculate metrics
    const companyEmissionsPerEmployee = companyData.employees > 0 
      ? actualEmissions / companyData.employees 
      : 0;
    const companyEmissionsPerRevenue = companyData.annual_revenue > 0 
      ? actualEmissions / companyData.annual_revenue 
      : 0;
    
    const vsAveragePercent = ((actualEmissions - regionalAverage) / regionalAverage) * 100;
    const vsGlobalPercent = ((actualEmissions - globalAverage) / globalAverage) * 100;

    // Determine percentile ranks
    let percentileRank = 50;
    let globalPercentileRank = 50;
    
    // Regional percentile
    if (actualEmissions <= regionalAverage * 0.5) {
      percentileRank = 10;
    } else if (actualEmissions <= regionalAverage * 0.75) {
      percentileRank = 25;
    } else if (actualEmissions <= regionalAverage) {
      percentileRank = 50;
    } else if (actualEmissions <= regionalAverage * 1.25) {
      percentileRank = 75;
    } else {
      percentileRank = 90;
    }

    // Global percentile
    if (actualEmissions <= globalAverage * 0.5) {
      globalPercentileRank = 10;
    } else if (actualEmissions <= globalAverage * 0.75) {
      globalPercentileRank = 25;
    } else if (actualEmissions <= globalAverage) {
      globalPercentileRank = 50;
    } else if (actualEmissions <= globalAverage * 1.25) {
      globalPercentileRank = 75;
    } else {
      globalPercentileRank = 90;
    }

    // Interpretation based on regional performance
    let interpretation: BenchmarkComparison['interpretation'];
    if (percentileRank <= 25) {
      interpretation = 'EXCELLENT';
    } else if (percentileRank <= 50) {
      interpretation = 'GOOD';
    } else if (percentileRank <= 75) {
      interpretation = 'AVERAGE';
    } else if (percentileRank <= 85) {
      interpretation = 'ABOVE_AVERAGE';
    } else {
      interpretation = 'NEEDS_IMPROVEMENT';
    }

    // Generate personalized recommendations based on actual performance
    const recommendations: string[] = [];
    
    if (vsAveragePercent > 30) {
      recommendations.push(`Your emissions are ${Math.abs(vsAveragePercent).toFixed(1)}% above the ${country} ${companyData.sector} average. Priority: Energy efficiency audit`);
      recommendations.push('Consider renewable energy transition to reduce carbon footprint');
      recommendations.push('Implement Science Based Targets initiative (SBTi) aligned goals');
    } else if (vsAveragePercent > 10) {
      recommendations.push(`You're ${Math.abs(vsAveragePercent).toFixed(1)}% above regional average. Room for improvement exists`);
      recommendations.push('Explore additional renewable energy options and efficiency upgrades');
      recommendations.push('Consider ISO 14001 environmental management certification');
    } else if (vsAveragePercent > -10) {
      recommendations.push(`You're performing at par with ${country} industry standards`);
      recommendations.push('Continue current initiatives and explore carbon offset programs');
      recommendations.push('Set more ambitious reduction targets to become a leader');
    } else {
      recommendations.push(`Excellent! You're ${Math.abs(vsAveragePercent).toFixed(1)}% below regional average`);
      recommendations.push('Share your best practices with industry peers and associations');
      recommendations.push('Consider pursuing carbon neutrality or net-zero certification');
      recommendations.push('Document case studies for sustainability reports and awards');
    }

    // Add employee-specific insights
    if (companyEmissionsPerEmployee > industryEmissionsPerEmployee * 1.2) {
      recommendations.push(`High per-employee emissions (${companyEmissionsPerEmployee.toFixed(2)} vs ${industryEmissionsPerEmployee.toFixed(2)} tCO₂e). Focus on operational efficiency`);
    }

    // Add revenue-specific insights
    if (companyEmissionsPerRevenue > industryEmissionsPerRevenue * 1.2) {
      recommendations.push(`Carbon intensity per revenue is high. Optimize supply chain and logistics`);
    }

    // Location context
    const userPercentageOfCountry = countryData.total_emissions_mtco2e > 0
      ? (actualEmissions / countryData.total_emissions_mtco2e) * 100
      : 0;

    const comparison: BenchmarkComparison = {
      company_emissions: actualEmissions,
      industry_average: regionalAverage,
      global_average: globalAverage,
      regional_average: regionalAverage,
      percentile_rank: percentileRank,
      global_percentile_rank: globalPercentileRank,
      vs_average_percent: parseFloat(vsAveragePercent.toFixed(2)),
      vs_global_percent: parseFloat(vsGlobalPercent.toFixed(2)),
      interpretation,
      emissions_per_employee: parseFloat(companyEmissionsPerEmployee.toFixed(2)),
      industry_emissions_per_employee: industryEmissionsPerEmployee,
      emissions_per_revenue: parseFloat(companyEmissionsPerRevenue.toFixed(2)),
      industry_emissions_per_revenue: industryEmissionsPerRevenue,
      recommendations,
      location_context: {
        country: countryData.country_iso3 || country,
        country_total_emissions: countryData.total_emissions_mtco2e,
        user_percentage_of_country: parseFloat(userPercentageOfCountry.toFixed(8)),
      },
    };

    return NextResponse.json({
      success: true,
      comparison,
      benchmark_details: {
        sector: companyData.sector,
        country,
        data_source: 'Climate TRACE + Industry Benchmarks',
        last_updated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Benchmark comparison error:', error);
    return NextResponse.json(
      { 
        error: 'Comparison failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}