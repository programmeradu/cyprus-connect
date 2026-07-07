// IP geolocation service for currency auto-detection
// Supports ALL world countries and currencies via ipapi.co
export interface GeolocationData {
  country: string;
  countryCode: string;
  currency: string;
  city?: string;
  timezone?: string;
}

export async function getUserLocationFromIP(): Promise<GeolocationData | null> {
  try {
    // Use ipapi.co - works client-side, no API key needed (30k/month free)
    // Supports all 190+ countries and their currencies
    const response = await fetch("https://ipapi.co/json/");
    
    if (!response.ok) {
      console.error("Geolocation fetch failed:", response.statusText);
      return null;
    }
    
    const data = await response.json();

    return {
      country: data.country_name || "Unknown",
      countryCode: data.country_code || "",
      currency: data.currency || "",
      city: data.city,
      timezone: data.timezone,
    };
  } catch (error) {
    console.error("Geolocation error:", error);
    return null;
  }
}

// Fallback using country.is (simpler, faster)
export async function getUserCountryCode(): Promise<string | null> {
  try {
    const response = await fetch("https://api.country.is");
    if (!response.ok) return null;
    const { country } = await response.json();
    return country || null;
  } catch (error) {
    console.error("Country detection error:", error);
    return null;
  }
}