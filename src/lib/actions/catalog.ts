/**
 * The fixed library of Action plan projects. Each type states what triggers
 * it, which figures it needs, and which checks must pass before Vuneli calls
 * it confirmed. Browser-safe: no server imports.
 */

export const PROJECT_TYPES = ["solar", "efficiency", "water", "fleet", "supplier_data"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const STAGES = ["idea", "under_way", "being_checked", "confirmed"] as const;
export type Stage = (typeof STAGES)[number];

/** purchase = invoice read by Vuneli or a bank payment the person confirmed; bill_drop = later bills fall; supplier_data = declared figure on file. */
export type CheckKind = "purchase" | "bill_drop" | "supplier_data";

export interface ProjectInputs {
  supplierName?: string | null;
  quoteEur?: number | null;
  grantEur?: number | null;
  /** Solar size from the installer's quote. */
  kwp?: number | null;
  /** Installer's yield, replaces the published estimate. */
  kwhPerKwp?: number | null;
  /** Installer's estimate of yearly kWh saved (efficiency). */
  savedKwhYr?: number | null;
  /** Yearly water saved, m3 (water). */
  savedM3Yr?: number | null;
  /** Yearly diesel saved, litres (fleet). */
  savedLitresYr?: number | null;
  /** Yearly euro saved when it cannot be worked out from bills (fleet). */
  savedEurYr?: number | null;
  /** Yearly CO2 cut from supplier primary data or decarbonisation, kg (supplier_data). */
  savedKgCo2eYr?: number | null;
}

export type InputKey = keyof ProjectInputs;

export interface ProjectDef {
  type: ProjectType;
  /** Which bills show the result; null = no meter (checked by purchase or declaration only). */
  meter: "electricity" | "water" | null;
  checks: CheckKind[];
  /** Figures the card asks for, in order. */
  inputs: InputKey[];
  /** Words an invoice for this project should contain (EN + EL). */
  proofWords: RegExp;
}

export const CATALOG: Record<ProjectType, ProjectDef> = {
  solar: {
    type: "solar",
    meter: "electricity",
    checks: ["purchase", "bill_drop"],
    inputs: ["supplierName", "quoteEur", "grantEur", "kwp", "kwhPerKwp"],
    proofWords: /photovolta|\bpv\b|solar|inverter|panel|kwp|φωτοβολτα|ηλιακ|μετατροπέ|πάνελ/i,
  },
  efficiency: {
    type: "efficiency",
    meter: "electricity",
    checks: ["purchase", "bill_drop"],
    inputs: ["supplierName", "quoteEur", "grantEur", "savedKwhYr"],
    proofWords: /heat pump|inverter|air.?condition|\bvrf\b|\bhvac\b|\bled\b|lighting|chiller|αντλία θερμότητας|κλιματισ|φωτισμ|λαμπτήρ/i,
  },
  water: {
    type: "water",
    meter: "water",
    checks: ["purchase", "bill_drop"],
    inputs: ["supplierName", "quoteEur", "grantEur", "savedM3Yr"],
    proofWords: /aerator|low.?flow|dual.?flush|cistern|tap|faucet|leak|irrigation|drip|βρύσ|καζανάκι|διαρρο|άρδευσ|σταγόν/i,
  },
  fleet: {
    type: "fleet",
    meter: null,
    checks: ["purchase"],
    inputs: ["supplierName", "quoteEur", "grantEur", "savedLitresYr", "savedEurYr"],
    proofWords: /electric|\bev\b|hybrid|charger|charging|wallbox|ηλεκτρικ|υβριδικ|φορτιστ|φόρτισ/i,
  },
  supplier_data: {
    type: "supplier_data",
    meter: null,
    checks: ["supplier_data"],
    inputs: ["supplierName", "quoteEur", "grantEur", "savedKgCo2eYr"],
    proofWords: /declaration|emissions|carbon|footprint|scope.?3|\bpcf\b|\bghg\b|certificate|supplier|δήλωση|εκπομπ|ανθρακ|πιστοποιητ|προμηθευτ/i,
  },
};

export function isProjectType(v: unknown): v is ProjectType {
  return typeof v === "string" && (PROJECT_TYPES as readonly string[]).includes(v);
}
