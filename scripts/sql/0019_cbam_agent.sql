-- CBAM agent: import lines, declaration drafts, and approval tasks that carry
-- the exact tool call a person is approving. Additive only. Mirrors src/db/schema.ts.
CREATE TABLE IF NOT EXISTS "cbam_import_lines" (
  "id" serial PRIMARY KEY, "workspace_id" text NOT NULL, "year" integer NOT NULL,
  "import_date" text NOT NULL, "cn_code" text NOT NULL, "description" text,
  "origin_country" text NOT NULL, "supplier_name" text NOT NULL, "installation_id" text,
  "net_mass" real NOT NULL, "direct_see" real, "indirect_see" real, "customs_ref" text,
  "source_kind" text NOT NULL DEFAULT 'csv', "source_hash" text NOT NULL,
  "created_by" text, "created_at" timestamp NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS "cbam_import_lines_dedupe" ON "cbam_import_lines" ("workspace_id", "source_hash");
CREATE INDEX IF NOT EXISTS "cbam_import_lines_year_idx" ON "cbam_import_lines" ("workspace_id", "year");
CREATE TABLE IF NOT EXISTS "cbam_declarations" (
  "id" serial PRIMARY KEY, "workspace_id" text NOT NULL, "year" integer NOT NULL,
  "status" text NOT NULL DEFAULT 'draft', "draft" text NOT NULL, "draft_hash" text NOT NULL,
  "run_id" integer, "signed_by" text, "signed_at" timestamp, "signed_hash" text,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("workspace_id", "year"));
ALTER TABLE "agent_tasks" ADD COLUMN IF NOT EXISTS "run_id" integer;
ALTER TABLE "agent_tasks" ADD COLUMN IF NOT EXISTS "pending_tool" text;
ALTER TABLE "agent_tasks" ADD COLUMN IF NOT EXISTS "pending_input" text;
ALTER TABLE "agent_tasks" ADD COLUMN IF NOT EXISTS "pending_input_hash" text;
ALTER TABLE "agent_tasks" ADD COLUMN IF NOT EXISTS "result" text;
-- Server-only tables: block the public Data API.
ALTER TABLE "cbam_import_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cbam_declarations" ENABLE ROW LEVEL SECURITY;
