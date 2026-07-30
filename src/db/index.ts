import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// Create PostgreSQL connection for Supabase
const createDbClient = () => {
  return postgres((process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL)!, {
    max: 10, // Maximum number of connections in the pool
    idle_timeout: 20,
    connect_timeout: 10,
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
