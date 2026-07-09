/**
 * SBTi Corporate Net-Zero Standard — near-term target math.
 *
 * Simplified, deterministic pathways used by the SBTi Target Setter widget.
 * Reference: SBTi Corporate Net-Zero Standard v1.2 (April 2024) &
 * SBTi Near-Term Criteria & Recommendations v5.1.
 *
 * - 1.5°C aligned near-term target: absolute contraction of 4.2% per year
 *   applied linearly from the base year (Scope 1 + 2).
 * - Well-below 2°C for Scope 3: 2.5% per year linear absolute contraction
 *   (used when Scope 3 > 40% of total footprint, which triggers a mandatory
 *   Scope 3 target under SBTi criteria C15).
 * - Net-zero long-term: 90% absolute reduction by 2050 across all scopes.
 *
 * All rates are LINEAR (year-on-year absolute % of BASE-year emissions),
 * not compounded — matching SBTi's target-validation methodology.
 */

export type AmbitionKey = "1.5C" | "WB2C";

export const SBTI_ANNUAL_LINEAR_RATE: Record<AmbitionKey, number> = {
  "1.5C": 0.042, // 4.2% of base per year — near-term 1.5°C
  WB2C: 0.025, // 2.5% of base per year — well-below-2°C, used for Scope 3
};

export const SBTI_NET_ZERO_YEAR = 2050;
export const SBTI_NET_ZERO_REDUCTION = 0.9; // 90% absolute reduction by 2050
export const SBTI_SCOPE3_THRESHOLD = 0.4; // >40% of total → Scope 3 target required

/**
 * Minimum near-term target horizon per SBTi criteria: 5 years, max 10 years.
 * Base year must be ≤ 2 years before the submission year.
 */
export const SBTI_MIN_HORIZON = 5;
export const SBTI_MAX_HORIZON = 10;

export type PathwayInput = {
  baseYear: number;
  targetYear: number;
  scope1: number; // t CO2e
  scope2: number;
  scope3: number;
  scope12Ambition: AmbitionKey;
  scope3Ambition: AmbitionKey;
};

export type PathwayYearPoint = {
  year: number;
  scope12: number;
  scope3: number;
  total: number;
};

export type PathwayResult = {
  horizonYears: number;
  scope12Base: number;
  scope3Base: number;
  totalBase: number;
  scope3Share: number;
  scope3Required: boolean;
  scope12TargetPct: number; // e.g. 0.42 for 42%
  scope3TargetPct: number;
  scope12Target: number; // t CO2e in target year
  scope3Target: number;
  totalTarget: number;
  totalReductionPct: number;
  netZeroTarget: number; // t CO2e residual after 90% reduction by 2050
  trajectory: PathwayYearPoint[]; // base year -> target year, inclusive
  warnings: string[];
};

export function computePathway(input: PathwayInput): PathwayResult {
  const { baseYear, targetYear, scope1, scope2, scope3, scope12Ambition, scope3Ambition } = input;

  const scope12Base = Math.max(0, scope1) + Math.max(0, scope2);
  const scope3Base = Math.max(0, scope3);
  const totalBase = scope12Base + scope3Base;
  const scope3Share = totalBase > 0 ? scope3Base / totalBase : 0;
  const scope3Required = scope3Share > SBTI_SCOPE3_THRESHOLD;

  const horizon = Math.max(0, targetYear - baseYear);
  const r12 = SBTI_ANNUAL_LINEAR_RATE[scope12Ambition];
  const r3 = SBTI_ANNUAL_LINEAR_RATE[scope3Ambition];

  const scope12TargetPct = Math.min(1, r12 * horizon);
  const scope3TargetPct = Math.min(1, r3 * horizon);

  const scope12Target = scope12Base * (1 - scope12TargetPct);
  const scope3Target = scope3Base * (1 - scope3TargetPct);
  const totalTarget = scope12Target + scope3Target;
  const totalReductionPct = totalBase > 0 ? 1 - totalTarget / totalBase : 0;

  const netZeroTarget = totalBase * (1 - SBTI_NET_ZERO_REDUCTION);

  const trajectory: PathwayYearPoint[] = [];
  for (let y = baseYear; y <= targetYear; y += 1) {
    const dy = y - baseYear;
    const s12 = scope12Base * Math.max(0, 1 - r12 * dy);
    const s3 = scope3Base * Math.max(0, 1 - r3 * dy);
    trajectory.push({ year: y, scope12: s12, scope3: s3, total: s12 + s3 });
  }

  const warnings: string[] = [];
  if (horizon < SBTI_MIN_HORIZON) warnings.push("horizon-too-short");
  if (horizon > SBTI_MAX_HORIZON) warnings.push("horizon-too-long");
  if (scope3Required && scope3Ambition !== "WB2C" && scope3Ambition !== "1.5C") {
    warnings.push("scope3-target-missing");
  }
  if (totalBase <= 0) warnings.push("no-base-emissions");

  return {
    horizonYears: horizon,
    scope12Base,
    scope3Base,
    totalBase,
    scope3Share,
    scope3Required,
    scope12TargetPct,
    scope3TargetPct,
    scope12Target,
    scope3Target,
    totalTarget,
    totalReductionPct,
    netZeroTarget,
    trajectory,
    warnings,
  };
}

export function formatTonnes(x: number, locale: "en" | "el" = "en"): string {
  const lc = locale === "el" ? "el-CY" : "en-GB";
  return new Intl.NumberFormat(lc, { maximumFractionDigits: 0 }).format(Math.round(x));
}

export function formatPct(x: number, locale: "en" | "el" = "en"): string {
  const lc = locale === "el" ? "el-CY" : "en-GB";
  return new Intl.NumberFormat(lc, { style: "percent", maximumFractionDigits: 1 }).format(x);
}
