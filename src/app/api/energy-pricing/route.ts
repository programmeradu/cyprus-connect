// Energy Pricing API Route - Multi-Provider Carbon Intensity + OpenEI Integration
import { NextRequest, NextResponse } from "next/server";
import { CarbonIntensityClient } from "@/lib/api-clients/carbon-intensity";
import { OpenEIClient } from "@/lib/api-clients/openei-rates";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const zone = searchParams.get("zone") || "US-CAL-CISO";
    const zipCode = searchParams.get("zipCode");
    const energyUsageKwh = Number(searchParams.get("energyUsageKwh")) || 1000;

    // Initialize API clients
    const carbonClient = new CarbonIntensityClient();
    const openeiKey = process.env.OPENEI_API_KEY;

    const response: any = {
      zone,
      timestamp: new Date().toISOString(),
      carbonIntensity: null,
      powerBreakdown: null,
      utilityRates: null,
      costSavings: null,
      forecast: null,
    };

    // Get carbon intensity data for the requested zone (Cyprus + EU/EEA scope).
    try {
      // Get current carbon intensity
      const carbonData = await carbonClient.getCarbonIntensity(zone);
      response.carbonIntensity = {
        current: carbonData.carbonIntensity,
        datetime: carbonData.datetime,
        isEstimated: carbonData.isEstimated,
        estimationMethod: carbonData.estimationMethod,
        fossilFuelPercentage: carbonData.fossilFuelPercentage,
        renewablePercentage: carbonData.renewablePercentage,
      };

      // Get power breakdown
      const powerData = await carbonClient.getPowerBreakdown(zone);
      response.powerBreakdown = {
        fossilFreePercentage: powerData.fossilFreePercentage,
        renewablePercentage: powerData.renewablePercentage,
        breakdown: powerData.powerConsumptionBreakdown,
      };

      // Get forecast
      const forecastData = await carbonClient.getCarbonIntensityForecast(zone);
      response.forecast = forecastData.forecast?.slice(0, 24).map((f: any) => ({
        datetime: f.datetime,
        carbonIntensity: f.carbonIntensity,
      }));

      // Calculate optimal timing
      if (response.forecast && response.forecast.length > 0) {
        const optimalTime = response.forecast.reduce((min: any, curr: any) =>
          curr.carbonIntensity < min.carbonIntensity ? curr : min
        );

        const averageRate = 0.15; // USD per kWh (US average)
        const savings = carbonClient.calculateCostSavings(
          carbonData.carbonIntensity,
          optimalTime.carbonIntensity,
          energyUsageKwh,
          averageRate
        );

        response.costSavings = {
          ...savings,
          optimalTime: optimalTime.datetime,
          recommendation: `Shift energy usage to ${new Date(optimalTime.datetime).toLocaleTimeString()} to save ${savings.carbonSavingsKg.toFixed(2)} kg CO2 and potentially $${savings.costSavingsUSD.toFixed(2)}`,
        };
      }
    } catch (error: any) {
      console.error("Carbon intensity API error:", error.message);
      response.carbonIntensity = {
        error: "Unable to fetch carbon intensity data",
        message: error.message,
      };
    }

    // Get utility rates if ZIP code provided
    if (openeiKey && zipCode) {
      try {
        const openeiClient = new OpenEIClient(openeiKey);
        const rates = await openeiClient.getRatesByZip(zipCode, "commercial");

        if (rates.length > 0) {
          const primaryRate = rates[0];
          const averageRate = openeiClient.calculateAverageRate(primaryRate);
          const monthlyCost = openeiClient.estimateMonthlyCost(
            averageRate,
            energyUsageKwh
          );

          response.utilityRates = {
            utility: primaryRate.utility,
            rateName: primaryRate.name,
            averageRatePerKwh: averageRate,
            monthlyCost,
            effectiveDate: primaryRate.startdate
              ? new Date(primaryRate.startdate * 1000).toLocaleDateString()
              : null,
          };
        }
      } catch (error: any) {
        console.error("OpenEI API error:", error.message);
        response.utilityRates = {
          error: "Unable to fetch utility rates",
          message: error.message,
        };
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Energy pricing API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch energy pricing data", details: error.message },
      { status: 500 }
    );
  }
}