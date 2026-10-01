-- Funding matching (Grant scout) and stored translations.
-- Run once on the live database after 0035.

-- Each public call's eligibility rules, read once by AI with a quote per rule.
ALTER TABLE grant_opportunities ADD COLUMN IF NOT EXISTS rules jsonb;
ALTER TABLE grant_opportunities ADD COLUMN IF NOT EXISTS rules_hash text;
ALTER TABLE grant_opportunities ADD COLUMN IF NOT EXISTS content_hash text;
ALTER TABLE grant_opportunities ADD COLUMN IF NOT EXISTS rules_extracted_at timestamptz;

-- One verdict per workspace and call, worked out by fixed code.
CREATE TABLE IF NOT EXISTS funding_matches (
  workspace_id text NOT NULL,
  opportunity_id integer NOT NULL REFERENCES grant_opportunities(id) ON DELETE CASCADE,
  verdict text NOT NULL,              -- strong | needs_info | hidden
  met jsonb NOT NULL DEFAULT '[]',
  missing jsonb NOT NULL DEFAULT '[]',
  failed jsonb NOT NULL DEFAULT '[]',
  rules_hash text,
  checked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, opportunity_id)
);
CREATE INDEX IF NOT EXISTS funding_matches_ws_verdict ON funding_matches (workspace_id, verdict);

-- Cached machine translations of public titles and agent notes.
CREATE TABLE IF NOT EXISTS text_translations (
  source_hash text NOT NULL,
  locale text NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_hash, locale)
);

-- Official Greek title for EUR-Lex acts.
ALTER TABLE eu_feed_items ADD COLUMN IF NOT EXISTS title_el text;

-- The Grant scout agent.
INSERT INTO agents (key, name, role, mission, cadence, autonomy, status, health_score, glyph, sort_order)
VALUES ('grants', 'Grant scout', 'Funding matching',
        'Checks every open funding call against the company and shows only strong fits; asks for the facts needed to confirm the rest.',
        'daily', 'suggest', 'active', 100, 'spine', 9)
ON CONFLICT (key) DO NOTHING;
