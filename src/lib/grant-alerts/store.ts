import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerConfig } from "@/lib/supabase/server";

// Cloudflare Workers cannot use the raw postgres-js TCP client that previously
// backed this store. Supabase's HTTP API is Worker-safe and avoids port 5432.

let supabase: SupabaseClient | null = null;

function client() {
  if (!supabase) {
    const { url } = getSupabaseServerConfig();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for grant-alert storage.");
    }
    supabase = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabase;
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

function mapMatch(row: Record<string, unknown>): StoredMatch {
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
    first_seen_at: String(row.first_seen_at),
    notified_at: typeof row.notified_at === "string" ? row.notified_at : null,
  };
}

function missingSchemaMessage(error: { code?: string; message: string }) {
  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /relation .* does not exist|could not find the table|schema cache/i.test(error.message)
  ) {
    return "Grant-alert tables are missing. Apply supabase/migrations/20260813_create_grant_alerts.sql first.";
  }
  return error.message || "Unable to access grant-alert storage. Apply supabase/migrations/20260813_create_grant_alerts.sql and retry.";
}

export async function ensureSchema(): Promise<void> {
  const { error } = await client()
    .from("grant_opportunities")
    .select("id")
    .limit(1);
  if (error) throw new Error(missingSchemaMessage(error));
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
  const existing = await c
    .from("grant_opportunities")
    .select("*")
    .eq("source", row.source)
    .eq("external_id", row.externalId)
    .maybeSingle();
  if (existing.error) throw new Error(missingSchemaMessage(existing.error));
  if (existing.data) return { isNew: false, row: mapMatch(existing.data) };

  const inserted = await c
    .from("grant_opportunities")
    .insert({
      source: row.source,
      external_id: row.externalId,
      title: row.title,
      summary: row.summary,
      url: row.url,
      program: row.program,
      deadline: row.deadline,
      published_at: row.publishedAt,
      score: row.score,
      reasons: row.reasons,
    })
    .select("*")
    .single();
  if (inserted.error?.code === "23505") {
    const raced = await c
      .from("grant_opportunities")
      .select("*")
      .eq("source", row.source)
      .eq("external_id", row.externalId)
      .single();
    if (raced.error) throw new Error(missingSchemaMessage(raced.error));
    return { isNew: false, row: mapMatch(raced.data) };
  }
  if (inserted.error) throw new Error(missingSchemaMessage(inserted.error));
  return { isNew: true, row: mapMatch(inserted.data) };
}

export async function markNotified(id: number): Promise<void> {
  const { error } = await client()
    .from("grant_opportunities")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(missingSchemaMessage(error));
}

export async function listActiveSubscribers(): Promise<{ email: string; sources: string[] }[]> {
  const { data, error } = await client()
    .from("grant_alert_subscriptions")
    .select("email, sources")
    .eq("active", true);
  if (error) throw new Error(missingSchemaMessage(error));
  return (data ?? []).map((row) => ({
    email: row.email,
    sources: String(row.sources).split(",").map((source: string) => source.trim()),
  }));
}

export async function upsertSubscription(email: string, sources?: string[]): Promise<void> {
  const defaultSources = "eu-funding-tenders,research-gov-cy,invest-cyprus,kebe-oeb,accelerators";
  const { error } = await client()
    .from("grant_alert_subscriptions")
    .upsert({ email, sources: sources?.length ? sources.join(",") : defaultSources, active: true }, { onConflict: "email" });
  if (error) throw new Error(missingSchemaMessage(error));
}

export async function deactivateSubscription(email: string): Promise<void> {
  const { error } = await client()
    .from("grant_alert_subscriptions")
    .update({ active: false })
    .eq("email", email);
  if (error) throw new Error(missingSchemaMessage(error));
}

export async function recentMatches(limit = 50): Promise<StoredMatch[]> {
  const { data, error } = await client()
    .from("grant_opportunities")
    .select("*")
    .order("first_seen_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(missingSchemaMessage(error));
  return (data ?? []).map(mapMatch);
}
