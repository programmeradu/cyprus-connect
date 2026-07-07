import { NextRequest, NextResponse } from 'next/server';
import { getEnergyZoneData } from '@/lib/energy-zones';

interface CarbonIntensityResponse {
  carbonIntensity: number;
  fossilFuelPercentage: number;
  renewablePercentage: number;
  zone: string;
  datetime: string;
  fallback?: boolean;
  region?: string;
}

export async function GET(request: NextRequest) {
  const zone = request.nextUrl.searchParams.get('zone') || 'DE';
  const apiKey = process.env.ELECTRICITY_MAPS_API_KEY;
  
  // Get energy zone data with regional fallbacks
  const zoneData = getEnergyZoneData(zone);

  // If no API key or no real-time data available, return enhanced fallback
  if (!apiKey || !zoneData.hasRealTimeData) {
    return NextResponse.json({
      fallback: true,
      carbonIntensity: zoneData.fallbackCarbonIntensity,
      fossilFuelPercentage: Math.min(100, zoneData.fallbackCarbonIntensity / 8),
      renewablePercentage: Math.max(0, 100 - (zoneData.fallbackCarbonIntensity / 8)),
      zone: zoneData.zone,
      region: zoneData.region,
      datetime: new Date().toISOString(),
      note: zoneData.hasRealTimeData 
        ? 'Using fallback data - API key not configured'
        : `Using regional estimates for ${zoneData.region} - Real-time data not available for this location`
    });
  }

  try {
    const response = await fetch(
      `https://api.electricitymaps.com/v3/carbon-intensity/latest?zone=${zoneData.zone}`,
      {
        headers: { 'auth-token': apiKey },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json() as CarbonIntensityResponse;
    return NextResponse.json({
      ...data,
      region: zoneData.region,
      fallback: false
    });
  } catch (error) {
    // Return enhanced fallback data with regional context
    return NextResponse.json({
      fallback: true,
      carbonIntensity: zoneData.fallbackCarbonIntensity,
      fossilFuelPercentage: Math.min(100, zoneData.fallbackCarbonIntensity / 8),
      renewablePercentage: Math.max(0, 100 - (zoneData.fallbackCarbonIntensity / 8)),
      zone: zoneData.zone,
      region: zoneData.region,
      datetime: new Date().toISOString(),
      note: `Using regional estimates for ${zoneData.region} - API unavailable`
    });
  }
}