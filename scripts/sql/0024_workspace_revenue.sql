-- Yearly revenue in euro, entered by the owner in Settings (null = not given).
-- Additive only. Mirrors src/db/schema.ts.
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "revenue_eur" real;
ALTER TABLE "workspaces" DROP CONSTRAINT IF EXISTS "workspaces_revenue_eur_nonneg";
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_revenue_eur_nonneg" CHECK ("revenue_eur" IS NULL OR "revenue_eur" >= 0);
-- The QA workspace was seeded with 3 sites; reset it to the real default.
UPDATE "workspaces" SET "sites" = 1 WHERE "id" = 'ws_qa_console_agent';
