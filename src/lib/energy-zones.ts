/**
 * Cyprus-only electricity profile for Vuneli.
 *
 * Research anchors for the first Cyprus localization pass:
 * - Cyprus has an isolated electricity system with regulated supply tariffs.
 * - Public SME-facing calculations should use EUR, Cyprus grid context, and
 *   conservative fallback factors until an official live Cyprus feed is wired.
 * - Fallback values are transparent estimates, not audit factors.
 */

export interface EnergyZoneData {
  zone: string;
  biddingZone?: string;
  fallbackCarbonIntensity: number; // gCO₂/kWh
  fallbackSpotPrice: number; // EUR/MWh, derived from commercial kWh tariff assumptions
  region: "Cyprus";
  hasRealTimeData: boolean;
  marketModel: "regulated-island-grid";
  sourceLabel: string;
}

export const CYPRUS_ENERGY_ZONE: EnergyZoneData = {
  zone: "CY",
  biddingZone: "CY",
  fallbackCarbonIntensity: 610,
  fallbackSpotPrice: 245,
  region: "Cyprus",
  hasRealTimeData: false,
  marketModel: "regulated-island-grid",
  sourceLabel: "Cyprus grid estimate — validate against CERA/EAC data before audit use",
};

export const COUNTRY_TO_ENERGY_ZONE: Record<string, EnergyZoneData> = {
  CY: CYPRUS_ENERGY_ZONE,
};

export function getEnergyZoneData(_countryCode: string = "CY"): EnergyZoneData {
  return CYPRUS_ENERGY_ZONE;
}

export function hasRealTimeEnergyData(_countryCode: string = "CY"): boolean {
  return CYPRUS_ENERGY_ZONE.hasRealTimeData;
}

export function getCountriesByRegion(): Record<string, string[]> {
  return { Cyprus: ["CY"] };
}
