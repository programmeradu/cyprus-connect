// Common SME emission factors mapped by category
// Region-agnostic - no hardcoded regional defaults
export const SME_EMISSION_FACTORS = {
  // Electricity (scope 2, location-based)
  ELECTRICITY_GRID: {
    id: "electricity-supply_grid-source_supplier_mix",
    category: "Electricity",
    unitType: "Energy",
    unitExample: "kWh",
    description: "Grid electricity from supplier mix (region will be detected)",
  },
  
  // Natural Gas (scope 1)
  NATURAL_GAS: {
    id: "fuel-type_natural_gas-fuel_use_stationary_combustion",
    category: "Fuel",
    unitType: "Energy",
    unitExample: "kWh",
    description: "Natural gas stationary combustion",
  },

  // Water - Municipal water supply & treatment (scope 3.3)
  WATER_SUPPLY: {
    id: "water_treatment-type_water_supply_and_irrigation_systems",
    category: "Water Supply",
    unitType: "Money",
    unitExample: "local_currency",
    description: "Water supply and irrigation systems (currency-agnostic)",
  },

  // Waste - Landfill disposal
  WASTE_LANDFILL: {
    id: "waste-type_mixed_msw-disposal_method_landfilled",
    category: "Waste",
    unitType: "Weight",
    unitExample: "kg",
    description: "Mixed municipal solid waste to landfill",
  },

  // Waste - Recycling
  WASTE_RECYCLING: {
    id: "waste_type_mixed_recyclables-disposal_method_recycled",
    category: "Waste",
    unitType: "Weight",
    unitExample: "kg",
    description: "Mixed recyclables",
  },

  // Car travel - passenger car (scope 3.6)
  TRAVEL_CAR: {
    id: "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
    category: "Travel",
    unitType: "Distance",
    unitExample: "km",
    description: "Average passenger car",
  },

  // Train travel (scope 3.6)
  TRAVEL_TRAIN: {
    id: "passenger_train-route_type_na-fuel_source_na",
    category: "Travel",
    unitType: "Distance",
    unitExample: "km",
    description: "Passenger train",
  },
};

// Unit conversions for common SME inputs
export const UNIT_CONVERSIONS = {
  // Energy conversions to kWh
  MJ_TO_KWH: 0.278,
  GJ_TO_KWH: 277.8,
  THERM_TO_KWH: 29.3,
  
  // Natural gas volume to energy (approximate, varies by region)
  M3_GAS_TO_KWH: 10.55, // 1 m³ natural gas ≈ 10.55 kWh
  
  // Weight conversions to kg
  TONNE_TO_KG: 1000,
  POUND_TO_KG: 0.453592,
  SHORT_TON_TO_KG: 907.185,
  
  // Volume conversions
  LITER_TO_M3: 0.001,
  GALLON_US_TO_M3: 0.00378541, // US gallon
  GALLON_UK_TO_M3: 0.00454609, // UK/Imperial gallon
  
  // Distance conversions
  MILES_TO_KM: 1.60934,
  
  // Water volume to money estimate (global average for reference)
  // Note: Actual costs vary significantly by region
  // Users should input their local currency costs directly
  M3_WATER_TO_LOCAL_CURRENCY: 5.0, // Generic placeholder - should be localized
};

// Convert natural gas m³ to kWh for Climatiq API
export function convertGasM3ToKWh(m3: number): number {
  return m3 * UNIT_CONVERSIONS.M3_GAS_TO_KWH;
}

// Convert water liters to local currency for Climatiq API
// Note: This uses a generic conversion factor. 
// For accurate results, users should input costs in their local currency
export function convertLitersToLocalCurrency(liters: number, costPerM3?: number): number {
  const m3 = liters * UNIT_CONVERSIONS.LITER_TO_M3;
  const rate = costPerM3 || UNIT_CONVERSIONS.M3_WATER_TO_LOCAL_CURRENCY;
  return m3 * rate;
}

// Legacy function for backward compatibility
export function convertLitersToM3(liters: number): number {
  return liters * UNIT_CONVERSIONS.LITER_TO_M3;
}

// Legacy USD function - deprecated, use convertLitersToLocalCurrency instead
export function convertLitersToUSD(liters: number): number {
  console.warn('convertLitersToUSD is deprecated. Use convertLitersToLocalCurrency instead.');
  return convertLitersToLocalCurrency(liters);
}