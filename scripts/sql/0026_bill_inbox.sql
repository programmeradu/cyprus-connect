-- Bill inbox: one private forwarding address per account, so utility e-bills
-- (EAC, water boards) arrive by email and are read without an upload.
-- Additive only. Mirrors src/db/schema.ts (billInboxes).
-- The token is the only secret in the address; rotating it retires the old one.

CREATE TABLE IF NOT EXISTS "bill_inboxes" (
  "user_id" text PRIMARY KEY,
  "workspace_id" text NOT NULL,
  "token" text NOT NULL UNIQUE,
  "last_message_at" timestamp,
  "last_message_from" text,
  "last_message_subject" text,
  -- Outcome per attachment of the last message: [{file, kind, ok, duplicate, reason}]
  "last_result" jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- A provider confirmation (e.g. Gmail forwarding code) shown to the owner.
  "confirmation" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
