/**
 * Creates the reports table and the deliverable columns on copilot_proposals.
 * Safe to run more than once.
 */
import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS reports (
      id text PRIMARY KEY,
      workspace_id text NOT NULL,
      framework text NOT NULL DEFAULT 'VSME',
      title text NOT NULL,
      period_label text NOT NULL,
      status text NOT NULL DEFAULT 'draft',
      agent_key text NOT NULL DEFAULT 'copilot',
      agent_name text,
      task_id integer,
      proposal_id integer,
      summary text,
      sections text NOT NULL,
      sources text,
      created_by text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS reports_workspace_idx ON reports (workspace_id)`);
  await db.execute(sql`ALTER TABLE copilot_proposals ADD COLUMN IF NOT EXISTS deliverable_href text`);
  await db.execute(sql`ALTER TABLE copilot_proposals ADD COLUMN IF NOT EXISTS deliverable_title text`);
  console.log('reports migration complete');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
