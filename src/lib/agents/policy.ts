/**
 * Autonomy policy. Pure functions, no I/O, so the safety rules are testable.
 *
 * Risk levels:
 *   0 read and analyse          -> runs alone
 *   1 internal, reversible write -> runs alone
 *   2 outward-facing act         -> asks, unless the owner allowed it
 *   3 legal or financial act     -> always asks. No policy can change this.
 */

export type RiskLevel = 0 | 1 | 2 | 3;
export type PolicyMode = "auto" | "ask" | "deny";
export type StepDecision = "execute" | "ask" | "block";

export const DEFAULT_MODES: Record<RiskLevel, PolicyMode> = {
  0: "auto",
  1: "auto",
  2: "ask",
  3: "ask",
};

export function isPolicyMode(value: unknown): value is PolicyMode {
  return value === "auto" || value === "ask" || value === "deny";
}

export function decideStep(
  risk: RiskLevel,
  overrides: Partial<Record<RiskLevel, PolicyMode>> = {},
): StepDecision {
  const mode = overrides[risk] ?? DEFAULT_MODES[risk];
  if (mode === "deny") return "block";
  // Level 3 needs a human signature, whatever the override says.
  if (risk === 3) return "ask";
  return mode === "auto" ? "execute" : "ask";
}

export interface BudgetState {
  dailyBudgetUsd: number;
  spentUsd: number;
  spentOn: string | null;
}

/** Spend already used today. A new UTC day resets the counter. */
export function spentToday(state: BudgetState, today: string): number {
  return state.spentOn === today ? state.spentUsd : 0;
}

export function budgetAllows(state: BudgetState, today: string, nextCostUsd: number): boolean {
  return spentToday(state, today) + Math.max(0, nextCostUsd) <= state.dailyBudgetUsd + 1e-9;
}

/** Exponential backoff for a failed job: 1, 4, 16 minutes, capped at 1 hour. */
export function retryDelayMs(attempt: number): number {
  const minutes = Math.min(60, 4 ** Math.max(0, attempt - 1));
  return minutes * 60_000;
}
