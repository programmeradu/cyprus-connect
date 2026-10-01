-- 0031_document_fingerprints.sql
-- Register of every PDF Vuneli has issued, keyed by the SHA-256 fingerprint
-- printed on the document. The public check page (/verify) reads only the
-- columns a holder of the document can already see on paper.

CREATE TABLE IF NOT EXISTS document_fingerprints (
  hash text PRIMARY KEY CHECK (hash ~ '^[0-9a-f]{64}$'),
  prefix text GENERATED ALWAYS AS (substring(hash from 1 for 16)) STORED,
  kind text NOT NULL CHECK (kind IN ('board-summary', 'report', 'cbam')),
  doc_id text NOT NULL,
  title text NOT NULL,
  company text NOT NULL,
  workspace_id text NOT NULL,
  issued_by text NOT NULL,
  issued_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_fingerprints_prefix ON document_fingerprints (prefix);
CREATE INDEX IF NOT EXISTS idx_document_fingerprints_workspace ON document_fingerprints (workspace_id, created_at DESC);
