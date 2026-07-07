// Electricity Maps API Client - Global Carbon Intensity & Renewable Energy Data
import axios, { type AxiosInstance } from "axios";

const ELECTRICITY_MAPS_BASE = "https://api.electricitymaps.com/v3";

export interface CarbonIntensityData {
  zone: string;
  carbonIntensity: number; // gCO2/kWh
  datetime: string;
  updatedAt: string;
  createdAt: string;
  emissionFactorType: string;
  isEstimated: boolean;
  estimationMethod: string | null;
  fossilFuelPercentage?: number;
  renewablePercentage?: number;
}

export interface PowerBreakdown {
  fossilFreePercentage: number;
  renewablePercentage: number;
  powerConsumptionBreakdown: {
    [key: string]: number;
  };
  powerProductionBreakdown: {
    [key: string]: number;
  };
}

export class ElectricityMapsClient {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: ELECTRICITY_MAPS_BASE,
      headers: {
        "auth-token": apiKey,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
  }

  /**
   * Get latest carbon intensity for a zone
   * @param zone Zone code (e.g., "US-CAL-CISO", "DE", "GB")
   */
  async getCarbonIntensity(zone: string): Promise<CarbonIntensityData> {
    try {
      const response = await this.client.get("/carbon-intensity/latest", {
        params: { zone },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Electricity Maps API error: ${error.message}`);
    }
  }

  /**
   * Get carbon intensity forecast (up to 72 hours ahead)
   */
  async getCarbonIntensityForecast(
    zone: string
  ): Promise<{ forecast: CarbonIntensityData[] }> {
    try {
      const response = await this.client.get("/carbon-intensity/forecast", {
        params: { zone },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Carbon intensity forecast error: ${error.message}`);
    }
  }

  /**
   * Get power breakdown (renewable %, fossil fuel %, generation mix)
   */
  async getPowerBreakdown(zone: string): Promise<PowerBreakdown> {
    try {
      const response = await this.client.get("/power-breakdown/latest", {
        params: { zone },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Power breakdown error: ${error.message}`);
    }
  }

  /**
   * Get all available zones
   */
  async getZones(): Promise<{ [key: string]: any }> {
    try {
      const response = await this.client.get("/zones");
      return response.data;
    } catch (error: any) {
      throw new Error(`Zones fetch error: ${error.message}`);
    }
  }

  /**
   * Calculate cost savings based on carbon intensity timing
   */
  calculateCostSavings(
    currentIntensity: number,
    optimalIntensity: number,
    energyUsageKwh: number,
    electricityRatePerKwh: number
  ): {
    carbonSavingsKg: number;
    costSavingsUSD: number;
    percentageReduction: number;
  } {
    const carbonSavingsKg = (currentIntensity - optimalIntensity) * energyUsageKwh / 1000;
    const percentageReduction = ((currentIntensity - optimalIntensity) / currentIntensity) * 100;
    
    // Approximate cost savings based on time-of-use pricing (typically 20-40% difference)
    const costSavingsUSD = energyUsageKwh * electricityRatePerKwh * 0.3;

    return {
      carbonSavingsKg: Math.max(0, carbonSavingsKg),
      costSavingsUSD: Math.max(0, costSavingsUSD),
      percentageReduction: Math.max(0, percentageReduction),
    };
  }
}
