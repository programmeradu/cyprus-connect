/**
 * Vuneli Canonical Emission Factor Registry.
 *
 * Single Source of Truth for all carbon accounting calculations across:
 * - EAC electricity bill reader & in-app Scope 2 accounting
 * - Water Board bill reader & Scope 3 water accounting
 * - Public GHG Calculator and country benchmark pages
 * - VSME, CSRD, and CBAM report generation engines
 * - Verde AI Copilot & automated compliance agents
 *
 * Every factor records its exact provenance: authority, vintage, standard unit,
 * GHG Protocol scope, accounting method, and statutory source citation.
 */

export interface EmissionFactorMetadata {
  /** Canonical identifier */
  id: string;
  /** Activity category */
  category: "electricity" | "fuel" | "water" | "travel" | "waste" | "spend";
  /** Country or regional jurisdiction (ISO 3166-1 alpha-2 or standard code) */
  region: string;
  /** Human-readable label in English */
  nameEn: string;
  /** Human-readable label in Greek */
  nameEl: string;
  /** Activity input unit */
  unit: string;
  /** Factor in kg CO2e per input unit */
  kgCo2ePerUnit: number;
  /** GHG Protocol Scope (1 = Direct, 2 = Purchased Energy, 3 = Value Chain) */
  scope: 1 | 2 | 3;
  /** Calculation method */
  method: "location-based" | "market-based" | "direct" | "lifecycle" | "spend-based";
  /** Official publishing authority / statutory source */
  sourceAuthority: string;
  /** Publication or inventory vintage year */
  vintage: string;
  /** Direct link to statutory documentation or dataset */
  sourceUrl: string;
  /** Methodology notes */
  notes?: string;
}

/**
 * Authoritative Location-based Grid Electricity Factors (kg CO2e / kWh).
 * Official source: European Environment Agency (EEA) Greenhouse Gas Emission Intensity of Electricity Generation
 * and National Inventory Submissions (UNFCCC).
 */
export const LOCATION_BASED_GRID_FACTORS: Record<string, number> = {
  CY: 0.622, // Cyprus: Isolated island grid generation mix (EEA / UNFCCC National Inventory submission)
  EU27: 0.253, // EU-27 average grid mix
  GR: 0.371, // Greece
  DE: 0.381, // Germany
  FR: 0.056, // France (high nuclear / hydro share)
  ES: 0.174, // Spain
  IT: 0.257, // Italy
  NL: 0.328, // Netherlands
  IE: 0.296, // Ireland
  PT: 0.158, // Portugal
  BE: 0.148, // Belgium
  AT: 0.114, // Austria
  SE: 0.008, // Sweden (hydro / nuclear)
  FI: 0.079, // Finland
  PL: 0.657, // Poland (coal-intensive)
  UK: 0.207, // United Kingdom
} as const;

/**
 * Complete Canonical Emission Factor Registry.
 */
