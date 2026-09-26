-- CBAM supplier contacts, sent supplier requests, and the declarant profile
-- used on the Registry export file. Additive only. Mirrors src/db/schema.ts.
CREATE TABLE IF NOT EXISTS "cbam_suppliers" (
  "id" serial PRIMARY KEY,
  "workspace_id" text NOT NULL,
  "supplier_name" text NOT NULL,
  "email" text NOT NULL,
  "contact_name" text,
  "updated_by" text,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("workspace_id", "supplier_name")
);
CREATE TABLE IF NOT EXISTS "cbam_supplier_requests" (
  "id" serial PRIMARY KEY,
  "workspace_id" text NOT NULL,
  "year" integer NOT NULL,
  "supplier_name" text NOT NULL,
  "email" text NOT NULL,
  "subject" text NOT NULL,
  "body_hash" text NOT NULL,
  "provider" text NOT NULL,
  "provider_id" text,
  "approved_by" text NOT NULL,
  "run_id" integer,
  "sent_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cbam_supplier_requests_ws_idx" ON "cbam_supplier_requests" ("workspace_id", "year", "supplier_name", "sent_at" DESC);
CREATE TABLE IF NOT EXISTS "cbam_declarants" (
  "workspace_id" text PRIMARY KEY,
  "legal_name" text,
  "eori" text,
  "account_number" text,
  "reply_to_email" text,
  "updated_by" text,
  "updated_at" timestamp NOT NULL DEFAULT now()
);
-- Server-only tables: block the public Data API.
ALTER TABLE "cbam_suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cbam_supplier_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cbam_declarants" ENABLE ROW LEVEL SECURITY;
