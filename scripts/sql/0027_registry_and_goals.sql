-- Company register link + goals for agent jobs.
-- Additive only. Mirrors src/db/schema.ts (workspaces, agentJobs).
--
-- Registry columns hold what the Cyprus Registrar of Companies publishes
-- (open data, CC BY 4.0) for the company the owner linked. The owner links
-- it; agents read it. Nothing here is typed in by hand.

ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "registration_no" text;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "registry_type" text;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "registry_name" text;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "registry_status" text;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "registry_registered_on" text;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "registry_address" text;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "registry_checked_at" timestamp;

-- A goal a person (or the schedule) gives a planning agent, in plain words.
-- Null for agents that follow a fixed routine.
ALTER TABLE "agent_jobs" ADD COLUMN IF NOT EXISTS "goal" text;
