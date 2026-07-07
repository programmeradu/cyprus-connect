/**
 * Climate TRACE API v6 Client
 * Free, open-access global emissions data (2.7M sources, 744M+ assets)
 * Comprehensive African coverage for all 54+ countries
 * No API key required - public data with CC BY 4.0 licensing
 * Updated to v6 API: https://api.climatetrace.org
 */

const CLIMATE_TRACE_BASE_URL = "https://api.climatetrace.org";

export interface ClimateTraceEmission {
  AssetCount: number;
  Emissions: number;
  Gas: string;
  Country?: string;
}

export interface ClimateTraceAsset {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: {
    id: string;
    name?: string;
    country?: string;
    sector?: string;
    subsector?: string;
    [key: string]: any;
  };
  emissions?: Array<{
    gas: string;
    quantity: number;
    factor: number;
    capacity: number;
    activity: number;
    activityUnits: string;
    emissionsFactor: string;
    remainder: number;
  }>;
}

export interface CountryEmission {
  country: string;
  continent: string;
  rank?: number;
  previousRank?: number;
  assetCount?: number | null;
  emissions: {
    co2?: number;
    ch4?: number;
    n2o?: number;
    co2e_100yr?: number;
    co2e_20yr?: number;
    [key: string]: number | undefined;
  };
  worldEmissions?: {
    co2?: number;
    ch4?: number;
    n2o?: number;
    co2e_100yr?: number;
    co2e_20yr?: number;
    [key: string]: number | undefined;
  };
  emissionsChange?: {
    co2?: number;
    ch4?: number;
    n2o?: number;
    co2e_100yr?: number;
    co2e_20yr?: number;
    [key: string]: number | undefined;
  };
}

export interface AdminArea {
  id: string;
  description: string;
  link?: string;
}

export class ClimateTraceClient {
  private timeout: number;

  constructor(timeout: number = 30000) {
    this.timeout = timeout;
  }

