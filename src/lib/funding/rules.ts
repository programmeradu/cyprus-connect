/**
 * Funding call rules, read once per call by AI, and the shape of a check.
 * Browser-safe: no server imports.
 */

/** Fixed sector list shared by call rules and the company picture. */
export const SECTORS = [
  "technology",
  "retail",
  "manufacturing",
  "hospitality",
  "healthcare",
  "finance",
  "energy",
  "construction",
  "agriculture",
  "transport",
  "maritime",
  "research",
  "public",
  "creative",
] as const;
export type Sector = (typeof SECTORS)[number];

/** Who may apply. Only "company" types can be a fit for a business. */
export const APPLICANT_TYPES = ["company", "startup", "research", "public", "ngo", "individual", "consortium"] as const;
export type ApplicantType = (typeof APPLICANT_TYPES)[number];

/** Every field is null when the call text does not say. Null is never "met". */
export interface CallRules {
  /** ISO-2 codes, "EU" for all member states, "ANY" for worldwide. */
  countries: string[] | null;
  applicantTypes: ApplicantType[] | null;
  smeOnly: boolean | null;
  minEmployees: number | null;
  maxEmployees: number | null;
  maxRevenueEur: number | null;
  minCompanyAgeYears: number | null;
  maxCompanyAgeYears: number | null;
  /** Empty or ["any"] = open to all sectors. */
  sectors: string[] | null;
  consortiumRequired: boolean | null;
  requiredDocuments: string[];
  /** Short quote from the call text per rule key. */
  evidence: { rule: string; quote: string }[];
}

export type FactKey = "country" | "employees" | "revenue" | "company_age" | "sector";

export interface RuleCheck {
  rule: string;
  /** Plain sentence for the person, English. */
  text: string;
  /** Greek version of the same sentence. */
  textEl: string;
  quote?: string | null;
  /** Set on "missing" checks: the company fact that would settle it. */
  fact?: FactKey;
}

export type Verdict = "strong" | "needs_info" | "hidden";

export interface BusinessPicture {
  country: string | null;
  /** Lowest possible staff count (exact when employeesMax equals it). */
  employees: number | null;
  /** Highest possible staff count from a size band; null when the band is open-ended. */
  employeesMax: number | null;
  revenueEur: number | null;
  companyAgeYears: number | null;
  sector: Sector | null;
}

export const FACT_LABEL: Record<FactKey, { en: string; el: string }> = {
  country: { en: "Country of the company", el: "Χώρα της εταιρείας" },
  employees: { en: "Number of employees", el: "Αριθμός εργαζομένων" },
  revenue: { en: "Yearly revenue", el: "Ετήσιος κύκλος εργασιών" },
  company_age: { en: "Company registration date", el: "Ημερομηνία εγγραφής της εταιρείας" },
  sector: { en: "Industry of the company", el: "Κλάδος της εταιρείας" },
};

/** Free-text industry → fixed sector. Unknown text stays null. */
export function sectorOf(industry: string | null | undefined): Sector | null {
  const t = (industry ?? "").toLowerCase();
  if (!t.trim()) return null;
  const map: [RegExp, Sector][] = [
    [/tech|software|it\b|digital|saas|ict/, "technology"],
    [/retail|shop|store|wholesale|e-?commerce/, "retail"],
    [/manufactur|factory|industr|production/, "manufacturing"],
    [/hospital(ity)|hotel|tourism|restaurant|food service|catering/, "hospitality"],
    [/health|medical|pharma|clinic/, "healthcare"],
    [/financ|bank|insur|accounting/, "finance"],
    [/energy|utilit|solar|power/, "energy"],
    [/construct|building|real estate/, "construction"],
    [/agri|farm|food production|fish/, "agriculture"],
    [/logist|transport|shipping|freight/, "transport"],
    [/maritime|marine|port/, "maritime"],
    [/research|universit|lab/, "research"],
    [/public|government|municipal/, "public"],
    [/creative|media|design|culture/, "creative"],
  ];
  for (const [re, s] of map) if (re.test(t)) return s;
  return null;
}
