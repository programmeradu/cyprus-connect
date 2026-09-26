-- Agent runtime: job queue, step ledger, per-workspace controls, autonomy
-- policies and sourced workspace facts. Additive only. Mirrors src/db/schema.ts.
ALTER TABLE "agent_runs" ADD COLUMN IF NOT EXISTS "trigger" text NOT NULL DEFAULT 'sample';
ALTER TABLE "agent_runs" ADD COLUMN IF NOT EXISTS "job_id" integer;
CREATE TABLE IF NOT EXISTS "agent_jobs" (
  "id" serial PRIMARY KEY, "workspace_id" text NOT NULL, "agent_key" text NOT NULL,
  "trigger" text NOT NULL DEFAULT 'cron', "status" text NOT NULL DEFAULT 'queued',
  "attempts" integer NOT NULL DEFAULT 0, "max_attempts" integer NOT NULL DEFAULT 3,
  "run_after" timestamp NOT NULL DEFAULT now(), "lease_until" timestamp,
  "idempotency_key" text NOT NULL UNIQUE, "run_id" integer, "error" text, "requested_by" text,
  "created_at" timestamp NOT NULL DEFAULT now(), "finished_at" timestamp);
CREATE INDEX IF NOT EXISTS "agent_jobs_due_idx" ON "agent_jobs" ("status", "run_after");
CREATE TABLE IF NOT EXISTS "agent_steps" (
  "id" serial PRIMARY KEY, "run_id" integer NOT NULL, "workspace_id" text NOT NULL,
  "agent_key" text NOT NULL, "seq" integer NOT NULL, "tool" text NOT NULL,
  "risk_level" integer NOT NULL, "decision" text NOT NULL, "input_hash" text NOT NULL,
  "input" text NOT NULL, "output" text, "cost_usd" real NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS "agent_steps_run_idx" ON "agent_steps" ("run_id", "seq");
CREATE TABLE IF NOT EXISTS "agent_controls" (
  "workspace_id" text PRIMARY KEY, "paused" boolean NOT NULL DEFAULT false, "pause_reason" text,
  "daily_budget_usd" real NOT NULL DEFAULT 1, "spent_usd" real NOT NULL DEFAULT 0, "spent_on" text,
  "max_steps_per_run" integer NOT NULL DEFAULT 25, "updated_by" text,
  "updated_at" timestamp NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS "autonomy_policies" (
  "workspace_id" text NOT NULL, "risk_level" integer NOT NULL, "mode" text NOT NULL,
  "updated_by" text, "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("workspace_id", "risk_level"));
CREATE TABLE IF NOT EXISTS "workspace_facts" (
  "id" serial PRIMARY KEY, "workspace_id" text NOT NULL, "key" text NOT NULL, "value" text NOT NULL,
  "unit" text, "source_kind" text NOT NULL, "source_hash" text NOT NULL, "agent_key" text,
  "run_id" integer, "valid_from" timestamp NOT NULL DEFAULT now(), "valid_to" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS "workspace_facts_key_idx" ON "workspace_facts" ("workspace_id", "key");
-- Server-only tables: block the public Data API.
ALTER TABLE "agent_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_controls" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "autonomy_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspace_facts" ENABLE ROW LEVEL SECURITY;
