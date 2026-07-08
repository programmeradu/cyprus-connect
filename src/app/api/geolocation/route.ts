import { NextResponse } from "next/server";
import { getUserLocationFromIP } from "@/lib/geolocation";

export async function GET() {
  try {
    const location = await getUserLocationFromIP();
    
    if (!location) {
      // VerdeIQ is Cyprus-only: always fall back to EUR / Cyprus.
      return NextResponse.json(
        { 
          currency: "EUR", 
          countryCode: "CY",
          country: "Cyprus",
          timezone: "Asia/Nicosia",
        },
        { 
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        }
      );
    }

    return NextResponse.json(location, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Geolocation API error:", error);
    return NextResponse.json(
      { 
        currency: "EUR", 
        countryCode: "CY",
        country: "Cyprus",
        timezone: "Asia/Nicosia",
      },
      { status: 200 }
    );
  }
}
