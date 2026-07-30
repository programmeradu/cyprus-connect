import postgres from "postgres";

// Direct SQL access for the grant-alert tables. We use a dedicated client so
// this pipeline never fights the app pool for connections during a cron run.

let sql: ReturnType<typeof postgres> | null = null;

function client() {
  if (!sql) {
    sql = postgres((process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL)!, {
      max: 2,
      ssl: "require",
      prepare: false,
      idle_timeout: 20,
    });
  }
  return sql;
}

export async function ensureSchema(): Promise<void> {
  const c = client();
  await c/* sql */`
    CREATE TABLE IF NOT EXISTS grant_opportunities (
      id BIGSERIAL PRIMARY KEY,
      source TEXT NOT NULL,
      external_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL,
      program TEXT,
      deadline TEXT,
      published_at TEXT,
      score REAL NOT NULL DEFAULT 0,
      reasons TEXT NOT NULL DEFAULT '',
      first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      notified_at TIMESTAMPTZ,
      UNIQUE (source, external_id)
    );
  `;
  await c/* sql */`
    CREATE TABLE IF NOT EXISTS grant_alert_subscriptions (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      sources TEXT NOT NULL DEFAULT 'eu-funding-tenders,research-gov-cy,invest-cyprus,kebe-oeb,accelerators',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await c/* sql */`CREATE INDEX IF NOT EXISTS grant_opps_first_seen_idx ON grant_opportunities(first_seen_at DESC);`;
}

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
  const c = client();
  const result = await c<StoredMatch[]>/* sql */`
    INSERT INTO grant_opportunities
      (source, external_id, title, summary, url, program, deadline, published_at, score, reasons)
    VALUES
      (${row.source}, ${row.externalId}, ${row.title}, ${row.summary}, ${row.url},
       ${row.program}, ${row.deadline}, ${row.publishedAt}, ${row.score}, ${row.reasons})
    ON CONFLICT (source, external_id) DO NOTHING
    RETURNING *
  `;
  if (result.length > 0) return { isNew: true, row: result[0] };
  const existing = await c<StoredMatch[]>/* sql */`
    SELECT * FROM grant_opportunities WHERE source = ${row.source} AND external_id = ${row.externalId} LIMIT 1
  `;
  return { isNew: false, row: existing[0] };
}

export async function markNotified(id: number): Promise<void> {
  const c = client();
  await c/* sql */`UPDATE grant_opportunities SET notified_at = NOW() WHERE id = ${id}`;
}

export async function listActiveSubscribers(): Promise<{ email: string; sources: string[] }[]> {
  const c = client();
  const rows = await c<{ email: string; sources: string }[]>/* sql */`
    SELECT email, sources FROM grant_alert_subscriptions WHERE active = TRUE
  `;
  return rows.map((r) => ({ email: r.email, sources: r.sources.split(",").map((s) => s.trim()) }));
}

export async function upsertSubscription(email: string, sources?: string[]): Promise<void> {
  const c = client();
  const src = sources?.length
    ? sources.join(",")
    : "eu-funding-tenders,research-gov-cy,invest-cyprus,kebe-oeb,accelerators";
  await c/* sql */`
    INSERT INTO grant_alert_subscriptions (email, sources, active)
    VALUES (${email}, ${src}, TRUE)
    ON CONFLICT (email) DO UPDATE SET sources = EXCLUDED.sources, active = TRUE
  `;
}

export async function deactivateSubscription(email: string): Promise<void> {
  const c = client();
  await c/* sql */`UPDATE grant_alert_subscriptions SET active = FALSE WHERE email = ${email}`;
}

export async function recentMatches(limit = 50): Promise<StoredMatch[]> {
  const c = client();
  return c<StoredMatch[]>/* sql */`
    SELECT * FROM grant_opportunities ORDER BY first_seen_at DESC LIMIT ${limit}
  `;
}
