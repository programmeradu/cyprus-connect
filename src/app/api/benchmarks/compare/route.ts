import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ClimateTraceClient } from '@/lib/api-clients/climate-trace';
import { db } from '@/db';
import { emissions, user } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";

const log = logger("benchmarks.compare");

const SECTORS = ['retail', 'manufacturing', 'hospitality', 'technology', 'logistics', 'food-service'] as const;

const bodySchema = z.object({
  sector: z.enum(SECTORS),
  annual_emissions: z.number().finite().min(0).max(1_000_000_000),
  employees: z.number().finite().min(0).max(10_000_000),
  annual_revenue: z.number().finite().min(0).max(1_000_000_000),
  country: z.string().trim().min(1).max(100).optional(),
  userId: z.string().trim().min(1).max(100).optional(),
});

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
  const parsed = await readJson(request, bodySchema);
  if (!parsed.ok) return parsed.response;
  const companyData = parsed.data;

  try {
    const climateTraceClient = new ClimateTraceClient();

    let country = companyData.country || 'USA';
    let actualEmissions = companyData.annual_emissions;

    if (companyData.userId) {
      try {
        const userData = await db.select()
          .from(user)
          .where(eq(user.id, companyData.userId))
          .limit(1);

        if (userData.length > 0) {
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
        log.warn('Failed to fetch user data', { error: String(error) });
      }
    }

    let countryData: any;
    try {
      countryData = await climateTraceClient.getCountryEmissions(country);
    } catch (error) {
      countryData = {
        country_iso3: country,
        total_emissions_mtco2e: 5000000000,
        sectors: []
      };
    }

    const traceSector = SECTOR_MAPPING[companyData.sector.toLowerCase()] || 'manufacturing';

    let sectorEmissionsInCountry = 0;
    const sectorData = countryData.sectors?.find((s: any) =>
      s.sector.toLowerCase().includes(traceSector.toLowerCase())
    );

    if (sectorData) {
      sectorEmissionsInCountry = sectorData.emissions;
    }

    const benchmarkData = INDUSTRY_BENCHMARKS[companyData.sector.toLowerCase()] || INDUSTRY_BENCHMARKS['retail'];

    let regionalAverage = benchmarkData.emissions_avg;
    let globalAverage = regionalAverage * 1.25;
    let industryEmissionsPerEmployee = benchmarkData.emissions_per_employee;
    let industryEmissionsPerRevenue = benchmarkData.emissions_per_revenue;

    const companyEmissionsPerEmployee = companyData.employees > 0
      ? actualEmissions / companyData.employees
      : 0;
    const companyEmissionsPerRevenue = companyData.annual_revenue > 0
      ? actualEmissions / companyData.annual_revenue
      : 0;

    const vsAveragePercent = ((actualEmissions - regionalAverage) / regionalAverage) * 100;
    const vsGlobalPercent = ((actualEmissions - globalAverage) / globalAverage) * 100;

    let percentileRank = 50;
    let globalPercentileRank = 50;

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

    if (companyEmissionsPerEmployee > industryEmissionsPerEmployee * 1.2) {
      recommendations.push(`High per-employee emissions (${companyEmissionsPerEmployee.toFixed(2)} vs ${industryEmissionsPerEmployee.toFixed(2)} tCO₂e). Focus on operational efficiency`);
    }

    if (companyEmissionsPerRevenue > industryEmissionsPerRevenue * 1.2) {
      recommendations.push(`Carbon intensity per revenue is high. Optimize supply chain and logistics`);
    }

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
    const ref = log.error('Benchmark comparison error', error);
    return NextResponse.json(
      { error: 'The comparison could not be completed.', ref },
      { status: 500 }
    );
  }
}
