/**
 * Resolves each footprint line on the server.
 *
 * Electricity, gas, waste and transport ask Climatiq for a factor for the
 * company's own country. If Climatiq has no key, no factor or does not answer,
 * that one line uses the published reference factor, and the line says so.
 * Water always uses the reference factor: Climatiq only offers a spend-based
 * water factor, and turning litres into money would be a guess.
 */

import { callClimatiaqAPI, type ClimatiaqEstimateResponse } from "@/lib/climatiq";
import { SME_EMISSION_FACTORS, UNIT_CONVERSIONS } from "@/lib/emissionFactors";
import { logger } from "@/lib/log";
import { REFERENCE_FACTORS } from "./reference-factors";
import {
  FOOTPRINT_KEYS,
  referenceLine,
  summarise,
  type Footprint,
  type FootprintInput,
  type FootprintKey,
  type FootprintLine,
} from "./footprint";

const log = logger("emissions.footprint");

const LIVE: Partial<Record<FootprintKey, { id: string; param: string; unitKey: string; unit: string; convert: (v: number) => number }>> = {
  electricity: { id: SME_EMISSION_FACTORS.ELECTRICITY_GRID.id, param: "energy", unitKey: "energy_unit", unit: "kWh", convert: (v) => v },
  gas: { id: SME_EMISSION_FACTORS.NATURAL_GAS.id, param: "energy", unitKey: "energy_unit", unit: "kWh", convert: (v) => v * UNIT_CONVERSIONS.M3_GAS_TO_KWH },
  waste: { id: SME_EMISSION_FACTORS.WASTE_LANDFILL.id, param: "weight", unitKey: "weight_unit", unit: "kg", convert: (v) => v },
  transport: { id: SME_EMISSION_FACTORS.TRAVEL_CAR.id, param: "distance", unitKey: "distance_unit", unit: "km", convert: (v) => v },
};

async function resolveLine(key: FootprintKey, value: number, region: string, live: boolean): Promise<FootprintLine> {
  const spec = LIVE[key];
  if (!live || !spec || value <= 0) return referenceLine(key, value);
  try {
    const res = await callClimatiaqAPI<ClimatiaqEstimateResponse>("/estimate", "POST", {
      emission_factor: { activity_id: spec.id, region, data_version: "^21" },
      parameters: { [spec.param]: spec.convert(value), [spec.unitKey]: spec.unit },
    });
    if (typeof res.co2e !== "number" || !Number.isFinite(res.co2e) || res.co2e < 0) throw new Error("no usable co2e");
    const f = res.emission_factor;
    return {
      key,
      value,
      unit: REFERENCE_FACTORS[key].unit,
      tonnes: res.co2e / 1000,
      scope: REFERENCE_FACTORS[key].scope,
      basis: "climatiq",
      source: f ? `Climatiq: ${f.name}, ${f.source} ${f.year} (${f.region})` : "Climatiq emission factor",
    };
  } catch (err) {
    log.warn(`Climatiq factor unavailable for ${key}, using reference factor`, {
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return referenceLine(key, value);
  }
}

export async function computeFootprint(input: FootprintInput, region: string): Promise<Footprint> {
  const live = !!process.env.CLIMATIQ_API_KEY;
  const lines = await Promise.all(FOOTPRINT_KEYS.map((k) => resolveLine(k, input[k], region, live)));
  return summarise(lines);
}