  /**
   * Search emissions sources (v6)
   * Returns asset-level emissions with geographic data
   */
  async searchAssets(params: {
    countries?: string[];
    sectors?: string[];
    subsectors?: string[];
    continents?: string[];
    groups?: string[];
    adminId?: number;
    year?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ClimateTraceAsset[]; error?: string }> {
    const queryParams = new URLSearchParams({
      limit: String(params.limit || 100),
      offset: String(params.offset || 0),
      year: String(params.year || 2022),
    });

    if (params.countries?.length) queryParams.append("countries", params.countries.join(","));
    if (params.sectors?.length) queryParams.append("sectors", params.sectors.join(","));
    if (params.subsectors?.length) queryParams.append("subsectors", params.subsectors.join(","));
    if (params.continents?.length) queryParams.append("continents", params.continents.join(","));
    if (params.groups?.length) queryParams.append("groups", params.groups.join(","));
    if (params.adminId) queryParams.append("adminId", String(params.adminId));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${CLIMATE_TRACE_BASE_URL}/v6/assets?${queryParams}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Climate TRACE API error: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error("Climate TRACE API error:", error);
      return {
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get details on a single emissions source
   */
  async getAssetById(sourceId: number): Promise<{ data: ClimateTraceAsset[]; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${CLIMATE_TRACE_BASE_URL}/v6/assets/${sourceId}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Climate TRACE API error: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error("Climate TRACE API error:", error);
      return {
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Filter and summarize source emissions (v6)
   * Groups emissions by country or continent
   */
  async getAssetEmissions(params: {
    countries?: string[];
    sectors?: string[];
    subsectors?: string[];
    continents?: string[];
    groups?: string[];
    adminId?: number;
    years?: number[];
    gas?: string;
  }): Promise<{ data: ClimateTraceEmission[]; error?: string }> {
    const queryParams = new URLSearchParams();

    if (params.countries?.length) queryParams.append("countries", params.countries.join(","));
    if (params.sectors?.length) queryParams.append("sectors", params.sectors.join(","));
    if (params.subsectors?.length) queryParams.append("subsectors", params.subsectors.join(","));
    if (params.continents?.length) queryParams.append("continents", params.continents.join(","));
    if (params.groups?.length) queryParams.append("groups", params.groups.join(","));
    if (params.adminId) queryParams.append("adminId", String(params.adminId));
    if (params.years?.length) queryParams.append("years", params.years.join(","));
    if (params.gas) queryParams.append("gas", params.gas);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${CLIMATE_TRACE_BASE_URL}/v6/assets/emissions?${queryParams}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Climate TRACE API error: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error("Climate TRACE API error:", error);
      return {
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get country-level emissions aggregated by sector/subsector (v6)
   */
  async getCountryEmissions(params: {
    countries?: string[];
    continents?: string[];
    groups?: string[];
    sector?: string[];
    subsectors?: string[];
    since?: number;
    to?: number;
  }): Promise<{ data: CountryEmission[]; error?: string }> {
    const queryParams = new URLSearchParams({
      since: String(params.since || 2015),
      to: String(params.to || 2022),
    });

    if (params.countries?.length) queryParams.append("countries", params.countries.join(","));
    if (params.continents?.length) queryParams.append("continents", params.continents.join(","));
    if (params.groups?.length) queryParams.append("groups", params.groups.join(","));
    if (params.sector?.length) queryParams.append("sector", params.sector.join(","));
    if (params.subsectors?.length) queryParams.append("subsectors", params.subsectors.join(","));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${CLIMATE_TRACE_BASE_URL}/v6/country/emissions?${queryParams}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Climate TRACE API error: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error("Climate TRACE API error:", error);
      return {
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Search for administrative areas
   */
  async searchAdminAreas(params: {
    name?: string;
    level?: number;
    point?: number[];
    bbox?: number[];
    limit?: number;
    offset?: number;
  }): Promise<{ data: AdminArea[]; error?: string }> {
    const queryParams = new URLSearchParams({
      limit: String(params.limit || 100),
      offset: String(params.offset || 0),
    });

    if (params.name) queryParams.append("name", params.name);
    if (params.level !== undefined) queryParams.append("level", String(params.level));
    if (params.point?.length === 2) queryParams.append("point", params.point.join(","));
    if (params.bbox?.length === 4) queryParams.append("bbox", params.bbox.join(","));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${CLIMATE_TRACE_BASE_URL}/v6/admins/search?${queryParams}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Climate TRACE API error: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error("Climate TRACE API error:", error);
      return {
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get administrative area GeoJSON
   */
  async getAdminGeoJSON(adminId: string | number): Promise<{ data: any; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${CLIMATE_TRACE_BASE_URL}/v6/admins/${adminId}/geojson`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Climate TRACE API error: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("Climate TRACE API error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get sector definitions
   */
  async getSectors(): Promise<{ data: Record<string, number>; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${CLIMATE_TRACE_BASE_URL}/v6/definitions/sectors`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Climate TRACE API error: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("Climate TRACE API error:", error);
      return {
        data: {},
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get subsector definitions
   */
  async getSubsectors(): Promise<{ data: string[]; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${CLIMATE_TRACE_BASE_URL}/v6/definitions/subsectors`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Climate TRACE API error: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error("Climate TRACE API error:", error);
      return {
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get country definitions
   */
  async getCountries(): Promise<{ data: Array<{ Name: string; Code: string }>; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${CLIMATE_TRACE_BASE_URL}/v6/definitions/countries`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Climate TRACE API error: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error("Climate TRACE API error:", error);
      return {
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get country group definitions (EU, G77, etc.)
   */
  async getGroups(): Promise<{ data: Record<string, any>; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${CLIMATE_TRACE_BASE_URL}/v6/definitions/groups`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Climate TRACE API error: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("Climate TRACE API error:", error);
      return {
        data: {},
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get continent definitions
   */
  async getContinents(): Promise<{ data: string[]; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${CLIMATE_TRACE_BASE_URL}/v6/definitions/continents`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Climate TRACE API error: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error("Climate TRACE API error:", error);
      return {
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get gas definitions
   */
  async getGases(): Promise<{ data: string[]; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(
        `${CLIMATE_TRACE_BASE_URL}/v6/definitions/gases`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Climate TRACE API error: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) ? data : [] };
    } catch (error) {
      console.error("Climate TRACE API error:", error);
      return {
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get total emissions for a country in a specific year range
   */
  async getCountryTotal(
    countryIso: string,
    since: number = 2015,
    to: number = 2022
  ): Promise<{ total: number; breakdown: Record<string, number>; error?: string }> {
    const { data, error } = await this.getCountryEmissions({
      countries: [countryIso],
      since,
      to,
    });

    if (error || !data || data.length === 0) {
      return { total: 0, breakdown: {}, error: error || "No data available" };
    }

    const breakdown: Record<string, number> = {};
    let total = 0;

    data.forEach((emission) => {
      if (emission.emissions && emission.emissions.co2e_100yr) {
        const countryName = emission.country || countryIso;
        breakdown[countryName] = (breakdown[countryName] || 0) + emission.emissions.co2e_100yr;
        total += emission.emissions.co2e_100yr;
      }
    });

    return { total, breakdown };
  }
}

// Singleton instance
export const climateTraceClient = new ClimateTraceClient();

/**
 * African country ISO codes for easy reference (All 54 countries)
 */
export const AFRICAN_COUNTRIES = {
  DZA: "Algeria",
  AGO: "Angola",
  BEN: "Benin",
  BWA: "Botswana",
  BFA: "Burkina Faso",
  BDI: "Burundi",
  CMR: "Cameroon",
  CPV: "Cape Verde",
  CAF: "Central African Republic",
  TCD: "Chad",
  COM: "Comoros",
  COG: "Congo",
  COD: "Democratic Republic of Congo",
  CIV: "Ivory Coast",
  DJI: "Djibouti",
  EGY: "Egypt",
  GNQ: "Equatorial Guinea",
  ERI: "Eritrea",
  SWZ: "Eswatini",
  ETH: "Ethiopia",
  GAB: "Gabon",
  GMB: "Gambia",
  GHA: "Ghana",
  GIN: "Guinea",
  GNB: "Guinea-Bissau",
  KEN: "Kenya",
  LSO: "Lesotho",
  LBR: "Liberia",
  LBY: "Libya",
  MDG: "Madagascar",
  MWI: "Malawi",
  MLI: "Mali",
  MRT: "Mauritania",
  MUS: "Mauritius",
  MAR: "Morocco",
  MOZ: "Mozambique",
  NAM: "Namibia",
  NER: "Niger",
  NGA: "Nigeria",
  RWA: "Rwanda",
  STP: "São Tomé and Príncipe",
  SEN: "Senegal",
  SYC: "Seychelles",
  SLE: "Sierra Leone",
  SOM: "Somalia",
  ZAF: "South Africa",
  SSD: "South Sudan",
  SDN: "Sudan",
  TZA: "Tanzania",
  TGO: "Togo",
  TUN: "Tunisia",
  UGA: "Uganda",
  ZMB: "Zambia",
  ZWE: "Zimbabwe",
};