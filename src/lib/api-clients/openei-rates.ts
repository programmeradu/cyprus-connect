// OpenEI Utility Rates API Client - US Electricity Rates
import axios, { type AxiosInstance } from "axios";

const OPENEI_BASE = "https://api.openei.org";

export interface UtilityRate {
  label: string;
  utility: string;
  name: string;
  sector: string;
  description: string;
  source: string;
  uri: string;
  startdate: number;
  enddate: number | null;
  country: string;
  state?: string;
  zipcode?: string;
  eiaid?: number;
  energyratestructure?: Array<{
    rate: number;
    unit: string;
  }>;
}

export class OpenEIClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: OPENEI_BASE,
      timeout: 15000,
    });
  }

  /**
   * Get utility rates by ZIP code
   */
  async getRatesByZip(
    zipCode: string,
    sector: "residential" | "commercial" | "industrial" = "commercial"
  ): Promise<UtilityRate[]> {
    try {
      const response = await this.client.get("/utility_rates", {
        params: {
          version: "latest",
          format: "json",
          api_key: this.apiKey,
          address: zipCode,
          sector,
          limit: 50,
        },
      });

      return response.data.items || [];
    } catch (error: any) {
      throw new Error(`OpenEI API error: ${error.message}`);
    }
  }

  /**
   * Get rates for specific utility
   */
  async getRatesByUtility(utilityName: string): Promise<UtilityRate[]> {
    try {
      const response = await this.client.get("/utility_rates", {
        params: {
          version: "latest",
          format: "json",
          api_key: this.apiKey,
          ratesforutility: utilityName,
          limit: 100,
        },
      });

      return response.data.items || [];
    } catch (error: any) {
      throw new Error(`OpenEI utility rates error: ${error.message}`);
    }
  }

  /**
   * Calculate average rate from rate structure
   */
  calculateAverageRate(rate: UtilityRate): number {
    if (!rate.energyratestructure || rate.energyratestructure.length === 0) {
      return 0.12; // US national average fallback
    }

    const rates = rate.energyratestructure
      .filter((r) => r.rate && r.rate > 0)
      .map((r) => r.rate);

    if (rates.length === 0) return 0.12;

    return rates.reduce((sum, r) => sum + r, 0) / rates.length;
  }

  /**
   * Estimate monthly cost based on usage
   */
  estimateMonthlyCost(
    averageRatePerKwh: number,
    monthlyUsageKwh: number
  ): {
    totalCost: number;
    energyCharges: number;
    estimatedTaxesFees: number;
  } {
    const energyCharges = averageRatePerKwh * monthlyUsageKwh;
    const estimatedTaxesFees = energyCharges * 0.15; // Typical 10-15% taxes/fees
    const totalCost = energyCharges + estimatedTaxesFees;

    return {
      totalCost,
      energyCharges,
      estimatedTaxesFees,
    };
  }
}
