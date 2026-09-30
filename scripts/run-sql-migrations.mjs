import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!url) {
  console.error('No DATABASE_URL or SUPABASE_DATABASE_URL found in .env');
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });

async function runMigrations() {
  const sqlDir = path.join(__dirname, 'sql');
  const files = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql')).sort();
  
  console.log(`Found ${files.length} SQL migration files:`, files);
  
  for (const file of files) {
    console.log(`\nExecuting ${file}...`);
    const filePath = path.join(sqlDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    try {
      await sql.unsafe(content);
      console.log(`✅ ${file} executed successfully.`);
    } catch (err) {
      console.error(`❌ Error in ${file}:`, err.message);
    }
  }
  
  await sql.end();
  console.log('\nAll migration files processed.');
}

runMigrations().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
