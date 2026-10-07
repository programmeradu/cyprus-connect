-- 0044_vsme_passports.sql
-- Digital VSME Passport for SMEs to share verified ESG disclosures with buyers,
-- banks and auditors. Includes access token, share controls and view tracking.

CREATE TABLE IF NOT EXISTS vsme_passports (
  id serial PRIMARY KEY,
  workspace_id text NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  share_token text NOT NULL UNIQUE,
  is_public boolean NOT NULL DEFAULT true,
  headline text,
  custom_notes text,
  view_count integer NOT NULL DEFAULT 0,
  last_viewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vsme_passports_slug ON vsme_passports (slug);
CREATE INDEX IF NOT EXISTS idx_vsme_passports_token ON vsme_passports (share_token);
CREATE INDEX IF NOT EXISTS idx_vsme_passports_workspace ON vsme_passports (workspace_id);
