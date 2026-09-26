-- Per-agent pause switch. The workspace kill switch (agent_controls.paused)
-- still wins; this lets a person stop one agent and keep the rest running.
-- Additive only. Mirrors src/db/schema.ts (agentSwitches).
CREATE TABLE IF NOT EXISTS "agent_switches" (
  "workspace_id" text NOT NULL,
  "agent_key" text NOT NULL,
  "paused" boolean NOT NULL DEFAULT false,
  "reason" text,
  "updated_by" text,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("workspace_id", "agent_key")
);
CREATE INDEX IF NOT EXISTS "agent_steps_run_seq_idx" ON "agent_steps" ("run_id", "seq");
CREATE INDEX IF NOT EXISTS "agent_runs_ws_agent_started_idx" ON "agent_runs" ("workspace_id", "agent_key", "started_at" DESC);
-- Server-only table: block the public Data API.
ALTER TABLE "agent_switches" ENABLE ROW LEVEL SECURITY;
