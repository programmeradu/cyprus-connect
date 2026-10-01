-- Ensure standard EU and Cyprus reporting obligations exist for every workspace
-- so the Next Deadline card, Compliance page, and Board summary show actionable deadlines.

INSERT INTO obligations (id, workspace_id, framework, title, due_date, status, progress_pct, agent_key, detail)
SELECT 
  w.id || '_cbam_q3' as id,
  w.id as workspace_id,
  'CBAM' as framework,
  'Q3 2026 declaration' as title,
  '2026-11-30' as due_date,
  'planned' as status,
  0 as progress_pct,
  'cbam' as agent_key,
  'Quarterly declaration of embedded emissions for covered imports under EU CBAM.' as detail
FROM workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM obligations o WHERE o.workspace_id = w.id AND o.framework = 'CBAM'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO obligations (id, workspace_id, framework, title, due_date, status, progress_pct, agent_key, detail)
SELECT 
  w.id || '_vsme_2026' as id,
  w.id as workspace_id,
  'VSME' as framework,
  'Voluntary disclosure 2026' as title,
  '2026-12-31' as due_date,
  'planned' as status,
  0 as progress_pct,
  'reporter' as agent_key,
  'EFRAG basic module sustainability disclosures requested by banks and corporate buyers.' as detail
FROM workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM obligations o WHERE o.workspace_id = w.id AND o.framework = 'VSME'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO obligations (id, workspace_id, framework, title, due_date, status, progress_pct, agent_key, detail)
SELECT 
  w.id || '_csrd_w3' as id,
  w.id as workspace_id,
  'CSRD' as framework,
  'Wave 3 first report' as title,
  '2027-01-01' as due_date,
  'planned' as status,
  0 as progress_pct,
  'auditor' as agent_key,
  'Double materiality assessment and ESRS data collection for upstream supply chains.' as detail
FROM workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM obligations o WHERE o.workspace_id = w.id AND o.framework = 'CSRD'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO obligations (id, workspace_id, framework, title, due_date, status, progress_pct, agent_key, detail)
SELECT 
  w.id || '_energy_audit' as id,
  w.id as workspace_id,
  'Cyprus law' as framework,
  'Energy audit renewal' as title,
  '2027-03-31' as due_date,
  'planned' as status,
  0 as progress_pct,
  'advisor' as agent_key,
  'Periodic energy efficiency audit under Cyprus national law.' as detail
FROM workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM obligations o WHERE o.workspace_id = w.id AND o.framework = 'Cyprus law'
)
ON CONFLICT (id) DO NOTHING;
