// Industry Benchmarks API Route - Climate TRACE + WikiRate Integration
import { NextRequest, NextResponse } from "next/server";
import { ClimateTraceClient } from "@/lib/api-clients/climate-trace";
import { WikiRateClient } from "@/lib/api-clients/wikirate";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sector = searchParams.get("sector") || "manufacturing";
    const country = searchParams.get("country") || "USA";
    const companyName = searchParams.get("companyName");
    const companyEmissions = Number(searchParams.get("companyEmissions")) || 0;

    const response: any = {
      sector,
      country,
      timestamp: new Date().toISOString(),
      sectorBenchmarks: null,
      countryEmissions: null,
      peerComparison: null,
      industryAverages: null,
    };

    // Get Climate TRACE data
    const climateTraceClient = new ClimateTraceClient();

    try {
      // Get country-level emissions data
      const countryData = await climateTraceClient.getCountryEmissions(country);
      response.countryEmissions = {
        country: countryData.country_iso3 || country,
        totalEmissions: countryData.total_emissions_mtco2e || 0,
        sectors: countryData.sectors || [],
      };

      // Get sector-specific data
      const sectorData = await climateTraceClient.getSectorEmissions(sector);
      response.sectorBenchmarks = {
        sector,
        globalAverage: sectorData.global_average_intensity || 500,
        unit: sectorData.unit || "kgCO2e per unit",
        year: sectorData.year || 2022,
      };

      // Calculate percentile if company emissions provided
      if (companyEmissions > 0) {
        // Mock benchmark distribution for now
        const benchmarkDistribution = [
          100, 250, 400, 500, 650, 800, 1000, 1200, 1500, 2000,
        ];
        const percentile = climateTraceClient.calculatePercentile(
          companyEmissions,
          benchmarkDistribution
        );

        response.peerComparison = {
          companyEmissions,
          percentile: percentile.toFixed(1),
          interpretation:
            percentile < 25
              ? "Top performer"
              : percentile < 50
              ? "Above average"
              : percentile < 75
              ? "Average"
              : "Below average",
          benchmarkAverage: 650,
          differenceFromAverage: ((companyEmissions - 650) / 650) * 100,
        };
      }
    } catch (error: any) {
      console.error("Climate TRACE error:", error.message);
      response.sectorBenchmarks = {
        error: "Using fallback data",
        sector,
        globalAverage: 500,
        unit: "kgCO2e per unit",
      };
    }

    // Get WikiRate ESG data if company name provided
    if (companyName) {
      try {
        const wikiRateClient = new WikiRateClient();
        const companies = await wikiRateClient.searchCompany(companyName);

        if (companies.length > 0) {
          const companyId = companies[0].id || companies[0].name;
          const metrics = await wikiRateClient.getCompanyMetrics(companyId);

          response.industryAverages = {
            companyName: companies[0].name,
            metrics: metrics.metrics,
            lastUpdated: new Date().toISOString(),
          };
        }
      } catch (error: any) {
        console.error("WikiRate error:", error.message);
        response.industryAverages = {
          error: "Unable to fetch peer ESG data",
        };
      }
    }

    // Add industry-specific insights
    response.insights = generateIndustryInsights(
      sector,
      response.peerComparison?.percentile
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Industry benchmarks API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch industry benchmarks",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

function generateIndustryInsights(
  sector: string,
  percentile?: string
): string[] {
  const insights: string[] = [];

  if (percentile) {
    const p = parseFloat(percentile);
    if (p < 25) {
      insights.push(
        `Your ${sector} operations are in the top 25% for sustainability performance.`
      );
      insights.push(
        "Consider sharing your best practices with industry peers."
      );
    } else if (p > 75) {
      insights.push(
        `There's significant opportunity to improve your ${sector} sustainability metrics.`
      );
      insights.push(
        "Focus on energy efficiency and renewable energy adoption."
      );
    }
  }

  insights.push(
    `The ${sector} sector average carbon intensity is trending downward by 3-5% annually.`
  );
  insights.push(
    "Implementing circular economy principles can reduce emissions by 20-30%."
  );

  return insights;
}
