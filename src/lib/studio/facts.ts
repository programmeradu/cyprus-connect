/**
 * Report Visuals: turns real workspace records into the short fact list the
 * image brief is built from. Pure, so it is tested without a database.
 * A context with no real records gives no facts; the caller then refuses
 * instead of drawing invented figures.
 */

export const STUDIO_CONTEXTS = ["custom", "company_data", "progress", "insights", "recommendations"] as const;
export type StudioContext = (typeof STUDIO_CONTEXTS)[number];

export interface StudioSource {
  company: {
    companyName: string | null;
    companyIndustry: string | null;
    teamSize: string | null;
    countryCode: string | null;
  } | null;
  /** Newest first. */
  emissions: Array<{
    totalCo2e: number;
    electricity: number;
    gas: number;
    transport: number;
    periodMonth: number;
    periodYear: number;
  }>;
  completedActions: number;
  openActionTitles: string[];
}

const round = (n: number, d = 1) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

const period = (e: { periodMonth: number; periodYear: number }) =>
  `${e.periodYear}-${String(e.periodMonth).padStart(2, "0")}`;

export function studioFacts(context: StudioContext, s: StudioSource): string[] {
  const facts: string[] = [];
  if (context === "custom") return facts;

  if (context === "company_data") {
    const c = s.company;
    if (c?.companyName) facts.push(`Company: ${c.companyName}`);
    if (c?.companyIndustry) facts.push(`Sector: ${c.companyIndustry}`);
    if (c?.teamSize) facts.push(`Team size: ${c.teamSize}`);
    if (c?.countryCode) facts.push(`Country: ${c.countryCode}`);
    return facts;
  }

  if (context === "progress") {
    const [latest, previous] = s.emissions;
    if (latest && previous && previous.totalCo2e > 0) {
      const change = ((latest.totalCo2e - previous.totalCo2e) / previous.totalCo2e) * 100;
      facts.push(
        `Emissions ${period(latest)}: ${round(latest.totalCo2e, 2)} tCO2e, ${change <= 0 ? "down" : "up"} ${round(Math.abs(change))}% from ${period(previous)}`,
      );
    } else if (latest) {
      facts.push(`Emissions ${period(latest)}: ${round(latest.totalCo2e, 2)} tCO2e`);
    }
    if (s.completedActions > 0) facts.push(`Completed sustainability actions: ${s.completedActions}`);
    return facts;
  }

  if (context === "insights") {
    const latest = s.emissions[0];
    if (!latest) return facts;
    facts.push(`Period: ${period(latest)}`);
    facts.push(`Total: ${round(latest.totalCo2e, 2)} tCO2e`);
    if (latest.electricity > 0) facts.push(`Electricity: ${round(latest.electricity, 0)} kWh`);
    if (latest.gas > 0) facts.push(`Gas: ${round(latest.gas, 0)}`);
    if (latest.transport > 0) facts.push(`Transport: ${round(latest.transport, 0)} km`);
    return facts;
  }

  // recommendations
  for (const title of s.openActionTitles.slice(0, 3)) facts.push(`Planned action: ${title}`);
  return facts;
}

/** The instruction the text model turns into an image prompt. */
export function studioBriefPrompt(brief: string, facts: string[]): string {
  return [
    "You write prompts for an image model. The image is a clean, professional visual for a small EU company's sustainability reporting or social channels.",
    facts.length
      ? `Use only these facts from the company's records. Show numbers exactly as given; do not add, round differently or invent any figure, logo or claim:\n${facts.map((f) => `- ${f}`).join("\n")}`
      : "No company figures are given. Do not put any numbers, statistics, percentages or claims in the image.",
    `The user's request: "${brief}"`,
    "Answer with the image prompt only, at most 150 words, no preamble.",
  ].join("\n\n");
}
