import { NextRequest, NextResponse } from 'next/server';
import { getEnergyZoneData } from '@/lib/energy-zones';

interface SpotPriceData {
  unix_timestamp: number;
  price: number;
  unit: string;
}

interface SpotPriceResponse {
  data: SpotPriceData[];
  metadata: {
    bzn: string;
    resolution: string;
  };
  fallback?: boolean;
  region?: string;
  note?: string;
}

export async function GET(request: NextRequest) {
  const bzn = request.nextUrl.searchParams.get('bzn') || 'DE-LU';
  const start = request.nextUrl.searchParams.get('start') || 
    new Date().toISOString().split('T')[0];

  // Extract country code from bidding zone (e.g., 'DE-LU' -> 'DE')
  const countryCode = bzn.split('-')[0];
  const zoneData = getEnergyZoneData(countryCode);

  // If no real-time data available for this region, return enhanced fallback immediately
  if (!zoneData.hasRealTimeData || !zoneData.biddingZone) {
    const fallbackData: SpotPriceResponse = {
      fallback: true,
      data: [{
        unix_timestamp: Date.now() / 1000,
        price: zoneData.fallbackSpotPrice,
        unit: 'EUR/MWh'
      }],
      metadata: {
        bzn: bzn,
        resolution: 'hour'
      },
      region: zoneData.region,
      note: `Using regional estimates for ${zoneData.region} - Real-time spot prices not available for this location`
    };

    return NextResponse.json(fallbackData);
  }

  try {
    const response = await fetch(
      `https://api.energy-charts.info/price_data?start=${start}&end=${start}&bzn=${bzn}&resolution=hour`,
      {
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`Energy-Charts API returned ${response.status}`);
    }

    const data = await response.json() as SpotPriceResponse;
    
    // Add region information to successful response
    return NextResponse.json({
      ...data,
      region: zoneData.region,
      fallback: false
    });
  } catch (error) {
    // Return enhanced fallback data with regional context
    const fallbackData: SpotPriceResponse = {
      fallback: true,
      data: [{
        unix_timestamp: Date.now() / 1000,
        price: zoneData.fallbackSpotPrice,
        unit: 'EUR/MWh'
      }],
      metadata: {
        bzn,
        resolution: 'hour'
      },
      region: zoneData.region,
      note: `Using regional estimates for ${zoneData.region} - API unavailable`
    };

    return NextResponse.json(fallbackData);
  }
}