export const FACTOR_REGISTRY: Record<string, EmissionFactorMetadata> = {
  // ── Electricity: Cyprus ───────────────────────────────────────────────────
  "electricity-grid-cy-location": {
    id: "electricity-grid-cy-location",
    category: "electricity",
    region: "CY",
    nameEn: "Cyprus Electricity Grid Mix (Location-based)",
    nameEl: "Μίγμα Ηλεκτρικού Δικτύου Κύπρου (Βάσει τοποθεσίας)",
    unit: "kWh",
    kgCo2ePerUnit: 0.622,
    scope: 2,
    method: "location-based",
    sourceAuthority: "European Environment Agency (EEA) / UNFCCC Cyprus National Inventory",
    vintage: "2024",
    sourceUrl: "https://www.eea.europa.eu/en/analysis/indicators/greenhouse-gas-emission-intensity-of-1",
    notes: "Reflects the official verified national electricity generation carbon intensity for Cyprus (isolated grid).",
  },
  "electricity-grid-cy-market": {
    id: "electricity-grid-cy-market",
    category: "electricity",
    region: "CY",
    nameEn: "Cyprus Residual Mix (Market-based)",
    nameEl: "Υπολειπόμενο Μίγμα Κύπρου (Βάσει αγοράς)",
    unit: "kWh",
    kgCo2ePerUnit: 0.622,
    scope: 2,
    method: "market-based",
    sourceAuthority: "Association of Issuing Bodies (AIB) European Residual Mix",
    vintage: "2024",
    sourceUrl: "https://www.aib-net.org/facts/european-residual-mix",
    notes: "Because Cyprus operates as an isolated grid with negligible guarantees of origin export, residual mix mirrors national production mix.",
  },

  // ── Fuels (Scope 1 Direct Combustion) ────────────────────────────────────
  "fuel-diesel-litre": {
    id: "fuel-diesel-litre",
    category: "fuel",
    region: "CY",
    nameEn: "Commercial Diesel (Fleet & Stationary)",
    nameEl: "Πετρέλαιο Κίνησης / Ντίζελ",
    unit: "L",
    kgCo2ePerUnit: 2.51,
    scope: 1,
    method: "direct",
    sourceAuthority: "UK DESNZ / DEFRA Greenhouse Gas Conversion Factors",
    vintage: "2024",
    sourceUrl: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
    notes: "Commercial diesel standard blend.",
  },
  "fuel-petrol-litre": {
    id: "fuel-petrol-litre",
    category: "fuel",
    region: "CY",
    nameEn: "Petrol / Gasoline",
    nameEl: "Βενζίνη",
    unit: "L",
    kgCo2ePerUnit: 2.31,
    scope: 1,
    method: "direct",
    sourceAuthority: "UK DESNZ / DEFRA Greenhouse Gas Conversion Factors",
    vintage: "2024",
    sourceUrl: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
  },
  "fuel-natural-gas-kwh": {
    id: "fuel-natural-gas-kwh",
    category: "fuel",
    region: "CY",
    nameEn: "Natural Gas (Gross CV)",
    nameEl: "Φυσικό Αέριο (Ανώτερη Θερμογόνος Δύναμη)",
    unit: "kWh",
    kgCo2ePerUnit: 0.184,
    scope: 1,
    method: "direct",
    sourceAuthority: "UK DESNZ / DEFRA Greenhouse Gas Conversion Factors",
    vintage: "2024",
    sourceUrl: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
  },
  "fuel-natural-gas-m3": {
    id: "fuel-natural-gas-m3",
    category: "fuel",
    region: "CY",
    nameEn: "Natural Gas (Volume)",
    nameEl: "Φυσικό Αέριο (Όγκος m³)",
    unit: "m3",
    // 1 m3 natural gas ≈ 10.55 kWh gross CV * 0.184 kg CO2e/kWh ≈ 1.941 kg CO2e/m3 (or 2.0297 on net/gross blend)
    kgCo2ePerUnit: 1.941,
    scope: 1,
    method: "direct",
    sourceAuthority: "UK DESNZ / DEFRA Greenhouse Gas Conversion Factors (10.55 kWh/m³)",
    vintage: "2024",
    sourceUrl: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
  },
  "fuel-lpg-kg": {
    id: "fuel-lpg-kg",
    category: "fuel",
    region: "CY",
    nameEn: "Liquefied Petroleum Gas (LPG)",
    nameEl: "Υγραέριο (LPG)",
    unit: "kg",
    kgCo2ePerUnit: 2.94,
    scope: 1,
    method: "direct",
    sourceAuthority: "UK DESNZ / DEFRA Greenhouse Gas Conversion Factors",
    vintage: "2024",
    sourceUrl: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
  },

  // ── Water (Scope 3 Purchased Goods & Services / Lifecycle) ─────────────────
  "water-lifecycle-m3": {
    id: "water-lifecycle-m3",
    category: "water",
    region: "CY",
    nameEn: "Mains Water Supply + Wastewater Treatment",
    nameEl: "Ύδρευση & Επεξεργασία Λυμάτων",
    unit: "m3",
    // Supply 0.344 + Wastewater treatment 0.272 = 0.616 kg CO2e/m3
    kgCo2ePerUnit: 0.616,
    scope: 3,
    method: "lifecycle",
    sourceAuthority: "Water Development Department (WDD) / DEFRA Water Supply and Wastewater Treatment",
    vintage: "2024",
    sourceUrl: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
    notes: "Total lifecycle water footprint combining mains supply (0.344 kg/m³) and wastewater treatment (0.272 kg/m³).",
  },
  "water-lifecycle-liter": {
    id: "water-lifecycle-liter",
    category: "water",
    region: "CY",
    nameEn: "Mains Water Supply + Wastewater Treatment (per Litre)",
    nameEl: "Ύδρευση & Επεξεργασία Λυμάτων (ανά Λίτρο)",
    unit: "liters",
    kgCo2ePerUnit: 0.000616, // 0.616 kg / 1000 litres
    scope: 3,
    method: "lifecycle",
    sourceAuthority: "Water Development Department (WDD) / DEFRA Water Supply and Wastewater Treatment",
    vintage: "2024",
    sourceUrl: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
  },

  // ── Waste (Scope 3) ───────────────────────────────────────────────────────
  "waste-landfill-kg": {
    id: "waste-landfill-kg",
    category: "waste",
    region: "CY",
    nameEn: "Commercial Mixed Waste to Landfill",
    nameEl: "Μικτά Εμπορικά Απόβλητα σε ΧΥΤΥ",
    unit: "kg",
    kgCo2ePerUnit: 0.4467,
    scope: 3,
    method: "lifecycle",
    sourceAuthority: "UK DEFRA GHG Conversion Factors, Mixed Commercial Waste",
    vintage: "2024",
    sourceUrl: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
  },

  // ── Travel & Transport (Scope 3) ──────────────────────────────────────────
  "travel-car-km": {
    id: "travel-car-km",
    category: "travel",
    region: "CY",
    nameEn: "Passenger Car (Average / Unknown Fuel)",
    nameEl: "Επιβατικό Αυτοκίνητο (Μέσος όρος)",
    unit: "km",
    kgCo2ePerUnit: 0.170,
    scope: 3,
    method: "lifecycle",
    sourceAuthority: "UK DEFRA GHG Conversion Factors, Average Passenger Car (Well-to-Wheel)",
    vintage: "2024",
    sourceUrl: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
  },
  "travel-flight-shorthaul-km": {
    id: "travel-flight-shorthaul-km",
    category: "travel",
    region: "CY",
    nameEn: "Short-haul Flight (Economy, incl. RF)",
    nameEl: "Πτήση Κοντινής Απόστασης (Οικονομική, με RF)",
    unit: "km",
    kgCo2ePerUnit: 0.246,
    scope: 3,
    method: "lifecycle",
    sourceAuthority: "UK DEFRA GHG Conversion Factors, Short-haul with Radiative Forcing",
    vintage: "2024",
    sourceUrl: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
  },
  "travel-flight-longhaul-km": {
    id: "travel-flight-longhaul-km",
    category: "travel",
    region: "CY",
    nameEn: "Long-haul Flight (Economy, incl. RF)",
    nameEl: "Πτήση Μεγάλης Απόστασης (Οικονομική, με RF)",
    unit: "km",
    kgCo2ePerUnit: 0.195,
    scope: 3,
    method: "lifecycle",
    sourceAuthority: "UK DEFRA GHG Conversion Factors, Long-haul with Radiative Forcing",
    vintage: "2024",
    sourceUrl: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
  },
  "travel-commute-km": {
    id: "travel-commute-km",
    category: "travel",
    region: "CY",
    nameEn: "Employee Commuting (Mixed-mode Proxy)",
    nameEl: "Μετακίνηση Εργαζομένων (Μικτό μέσο)",
    unit: "km",
    kgCo2ePerUnit: 0.140,
    scope: 3,
    method: "lifecycle",
    sourceAuthority: "UK DEFRA GHG Conversion Factors, Mixed Commute",
    vintage: "2024",
    sourceUrl: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
  },

  // ── Spend-based Screening (Scope 3) ───────────────────────────────────────
  "spend-screening-eur": {
    id: "spend-screening-eur",
    category: "spend",
    region: "EU",
    nameEn: "General Procurement Spend Screening",
    nameEl: "Εκτίμηση Εκπομπών Προμηθειών ανά Ευρώ",
    unit: "EUR",
    kgCo2ePerUnit: 0.35,
    scope: 3,
    method: "spend-based",
    sourceAuthority: "EEIO High-level Procurement Screening Average",
    vintage: "2024",
    sourceUrl: "https://eiolca.net/",
  },
} as const;

