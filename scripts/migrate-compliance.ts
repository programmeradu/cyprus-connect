import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function migrateCompliance() {
  try {
    console.log('Starting compliance table migration...');

    // Drop old compliance tables if they exist
    await db.run(sql`DROP TABLE IF EXISTS compliance_progress`);
    console.log('✓ Dropped old compliance_progress table');

    // Create compliance_regulations table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS compliance_regulations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        regulation_id TEXT NOT NULL,
        name TEXT NOT NULL,
        jurisdiction TEXT NOT NULL,
        status TEXT NOT NULL,
        next_deadline TEXT NOT NULL,
        description TEXT NOT NULL,
        requirements TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    console.log('✓ Created compliance_regulations table');

    // Create compliance_documents table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS compliance_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        regulation_id TEXT NOT NULL,
        title TEXT NOT NULL,
        framework TEXT NOT NULL,
        status TEXT NOT NULL,
        content TEXT NOT NULL,
        generated_at TEXT NOT NULL,
        due_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    console.log('✓ Created compliance_documents table');

    // Create compliance_audit_logs table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS compliance_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    console.log('✓ Created compliance_audit_logs table');

    // Create compliance_settings table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS compliance_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE REFERENCES user(id) ON DELETE CASCADE,
        jurisdictions TEXT NOT NULL,
        auto_submit INTEGER NOT NULL DEFAULT 0,
        email_notifications INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    console.log('✓ Created compliance_settings table');

    console.log('✅ Compliance migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrateCompliance();
