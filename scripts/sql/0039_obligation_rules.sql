-- Deadlines that know the business. Run once on the live database after 0038.

-- Each deadline row now says which rule produced it, whether it applies, why,
-- and the official source. Rows a person edited are never overwritten.
ALTER TABLE obligations ADD COLUMN IF NOT EXISTS rule_id text;
ALTER TABLE obligations ADD COLUMN IF NOT EXISTS match text;          -- applies | might | not (null = added by a person)
ALTER TABLE obligations ADD COLUMN IF NOT EXISTS reason text;
ALTER TABLE obligations ADD COLUMN IF NOT EXISTS reason_el text;
ALTER TABLE obligations ADD COLUMN IF NOT EXISTS title_el text;
ALTER TABLE obligations ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE obligations ADD COLUMN IF NOT EXISTS user_edited boolean NOT NULL DEFAULT false;
ALTER TABLE obligations ADD COLUMN IF NOT EXISTS checked_at timestamptz;
CREATE INDEX IF NOT EXISTS obligations_ws_match ON obligations (workspace_id, match);

-- Company facts that decide which deadlines apply. Null = not answered yet.
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS imports_cbam_goods boolean;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS eudr_commodities boolean;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS consumer_claims boolean;

-- Amending acts seen for each tracked base law (EUR-Lex). A new one marks the
-- deadlines built on that law "under review" until a person confirms the rule.
CREATE TABLE IF NOT EXISTS law_watch (
  base_celex text NOT NULL,
  amending_celex text NOT NULL,
  act_date text NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_note text,
  PRIMARY KEY (base_celex, amending_celex)
);

-- Amendments already reflected in the rulebook on 1 Oct 2026 (researched in
-- docs/research/DEADLINES_2026-10-01.md). Anything newer shows as under review.
INSERT INTO law_watch (base_celex, amending_celex, act_date, reviewed_at, reviewed_note) VALUES
  ('32023R0956', '32025R2083', '2025-10-08', now(), 'CBAM simplification: 50 t threshold, declaration 30 Sep'),
  ('32022L2464', '32025L0794', '2025-04-14', now(), 'Stop-the-clock: wave 2 reports in 2028'),
  ('32024L1760', '32025L0794', '2025-04-14', now(), 'Stop-the-clock'),
  ('32022L2464', '32026L0470', '2026-02-24', now(), 'Omnibus I: >1,000 employees and >EUR 450m'),
  ('32024L1760', '32026L0470', '2026-02-24', now(), 'Omnibus I: >5,000 employees and >EUR 1.5bn'),
  ('32023R1115', '32025R2650', '2025-12-19', now(), 'EUDR delay: 30 Dec 2026 / 30 Jun 2027')
ON CONFLICT DO NOTHING;

-- The Deadlines agent.
INSERT INTO agents (key, name, role, mission, cadence, autonomy, status, health_score, glyph, sort_order)
VALUES ('deadlines', 'Deadline keeper', 'Legal deadlines',
        'Checks which EU and Cyprus deadlines apply to the company from its own facts, shows the law behind each, and asks for the facts it needs.',
        'daily', 'suggest', 'active', 100, 'spine', 10)
ON CONFLICT (key) DO NOTHING;