/**
 * Standard constants directly exported for top-level usage.
 */
export const OFFICIAL_CYPRUS_GRID_FACTOR = FACTOR_REGISTRY["electricity-grid-cy-location"].kgCo2ePerUnit; // 0.622
export const OFFICIAL_CYPRUS_WATER_FACTOR = FACTOR_REGISTRY["water-lifecycle-m3"].kgCo2ePerUnit; // 0.616
export const OFFICIAL_CYPRUS_WATER_PER_LITER = FACTOR_REGISTRY["water-lifecycle-liter"].kgCo2ePerUnit; // 0.000616
export const OFFICIAL_DIESEL_FACTOR = FACTOR_REGISTRY["fuel-diesel-litre"].kgCo2ePerUnit; // 2.51
export const OFFICIAL_PETROL_FACTOR = FACTOR_REGISTRY["fuel-petrol-litre"].kgCo2ePerUnit; // 2.31
export const OFFICIAL_GAS_FACTOR_KWH = FACTOR_REGISTRY["fuel-natural-gas-kwh"].kgCo2ePerUnit; // 0.184
export const OFFICIAL_LPG_FACTOR_KG = FACTOR_REGISTRY["fuel-lpg-kg"].kgCo2ePerUnit; // 2.94
export const OFFICIAL_WASTE_LANDFILL_KG = FACTOR_REGISTRY["waste-landfill-kg"].kgCo2ePerUnit; // 0.4467

/**
 * Retrieves the location-based grid emission factor for a given country code (e.g. "CY", "GR", "DE").
 * Falls back to EU-27 average if unknown.
 */
export function getGridFactor(countryCode: string): number {
  const code = (countryCode || "").toUpperCase().trim();
  return LOCATION_BASED_GRID_FACTORS[code] ?? LOCATION_BASED_GRID_FACTORS.EU27;
}

/**
 * Retrieves a factor entry from the authoritative registry.
 */
export function getFactor(id: keyof typeof FACTOR_REGISTRY): EmissionFactorMetadata {
  const f = FACTOR_REGISTRY[id];
  if (!f) throw new Error(`Unknown emission factor ID: ${id}`);
  return f;
}
