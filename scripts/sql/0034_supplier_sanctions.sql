-- 0034_supplier_sanctions.sql
-- Last OpenSanctions screening per supplier: when, the outcome ('clear' or
-- 'possible_match') and up to five possible matches with source links.
-- Additive only. Mirrors src/db/schema.ts (cbamSuppliers).
ALTER TABLE "cbam_suppliers" ADD COLUMN IF NOT EXISTS "sanctions_checked_at" timestamp;
ALTER TABLE "cbam_suppliers" ADD COLUMN IF NOT EXISTS "sanctions_status" text;
ALTER TABLE "cbam_suppliers" ADD COLUMN IF NOT EXISTS "sanctions_hits" jsonb NOT NULL DEFAULT '[]'::jsonb;
