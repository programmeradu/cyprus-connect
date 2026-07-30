import { db } from '../src/db';
import { workspaces } from '../src/db/schema';
import { draftVsmeReport } from '../src/lib/reports/vsme';
import { eq } from 'drizzle-orm';
async function main() {
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.ownerUserId, 'qa_console_agent')).limit(1);
  console.log('ws', ws?.id, ws?.name);
  const r = await draftVsmeReport({ workspace: ws, periodLabel: '2026', agentKey: 'vsme', createdBy: 'QA Agent' });
  console.log(r.id, r.sections.filter(s=>s.figures.length).length, 'sections with figures');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
