// Climate TRACE API Client - Global Emissions Benchmarking
import axios from "axios";
import { climateTraceClient as v6Client } from "@/lib/climate-trace";

const CLIMATE_TRACE_BASE = "https://api.climatetrace.org/v6";

export interface EmissionsByCountry {
  country_name: string;
  country_iso3: string;
  total_emissions: number;
  sector_breakdown: {
    sector: string;
    subsector: string;
    emissions: number;
    percentage: number;
  }[];
}

export interface SectorBenchmark {
  sector: string;
  subsector: string;
  global_average: number;
  regional_average: number;
  percentile_25: number;
  percentile_50: number;
  percentile_75: number;
  unit: string;
}

export class ClimateTraceClient {
  /**
   * Get country emissions data using v6 API
   */
  async getCountryEmissions(countryCode: string, year: number = 2022): Promise<any> {
    try {
      // Use v6 API client with correct format
      const result = await v6Client.getCountryEmissions({
        countries: [countryCode],
        since: year - 1,
        to: year,
      });

      if (result.error || !result.data || result.data.length === 0) {
        console.warn(`No Climate TRACE data for ${countryCode}, using fallback`);
        return this.getMockCountryData(countryCode);
      }

      // Aggregate emissions by sector
      const sectorMap = new Map<string, number>();
      let totalEmissions = 0;

      result.data.forEach((item: any) => {
        if (item.emissions && item.emissions.co2e_100yr) {
          totalEmissions += item.emissions.co2e_100yr;
          // Extract sector from data if available
          const sector = item.sector || "Other";
          sectorMap.set(sector, (sectorMap.get(sector) || 0) + item.emissions.co2e_100yr);
        }
      });

      const sectors = Array.from(sectorMap.entries()).map(([sector, emissions]) => ({
        sector,
        emissions,
      }));

      return {
        country_iso3: countryCode,
        total_emissions_mtco2e: totalEmissions,
        sectors,
      };
    } catch (error: any) {
      console.warn("Climate TRACE API error, using fallback data:", error.message);
      return this.getMockCountryData(countryCode);
    }
  }

  /**
   * Get sector emissions for benchmarking
   */
  async getSectorEmissions(sector: string, year: number = 2022): Promise<any> {
    try {
      const response = await axios.get(`${CLIMATE_TRACE_BASE}/sector`, {
        params: { sector, year },
        timeout: 15000,
      });
      return response.data;
    } catch (error: any) {
      console.warn("Climate TRACE sector data unavailable");
      return this.getMockSectorData(sector);
    }
  }

  /**
   * Calculate percentile ranking
   */
  calculatePercentile(
    companyEmissions: number,
    benchmarkData: number[]
  ): number {
    const sorted = benchmarkData.sort((a, b) => a - b);
    const position = sorted.findIndex((val) => val >= companyEmissions);

    if (position === -1) return 100;
    return (position / sorted.length) * 100;
  }

  /**
   * Mock data for fallback with African country data
   */
  private getMockCountryData(countryCode: string): any {
    const mockData: any = {
      USA: {
        country_iso3: "USA",
        total_emissions_mtco2e: 5000000000,
        sectors: [
          { sector: "Power", emissions: 1500000000 },
          { sector: "Manufacturing", emissions: 800000000 },
          { sector: "Transportation", emissions: 1700000000 },
          { sector: "Buildings", emissions: 600000000 },
          { sector: "Agriculture", emissions: 400000000 },
        ],
      },
      GHA: {
        country_iso3: "GHA",
        total_emissions_mtco2e: 45000000,
        sectors: [
          { sector: "Power", emissions: 12000000 },
          { sector: "Manufacturing", emissions: 8000000 },
          { sector: "Transportation", emissions: 10000000 },
          { sector: "Buildings", emissions: 5000000 },
          { sector: "Agriculture", emissions: 10000000 },
        ],
      },
      NGA: {
        country_iso3: "NGA",
        total_emissions_mtco2e: 320000000,
        sectors: [
          { sector: "Power", emissions: 95000000 },
          { sector: "Manufacturing", emissions: 65000000 },
          { sector: "Transportation", emissions: 80000000 },
          { sector: "Buildings", emissions: 30000000 },
          { sector: "Agriculture", emissions: 50000000 },
        ],
      },
      DEU: {
        country_iso3: "DEU",
        total_emissions_mtco2e: 700000000,
        sectors: [
          { sector: "Power", emissions: 250000000 },
          { sector: "Manufacturing", emissions: 150000000 },
          { sector: "Transportation", emissions: 180000000 },
          { sector: "Buildings", emissions: 90000000 },
          { sector: "Agriculture", emissions: 30000000 },
        ],
      },
    };

    return mockData[countryCode] || mockData.USA;
  }

  private getMockSectorData(sector: string): any {
    return {
      sector,
      global_average_intensity: 500,
      unit: "kgCO2e per unit",
      year: 2022,
    };
  }
}