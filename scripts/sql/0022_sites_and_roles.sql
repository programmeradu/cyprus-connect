-- Site on each reading (NULL = the whole workspace), and app roles kept in
-- their own table so a profile edit can never grant admin. Additive only.
-- Mirrors src/db/schema.ts.
ALTER TABLE "metric_readings" ADD COLUMN IF NOT EXISTS "site" text;
CREATE INDEX IF NOT EXISTS "metric_readings_ws_site_idx" ON "metric_readings" ("workspace_id", "site");

CREATE TABLE IF NOT EXISTS "user_roles" (
  "id" serial PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "role" text NOT NULL CHECK ("role" IN ('admin')),
  "granted_by" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("user_id", "role")
);

-- Grant the first admin by hand (founder), e.g.:
-- INSERT INTO user_roles (user_id, role, granted_by)
--   SELECT id, 'admin', 'founder' FROM "user" WHERE email = 'you@vuneli.com';
