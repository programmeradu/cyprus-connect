import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// Create PostgreSQL connection for Supabase
const createDbClient = () => {
  return postgres((process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL)!, {
    // The Supabase pooler caps concurrent client connections hard. Keeping the
    // local pool small makes extra queries queue instead of getting refused.
    max: 3,
    idle_timeout: 20,
    connect_timeout: 15,
    max_lifetime: 60 * 30,
    prepare: false, // required for pooled (pgbouncer-style) connections
  });
};

// Create a single instance for the app
let client: ReturnType<typeof postgres> | null = null;

const getClient = () => {
  if (!client) {
    client = createDbClient();
  }
  return client;
};

export const db = drizzle(getClient(), { schema });

export type Database = typeof db;
