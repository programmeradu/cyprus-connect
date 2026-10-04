-- Action plan projects and the evidence that confirms them.
-- A project is never ticked done by hand: it is confirmed only when every
-- check its type needs has passed (bill drop, purchase proof).

CREATE TABLE IF NOT EXISTS public.action_projects (
  id            serial PRIMARY KEY,
  workspace_id  text NOT NULL,
  type          text NOT NULL,             -- solar | efficiency | water | fleet
  stage         text NOT NULL DEFAULT 'under_way', -- under_way | being_checked | confirmed
  inputs        jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_on    text NOT NULL,             -- YYYY-MM-DD
  installed_on  text,                      -- YYYY-MM-DD, set when the person says it is in place
  confirmed_at  timestamptz,
  confirmed_figures jsonb,                 -- snapshot of figures and checks at confirmation
  created_by    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, type)
);
CREATE INDEX IF NOT EXISTS action_projects_ws ON public.action_projects (workspace_id);

CREATE TABLE IF NOT EXISTS public.action_evidence (
  id                  serial PRIMARY KEY,
  project_id          integer NOT NULL REFERENCES public.action_projects(id) ON DELETE CASCADE,
  workspace_id        text NOT NULL,
  kind                text NOT NULL,       -- invoice | payment
  document_id         integer,             -- documents.id for an invoice
  bank_transaction_id integer,             -- bank_transactions.id for a payment
  file_name           text,
  quotes              jsonb NOT NULL DEFAULT '{}'::jsonb, -- text the reader found: supplier, date, item
  created_by          text,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS action_evidence_project ON public.action_evidence (project_id);

GRANT ALL ON public.action_projects TO service_role;
GRANT ALL ON public.action_evidence TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.action_projects_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.action_evidence_id_seq TO service_role;
ALTER TABLE public.action_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_evidence ENABLE ROW LEVEL SECURITY;
-- No browser policies: the app reads and writes these only from its own server.
