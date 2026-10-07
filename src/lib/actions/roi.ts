/**
 * Deterministic Action plan maths. Pure: same inputs, same figures.
 * A figure is null when an input it needs is missing; it is never guessed.
 */
import { ACTION_CONSTANTS } from "@/data/actions/constants";
import type { InputKey, ProjectInputs, ProjectType } from "./catalog";

export interface MeterBill {
  start: string;
  end: string;
  qty: number;
  amountEur: number | null;
}

export interface UsageBaseline {
  /** Yearly quantity (kWh or m3), annualised from bills; null with too little data. */
  annual: number | null;
  /** Euro per unit from bills that print an amount; null when none do. */
  unitPrice: number | null;
  bills: number;
  daysCovered: number;
}

export interface BasisLine {
  label: string;
  value: string;
  source: string;
}

export interface Figures {
  savedQtyYr: number | null;
  savedUnit: "kWh" | "m3" | "litres" | null;
  savedEurYr: number | null;
  co2KgYr: number | null;
  costEur: number | null;
  netCostEur: number | null;
  paybackYrs: number | null;
  /** Solar only: size suggested from bills when no quote gives one. */
  suggestedKwp: number | null;
  basis: BasisLine[];
  missing: InputKey[];
}

const DAY = 86_400_000;
const days = (a: string, b: string) => Math.max(1, Math.round((Date.parse(b) - Date.parse(a)) / DAY) + 1);
const pos = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);
const round = (v: number, step = 1) => Math.round(v / step) * step;

/** Annual use from the last ~13 months of bills. Needs at least 90 days covered. */
export function baselineFrom(bills: MeterBill[], today = new Date()): UsageBaseline {
  const since = today.getTime() - 400 * DAY;
  const recent = bills.filter((b) => Date.parse(b.end) >= since && b.qty > 0);
  const covered = recent.reduce((n, b) => n + days(b.start, b.end), 0);
  const qty = recent.reduce((n, b) => n + b.qty, 0);
  const priced = recent.filter((b) => pos(b.amountEur));
  const pricedQty = priced.reduce((n, b) => n + b.qty, 0);
  const pricedEur = priced.reduce((n, b) => n + (b.amountEur ?? 0), 0);
  return {
    annual: covered >= 90 ? (qty * 365) / Math.min(covered, 365 + 35) : null,
    unitPrice: pricedQty > 0 ? pricedEur / pricedQty : null,
    bills: recent.length,
    daysCovered: covered,
  };
}

export function computeFigures(type: ProjectType, inputs: ProjectInputs, base: UsageBaseline | null): Figures {
  const C = ACTION_CONSTANTS;
  const basis: BasisLine[] = [];
  const missing: InputKey[] = [];
  let savedQtyYr: number | null = null;
  let savedUnit: Figures["savedUnit"] = null;
  let savedEurYr: number | null = pos(inputs.savedEurYr);
  let co2KgYr: number | null = null;
  let suggestedKwp: number | null = null;

  if (base?.annual) basis.push({ label: "Yearly use from your bills", value: `${round(base.annual).toLocaleString("en-GB")} ${type === "water" ? "m³" : "kWh"}`, source: `${base.bills} bills, ${base.daysCovered} days` });
  if (base?.unitPrice) basis.push({ label: "Your price per unit", value: `€${base.unitPrice.toFixed(3)}`, source: "Amounts printed on your bills" });

  if (type === "solar") {
    const yieldPer = pos(inputs.kwhPerKwp) ?? C.solarKwhPerKwp.value;
    basis.push({ label: "Yield per kWp", value: `${yieldPer} kWh/yr`, source: pos(inputs.kwhPerKwp) ? "Your installer" : C.solarKwhPerKwp.source });
    if (base?.annual) suggestedKwp = Math.max(1, round(base.annual / C.solarKwhPerKwp.value, 0.5));
    const kwp = pos(inputs.kwp);
    if (!kwp) missing.push("kwp");
    const size = kwp ?? suggestedKwp;
    if (size && base?.annual) {
      // Power sent to the grid is not counted as a saving.
      savedQtyYr = Math.min(size * yieldPer, base.annual);
      savedUnit = "kWh";
    }
  } else if (type === "efficiency") {
    savedQtyYr = pos(inputs.savedKwhYr);
    savedUnit = "kWh";
    if (!savedQtyYr) missing.push("savedKwhYr");
  } else if (type === "water") {
    savedQtyYr = pos(inputs.savedM3Yr);
    savedUnit = "m3";
    if (!savedQtyYr) missing.push("savedM3Yr");
  } else if (type === "fleet") {
    savedQtyYr = pos(inputs.savedLitresYr);
    savedUnit = "litres";
    if (!savedQtyYr) missing.push("savedLitresYr");
    if (!savedEurYr) missing.push("savedEurYr");
  } else if (type === "supplier_data") {
    savedQtyYr = pos(inputs.savedKgCo2eYr);
    savedUnit = null;
    if (!savedQtyYr) missing.push("savedKgCo2eYr");
    co2KgYr = savedQtyYr;
    if (co2KgYr) {
      basis.push({
        label: "Primary supplier emissions reduction",
        value: `${round(co2KgYr).toLocaleString("en-GB")} kg CO₂e/yr`,
        source: inputs.supplierName ? `${inputs.supplierName} verified declaration` : "Supplier declaration on file",
      });
    }
  }

  if (savedQtyYr) {
    if (savedUnit === "kWh") {
      co2KgYr = savedQtyYr * C.gridKgPerKwh.value;
      basis.push({ label: "Grid factor", value: `${C.gridKgPerKwh.value} ${C.gridKgPerKwh.unit}`, source: `${C.gridKgPerKwh.source}, ${C.gridKgPerKwh.vintage}` });
    } else if (savedUnit === "m3") {
      co2KgYr = savedQtyYr * C.waterKgPerM3.value;
      basis.push({ label: "Water factor", value: `${C.waterKgPerM3.value} ${C.waterKgPerM3.unit}`, source: `${C.waterKgPerM3.source}, ${C.waterKgPerM3.vintage}` });
    } else if (savedUnit === "litres") {
      co2KgYr = savedQtyYr * C.dieselKgPerLitre.value;
      basis.push({ label: "Diesel factor", value: `${C.dieselKgPerLitre.value} ${C.dieselKgPerLitre.unit}`, source: `${C.dieselKgPerLitre.source}, ${C.dieselKgPerLitre.vintage}` });
    }
    if (!savedEurYr && savedUnit && savedUnit !== "litres" && base?.unitPrice) savedEurYr = savedQtyYr * base.unitPrice;
  }

  const costEur = typeof inputs.quoteEur === "number" && Number.isFinite(inputs.quoteEur) && inputs.quoteEur >= 0 ? inputs.quoteEur : null;
  if (costEur === null) missing.unshift("quoteEur");
  const grant = pos(inputs.grantEur) ?? 0;
  const netCostEur = costEur !== null ? Math.max(0, costEur - grant) : null;
  const paybackYrs = netCostEur !== null && savedEurYr ? (netCostEur === 0 ? 0 : netCostEur / savedEurYr) : null;

  return { savedQtyYr, savedUnit, savedEurYr, co2KgYr, costEur, netCostEur, paybackYrs, suggestedKwp, basis, missing };
}
