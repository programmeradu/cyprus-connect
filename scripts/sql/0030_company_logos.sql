-- 0030_company_logos.sql
-- Persistent storage for company logos fetched from Logo.dev and favicon fallbacks.
-- Ensures Logo.dev API credits are consumed at most once per domain.

CREATE TABLE IF NOT EXISTS company_logos (
  domain text PRIMARY KEY,
  content_type text NOT NULL,
  data text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'logo_dev',
  status integer NOT NULL DEFAULT 200,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_logos_status ON company_logos (status);
