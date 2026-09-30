-- Bank links (PSD2 account information, read-only) and the payments read from them.
-- Additive only. Mirrors src/db/schema.ts (bankLinks, bankTransactions).
-- No bank passwords or user tokens are stored: the bank issues a subscription id
-- that the app uses with its own short-lived client token.

CREATE TABLE IF NOT EXISTS "bank_links" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL,
  "provider" text NOT NULL DEFAULT 'boc',
  "environment" text NOT NULL DEFAULT 'sandbox',
  "subscription_id" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "account_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "consent_expires_on" text,
  "last_sync_at" timestamp,
  "last_error" text,
  "created_by" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "bank_links_status_chk" CHECK ("status" IN ('pending','active','expired','revoked'))
);
CREATE UNIQUE INDEX IF NOT EXISTS "bank_links_subscription_uq" ON "bank_links" ("provider", "subscription_id");
CREATE INDEX IF NOT EXISTS "bank_links_workspace_idx" ON "bank_links" ("workspace_id", "provider");

CREATE TABLE IF NOT EXISTS "bank_transactions" (
  "id" serial PRIMARY KEY,
  "link_id" text NOT NULL REFERENCES "bank_links"("id") ON DELETE CASCADE,
  "workspace_id" text NOT NULL,
  "account_id" text NOT NULL,
  "provider_tx_id" text NOT NULL,
  "booked_on" date NOT NULL,
  "amount" real NOT NULL,
  "currency" text NOT NULL DEFAULT 'EUR',
  "direction" text NOT NULL DEFAULT 'unknown',
  "description" text,
  "category" text NOT NULL DEFAULT 'other',
  "matched_rule" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "bank_tx_direction_chk" CHECK ("direction" IN ('debit','credit','unknown'))
);
CREATE UNIQUE INDEX IF NOT EXISTS "bank_tx_uq" ON "bank_transactions" ("link_id", "account_id", "provider_tx_id");
CREATE INDEX IF NOT EXISTS "bank_tx_workspace_idx" ON "bank_transactions" ("workspace_id", "booked_on");
