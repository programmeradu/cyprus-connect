import { matchOpportunity } from "./matcher";
import { sendGrantAlertEmail } from "./emailer";
import {
  ensureSchema,
  listActiveSubscribers,
  markNotified,
  upsertOpportunity,
} from "./store";
import { fetchEuFundingOpportunities } from "./sources/eu-funding";
import { fetchCyprusOpportunities } from "./sources/cyprus";
import { fetchAcceleratorOpportunities } from "./sources/accelerators";
import type { RawOpportunity } from "./types";

type FetcherResult = { source: string; ok: boolean; count: number; error?: string };

async function safe(name: string, fn: () => Promise<RawOpportunity[]>) {
  try {
    const items = await fn();
    return { name, items, ok: true as const };
  } catch (e) {
    return { name, items: [] as RawOpportunity[], ok: false as const, error: (e as Error).message };
  }
}

export interface RunSummary {
  fetchers: FetcherResult[];
  scanned: number;
  matched: number;
  newMatches: number;
  emailed: number;
  emailErrors: string[];
  subscribers: number;
}

export async function runGrantAlerts(): Promise<RunSummary> {
  await ensureSchema();

  const [eu, cy, acc] = await Promise.all([
    safe("eu-funding-tenders", fetchEuFundingOpportunities),
    safe("research-gov-cy", fetchCyprusOpportunities),
    safe("accelerators", fetchAcceleratorOpportunities),
  ]);

  const fetchers: FetcherResult[] = [eu, cy, acc].map((r) => ({
    source: r.name,
    ok: r.ok,
    count: r.items.length,
    error: r.ok ? undefined : (r as any).error,
  }));

  const all = [...eu.items, ...cy.items, ...acc.items];

  const subs = await listActiveSubscribers();
  const emailErrors: string[] = [];
  let matched = 0;
  let newMatches = 0;
  let emailed = 0;

  for (const op of all) {
    const m = matchOpportunity(op);
    if (!m.isMatch) continue;
    matched++;
    const { isNew, row } = await upsertOpportunity({
      source: op.source,
      externalId: op.externalId,
      title: op.title,
      summary: op.summary,
      url: op.url,
      program: op.program ?? null,
      deadline: op.deadline ?? null,
      publishedAt: op.publishedAt ?? null,
      score: m.score,
      reasons: m.reasons.join(","),
    });
    if (!isNew || row.notified_at) continue;
    newMatches++;
    for (const sub of subs) {
      if (!sub.sources.includes(op.source)) continue;
      const res = await sendGrantAlertEmail({
        to: sub.email,
        op,
        reasons: m.reasons,
      });
      if (res.sent) emailed++;
      else if (res.error) emailErrors.push(`${sub.email}: ${res.error}`);
    }
    await markNotified(row.id);
  }

  return {
    fetchers,
    scanned: all.length,
    matched,
    newMatches,
    emailed,
    emailErrors,
    subscribers: subs.length,
  };
}
