-- Bank payees a person marked "not a supplier". They stop being suggested on
-- the Suppliers page and on uploaded statements, and can be added back later.
CREATE TABLE IF NOT EXISTS supplier_payee_skips (
  workspace_id text NOT NULL,
  payee_key text NOT NULL,
  label text NOT NULL,
  skipped_by text,
  created_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, payee_key)
);
