// Cyprus-only location profile. Vuneli is now localized for Cyprus SMEs.
export interface GeolocationData {
  country: string;
  countryCode: string;
  currency: string;
  city?: string;
  timezone?: string;
}

export async function getUserLocationFromIP(): Promise<GeolocationData | null> {
  return {
    country: "Cyprus",
    countryCode: "CY",
    currency: "EUR",
    timezone: "Asia/Nicosia",
  };
}

export async function getUserCountryCode(): Promise<string | null> {
  return "CY";
}