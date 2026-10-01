-- 0032_eu_feed_items.sql
-- Official EU feeds shared by every workspace and agent:
--   source 'ted'    open public tenders in Cyprus (TED Search API)
--   source 'eurlex' recent EU legal acts on climate, energy and reporting (Cellar SPARQL)
-- Refreshed hourly by /api/cron/eu-feeds; items are public data, not workspace data.

CREATE TABLE IF NOT EXISTS eu_feed_items (
  id text PRIMARY KEY,                -- 'ted:<publication-number>' or 'eurlex:<celex>'
  source text NOT NULL CHECK (source IN ('ted', 'eurlex')),
  title text NOT NULL,
  title_lang text NOT NULL DEFAULT 'en',
  url text NOT NULL,
  published_at date NOT NULL,
  deadline date,
  buyer text,
  value_eur numeric,
  act_type text,
  topics text[] NOT NULL DEFAULT '{}',
  cpv text[] NOT NULL DEFAULT '{}',
  green boolean NOT NULL DEFAULT false,
  fetched_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eu_feed_items_source_date ON eu_feed_items (source, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_eu_feed_items_deadline ON eu_feed_items (deadline) WHERE source = 'ted';
