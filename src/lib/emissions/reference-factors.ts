/**
 * Reference emission factors.
 *
 * These factors are used only when the Climatiq API cannot be reached. They are
 * published values, not invented numbers, and every entry records its source and
 * vintage so a report can disclose the basis of the calculation.
 *
 * Units: all factors give kilograms of CO2e per unit of activity.
 */

export type ReferenceFactor = {
  /** Stable key for the activity. */
  key: "electricity" | "gas" | "water" | "waste" | "transport";
  /** Unit of the input value. */
  unit: string;
  /** Kilograms of CO2e per input unit. */
  kgCo2ePerUnit: number;
  /** Published source of the factor. */
  source: string;
  /** Year the factor was published for. */
  vintage: string;
  /** GHG Protocol scope the activity belongs to. */
  scope: 1 | 2 | 3;
};

export const REFERENCE_FACTORS: Record<ReferenceFactor["key"], ReferenceFactor> = {
  electricity: {
    key: "electricity",
    unit: "kWh",
    kgCo2ePerUnit: 0.61,
    source: "Cyprus grid average carbon intensity (Electricity Maps / EEA)",
    vintage: "2024",
    scope: 2,
  },
  gas: {
    key: "gas",
    unit: "m3",
    // 1 m3 of natural gas is about 10.55 kWh gross calorific value.
    // 10.55 kWh x 0.20297 kg CO2e/kWh = 2.141 kg CO2e/m3.
    kgCo2ePerUnit: 2.141,
    source: "UK DEFRA GHG conversion factors, natural gas, gross CV",
    vintage: "2024",
    scope: 1,
  },
  water: {
    key: "water",
    unit: "liters",
    // 0.344 kg/m3 supply + 0.272 kg/m3 treatment = 0.616 kg/m3 = 0.000616 kg/litre.
    kgCo2ePerUnit: 0.000616,
    source: "UK DEFRA GHG conversion factors, water supply and treatment",
    vintage: "2024",
    scope: 3,
  },
  waste: {
    key: "waste",
    unit: "kg",
    kgCo2ePerUnit: 0.4467,
    source: "UK DEFRA GHG conversion factors, mixed commercial waste to landfill",
    vintage: "2024",
    scope: 3,
  },
  transport: {
    key: "transport",
    unit: "km",
    kgCo2ePerUnit: 0.16843,
    source: "UK DEFRA GHG conversion factors, average car, unknown fuel",
    vintage: "2024",
    scope: 3,
  },
};

export type ReferenceLineItem = {
  key: ReferenceFactor["key"];
  category: string;
  value: number;
  unit: string;
  /** Emissions in tonnes of CO2e. */
  emissions: number;
  factor: number;
  source: string;
  vintage: string;
  scope: 1 | 2 | 3;
};

export type ReferenceResult = {
  method: "reference-factors";
  totalTonnes: number;
  breakdown: ReferenceLineItem[];
};

export type ReferenceInput = {
  electricity: number;
  gas: number;
  water: number;
  waste: number;
  transport: number;
};

/**
 * Calculates emissions from published reference factors.
 * Labels come from the caller so the result stays translatable.
 */
export function calculateFromReferenceFactors(
  input: ReferenceInput,
  labels: Record<ReferenceFactor["key"], string>,
): ReferenceResult {
  const breakdown = (Object.keys(REFERENCE_FACTORS) as ReferenceFactor["key"][]).map((key) => {
    const factor = REFERENCE_FACTORS[key];
    const value = Number.isFinite(input[key]) ? input[key] : 0;
    return {
      key,
      category: labels[key],
      value,
      unit: factor.unit,
      // kg -> tonnes
      emissions: (value * factor.kgCo2ePerUnit) / 1000,
      factor: factor.kgCo2ePerUnit,
      source: factor.source,
      vintage: factor.vintage,
      scope: factor.scope,
    };
  });

  return {
    method: "reference-factors",
    totalTonnes: breakdown.reduce((sum, item) => sum + item.emissions, 0),
    breakdown,
  };
}

/** Distinct sources used by the line items that carry a value. */
export function usedSources(breakdown: ReferenceLineItem[]): string[] {
  return Array.from(
    new Set(breakdown.filter((item) => item.value > 0).map((item) => `${item.source} (${item.vintage})`)),
  );
}
