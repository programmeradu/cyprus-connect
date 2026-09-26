import { logger } from "@/lib/log";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const latitude = searchParams.get('latitude') || '51.5074'; // Default: London
    const longitude = searchParams.get('longitude') || '-0.1278';
    
    // Open-Meteo API - No API key needed!
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Weather API request failed');
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch weather data", ref: logger("api.weather").error('request failed', error) },
      { status: 500 }
    );
  }
}
