import { db } from '../src/db';
import { reports } from '../src/db/schema';
import { buildReportPdf } from '../src/lib/pdf/report-document';
import { writeFileSync } from 'fs';
async function main() {
  const [row] = await db.select().from(reports).limit(1);
  const doc = buildReportPdf({
    title: row.title, framework: row.framework, periodLabel: row.periodLabel,
    status: row.status, workspaceName: 'StaUniverse', agentName: row.agentName,
    summary: row.summary, sections: JSON.parse(row.sections),
  });
  writeFileSync('/tmp/qa-report.pdf', Buffer.from(doc.output('arraybuffer')));
  console.log('pages', doc.getNumberOfPages());
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
