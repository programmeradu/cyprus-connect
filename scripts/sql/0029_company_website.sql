-- Company website on the account profile, next to the other company facts.
-- Used to show the company's real logo. Additive only. Mirrors src/db/schema.ts (user).
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "company_website" text;
