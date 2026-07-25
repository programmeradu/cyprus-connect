import type { MatchResult, RawOpportunity } from "./types";

// Broad match rules for a Cyprus-based SME sustainability platform.
// Any HIGH-signal hit, OR (any MEDIUM + any geo hit), OR (>= 2 MEDIUM hits) is a match.

const HIGH = [
  "cbam", "csrd", "vsme", "esrs", "eu taxonomy",
  "carbon accounting", "carbon footprint", "ghg protocol",
  "esg software", "sustainability reporting", "sustainability software",
  "climate tech", "climatetech", "climate-tech",
  "net zero", "net-zero", "decarbonisation", "decarbonization",
  "sme digitalisation", "sme digitalization", "digital sme",
  "green deal", "green transition", "twin transition",
];

const MEDIUM = [
  "sustainability", "climate", "emissions", "energy efficiency",
  "renewable", "circular economy", "green", "environment",
  "sme", "smes", "small and medium", "startup", "scale-up",
  "innovation", "digital transformation", "software", "saas",
  "reporting", "compliance", "esg",
];

const GEO = [
  "cyprus", "cypriot", "kypros", "κύπρος",
  "eu27", "european union", "eu member", "eu-wide",
  "horizon europe", "life programme", "innovation fund",
  "eit", "eic", "recovery and resilience", "rrf",
];

function hits(text: string, list: string[]): string[] {
  const lower = text.toLowerCase();
  return list.filter((k) => lower.includes(k));
}

export function matchOpportunity(op: RawOpportunity): MatchResult {
  const blob = `${op.title}\n${op.summary}\n${op.program ?? ""}\n${(op.tags ?? []).join(" ")}`;

  const h = hits(blob, HIGH);
  const m = hits(blob, MEDIUM);
  const g = hits(blob, GEO);

  const reasons = [
    ...h.map((x) => `HIGH:${x}`),
    ...m.map((x) => `MED:${x}`),
    ...g.map((x) => `GEO:${x}`),
  ];

  let score = 0;
  score += h.length * 0.4;
  score += m.length * 0.15;
  score += g.length * 0.2;
  score = Math.min(1, score);

  const isMatch =
    h.length >= 1 ||
    (m.length >= 1 && g.length >= 1) ||
    m.length >= 2;

  return { score, reasons, isMatch };
}
