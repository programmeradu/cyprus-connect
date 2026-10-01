-- One supplier list per workspace. cbam_suppliers becomes the home for every
-- supplier, not only CBAM ones: email is optional, and the row can hold the
-- Cyprus company register match, the WikiRate match and the bank payee name
-- it was added from. Additive only. Mirrors src/db/schema.ts (cbamSuppliers).
ALTER TABLE "cbam_suppliers" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "cbam_suppliers" ADD COLUMN IF NOT EXISTS "source" text NOT NULL DEFAULT 'manual';
ALTER TABLE "cbam_suppliers" ADD COLUMN IF NOT EXISTS "bank_payee" text;
ALTER TABLE "cbam_suppliers" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "cbam_suppliers" ADD COLUMN IF NOT EXISTS "registration_no" text;
ALTER TABLE "cbam_suppliers" ADD COLUMN IF NOT EXISTS "registry_name" text;
ALTER TABLE "cbam_suppliers" ADD COLUMN IF NOT EXISTS "registry_status" text;
ALTER TABLE "cbam_suppliers" ADD COLUMN IF NOT EXISTS "registry_checked_at" timestamp;
ALTER TABLE "cbam_suppliers" ADD COLUMN IF NOT EXISTS "wikirate_url" text;
ALTER TABLE "cbam_suppliers" ADD COLUMN IF NOT EXISTS "wikirate_checked_at" timestamp;
