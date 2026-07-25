// Shared types for the grant-alert pipeline.
export type GrantSource =
  | "eu-funding-tenders"
  | "research-gov-cy"
  | "invest-cyprus"
  | "kebe-oeb"
  | "accelerators";

export interface RawOpportunity {
  source: GrantSource;
  externalId: string;         // stable ID within the source
  title: string;
  summary: string;            // short description / abstract
  url: string;
  deadline?: string | null;   // ISO if known
  amount?: string | null;     // free-form (e.g. "up to EUR 2.5M")
  program?: string | null;    // e.g. "Horizon Europe - EIC Accelerator"
  publishedAt?: string | null;
  tags?: string[];
}

export interface MatchResult {
  score: number;              // 0..1
  reasons: string[];          // matched keywords/phrases
  isMatch: boolean;
}
