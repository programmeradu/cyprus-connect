import { db } from './src/db';
import { workspaces } from './src/db/schema';
import { draftVsmeReport } from './src/lib/reports/vsme';
async function main() {
  const [ws] = await db.select().from(workspaces).limit(1);
  console.log('workspace', ws?.id, ws?.name);
  const r = await draftVsmeReport({ workspace: ws, periodLabel: '2026', agentKey: 'vsme', createdBy: 'QA Agent' });
  console.log(r.id, r.title);
  console.log(r.summary.slice(0, 220));
  console.log(r.sections.slice(0, 3).map(s => `${s.code}: ${s.body.slice(0, 140)} | figs ${s.figures.length} | gaps ${s.gaps.length}`).join('\n'));
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
