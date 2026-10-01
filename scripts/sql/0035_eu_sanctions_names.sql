-- 0035_eu_sanctions_names.sql
-- EU Consolidated Financial Sanctions List, one row per (entity, name/alias).
-- Public data shared by every workspace; replaced in full at most daily by
-- /api/cron/sanctions-list. Supplier checks match against `tokens` locally.
CREATE TABLE IF NOT EXISTS eu_sanctions_names (
  id bigserial PRIMARY KEY,
  entity_id text NOT NULL,
  name text NOT NULL,
  tokens text[] NOT NULL,
  subject_type text NOT NULL,
  programme text,
  country text,
  designated date,
  url text,
  list_date text,
  fetched_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eu_sanctions_tokens ON eu_sanctions_names USING gin (tokens);
CREATE INDEX IF NOT EXISTS idx_eu_sanctions_entity ON eu_sanctions_names (entity_id);
