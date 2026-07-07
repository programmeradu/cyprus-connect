// Types for Climatiq API
export interface ClimatiaqEstimateRequest {
  emission_factor: {
    activity_id: string;
    region?: string;
    year?: number;
    data_version?: string;
  };
  parameters: Record<string, number | string>;
}

export interface ConstituentGases {
  co2e_total: number | null;
  co2e_other: number | null;
  co2?: number | null;
  ch4?: number | null;
  n2o?: number | null;
}

export interface EmissionFactor {
  uuid: string;
  activity_id: string;
  name: string;
  category: string;
  unit_type: string;
  source: string;
  region: string;
  year: number;
}

export interface ClimatiaqEstimateResponse {
  co2e: number;
  co2e_unit: string;
  co2e_calculation_method: "ar4" | "ar5" | "ar6";
  co2e_calculation_origin: "source" | "climatiq";
  emission_factor: EmissionFactor | null;
  constituent_gases: ConstituentGases | null;
}

export interface SearchResponse {
  results: Array<{
    id: string;
    activity_id: string;
    name: string;
    category: string;
    sector: string;
    unit_type: string;
    region: string;
    year: number;
  }>;
  pagination: {
    limit: number;
    offset: number;
  };
}

// Helper function for API calls
export async function callClimatiaqAPI<T>(
  endpoint: string,
  method: string = "GET",
  body?: object
): Promise<T> {
  const apiKey = process.env.CLIMATIQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("CLIMATIQ_API_KEY not configured");
  }

  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept-Encoding": "gzip",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(
    `https://api.climatiq.io/data/v1${endpoint}`,
    options
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Climatiq API error: ${response.status} - ${error.message || JSON.stringify(error)}`
    );
  }

  return response.json() as Promise<T>;
}
