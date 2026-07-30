import { db } from '../src/db';
import { reports } from '../src/db/schema';
import { sql } from 'drizzle-orm';
async function main() {
  await db.execute(sql`DELETE FROM reports WHERE sections LIKE '%No draft narrative was produced%'`);
  const rows = await db.select({ id: reports.id, title: reports.title }).from(reports);
  console.log(rows);
  process.exit(0);
}
main();
