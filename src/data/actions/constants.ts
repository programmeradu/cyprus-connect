/**
 * Published constants used by the Action plan maths. Every value carries its
 * source and vintage. A value that has no published source is not listed:
 * the project then asks the person (or their installer) for the figure.
 */
import { REFERENCE_FACTORS } from "@/lib/emissions/reference-factors";

export interface SourcedValue {
  value: number;
  unit: string;
  source: string;
  url: string | null;
  vintage: string;
  note?: string;
}

export const ACTION_CONSTANTS = {
  /** Cyprus grid intensity, the same factor the footprint uses. */
  gridKgPerKwh: {
    value: REFERENCE_FACTORS.electricity.kgCo2ePerUnit,
    unit: "kg CO2e/kWh",
    source: REFERENCE_FACTORS.electricity.source,
    url: null,
    vintage: REFERENCE_FACTORS.electricity.vintage,
  },
  /** Water supply + treatment, per m3 (DEFRA value is per litre in the footprint). */
  waterKgPerM3: {
    value: Math.round(REFERENCE_FACTORS.water.kgCo2ePerUnit * 1000 * 1000) / 1000,
    unit: "kg CO2e/m3",
    source: REFERENCE_FACTORS.water.source,
    url: null,
    vintage: REFERENCE_FACTORS.water.vintage,
  },
  /** Diesel, average biofuel blend, per litre. */
  dieselKgPerLitre: {
    value: 2.51,
    unit: "kg CO2e/litre",
    source: "UK DEFRA GHG conversion factors, diesel (average biofuel blend)",
    url: "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting",
    vintage: "2024",
  },
  /**
   * Yearly output of a rooftop PV system in Cyprus. PVGIS gives roughly
   * 1,600–1,800 kWh per kWp for optimally tilted roofs; the low end is used
   * so savings are not overstated. Roof shade and tilt change it.
   */
  solarKwhPerKwp: {
    value: 1600,
    unit: "kWh/kWp/yr",
    source: "EU JRC PVGIS, Cyprus, crystalline silicon, 14% system losses (low end of the range)",
    url: "https://re.jrc.ec.europa.eu/pvg_tools/en/",
    vintage: "2024",
    note: "Estimate. Your installer's yield figure replaces it.",
  },
} satisfies Record<string, SourcedValue>;
