import { sql } from "drizzle-orm";
import { db } from "@/db";

// Grant-alert storage goes through the shared database client (Hyperdrive in
// production, the transaction pooler in development), so it needs no extra
// service key and sees the same database as every other page.

export interface StoredMatch {
  id: number;
  source: string;
  external_id: string;
  title: string;
  summary: string;
  url: string;
  program: string | null;
  deadline: string | null;
  score: number;
  reasons: string;
  first_seen_at: string;
  notified_at: string | null;
}

type Row = Record<string, unknown>;

function iso(v: unknown): string | null {
  if (v == null) return null;
  return v instanceof Date ? v.toISOString() : String(v);
}

function mapMatch(row: Row): StoredMatch {
  return {
    id: Number(row.id),
    source: String(row.source),
    external_id: String(row.external_id),
    title: String(row.title),
    summary: String(row.summary ?? ""),
    url: String(row.url),
    program: typeof row.program === "string" ? row.program : null,
    deadline: typeof row.deadline === "string" ? row.deadline : null,
    score: Number(row.score ?? 0),
    reasons: String(row.reasons ?? ""),
    first_seen_at: iso(row.first_seen_at) ?? new Date(0).toISOString(),
    notified_at: iso(row.notified_at),
  };
}

async function rows(query: ReturnType<typeof sql>): Promise<Row[]> {
  return (await db.execute(query)) as unknown as Row[];
}

/** Kept for callers; the tables are created by the grant-alerts migration. */
export async function ensureSchema(): Promise<void> {
  await rows(sql`select 1 from grant_opportunities limit 1`);
}

export async function upsertOpportunity(row: {
  source: string;
  externalId: string;
  title: string;
  summary: string;
  url: string;
  program: string | null;
  deadline: string | null;
  publishedAt: string | null;
  score: number;
  reasons: string;
}): Promise<{ isNew: boolean; row: StoredMatch }> {
  const inserted = await rows(sql`
    insert into grant_opportunities
      (source, external_id, title, summary, url, program, deadline, published_at, score, reasons)
    values (${row.source}, ${row.externalId}, ${row.title}, ${row.summary}, ${row.url},
            ${row.program}, ${row.deadline}, ${row.publishedAt}, ${row.score}, ${row.reasons})
    on conflict (source, external_id) do nothing
    returning *
  `);
  if (inserted[0]) return { isNew: true, row: mapMatch(inserted[0]) };
  const existing = await rows(sql`
    select * from grant_opportunities where source = ${row.source} and external_id = ${row.externalId} limit 1
  `);
  return { isNew: false, row: mapMatch(existing[0]) };
}

export async function markNotified(id: number): Promise<void> {
  await rows(sql`update grant_opportunities set notified_at = now() where id = ${id}`);
}

export async function listActiveSubscribers(): Promise<{ email: string; sources: string[] }[]> {
  const data = await rows(sql`select email, sources from grant_alert_subscriptions where active = true`);
  return data.map((r) => ({
    email: String(r.email),
    sources: String(r.sources).split(",").map((s) => s.trim()),
  }));
}

const DEFAULT_SOURCES = "eu-funding-tenders,research-gov-cy,invest-cyprus,kebe-oeb,accelerators";

export async function upsertSubscription(email: string, sources?: string[]): Promise<void> {
  const list = sources?.length ? sources.join(",") : DEFAULT_SOURCES;
  await rows(sql`
    insert into grant_alert_subscriptions (email, sources, active) values (${email}, ${list}, true)
    on conflict (email) do update set sources = excluded.sources, active = true
  `);
}

export async function deactivateSubscription(email: string): Promise<void> {
  await rows(sql`update grant_alert_subscriptions set active = false where email = ${email}`);
}

export async function isSubscribed(email: string): Promise<boolean> {
  const r = await rows(sql`select active from grant_alert_subscriptions where email = ${email} limit 1`);
  return r[0]?.active === true;
}

export async function recentMatches(limit = 50): Promise<StoredMatch[]> {
  const data = await rows(sql`select * from grant_opportunities
    where deadline is null or left(deadline, 10) >= to_char(current_date, 'YYYY-MM-DD')
    order by deadline nulls last, first_seen_at desc limit ${limit}`);
  return data.map(mapMatch);
}
