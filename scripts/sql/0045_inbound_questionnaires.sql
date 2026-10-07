-- Table for customer / buyer inbound ESG questionnaires (scripts/sql/0045)
CREATE TABLE IF NOT EXISTS inbound_questionnaires (
  id SERIAL PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'upload', -- 'upload' | 'email'
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'xlsx' | 'csv' | 'pdf'
  file_url TEXT,
  requester_name TEXT,
  requester_email TEXT,
  total_questions INTEGER NOT NULL DEFAULT 0,
  answered_questions INTEGER NOT NULL DEFAULT 0,
  verified_questions INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ready', -- 'parsing' | 'ready' | 'exported'
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inbound_questionnaires_workspace ON inbound_questionnaires(workspace_id);
CREATE INDEX IF NOT EXISTS idx_inbound_questionnaires_hash ON inbound_questionnaires(hash);
