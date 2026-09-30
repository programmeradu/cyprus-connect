import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';
import { cache } from 'react';

function getConnectionString(): string {
  if (typeof process !== 'undefined' && process.env?.HYPERDRIVE_URL) {
    return process.env.HYPERDRIVE_URL;
  }
  try {
    const symbol = Symbol.for('__cloudflare-context__');
    const ctx = (globalThis as unknown as Record<symbol, { env?: { HYPERDRIVE?: { connectionString?: string } } }>)[symbol];
    if (ctx?.env?.HYPERDRIVE?.connectionString) {
      return ctx.env.HYPERDRIVE.connectionString;
    }
  } catch {}
  return (process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL)!;
}

// React.cache scopes the database client per incoming Next.js request.
// Each request receives its own isolated postgres-js connection, preventing
// cross-request connection clobbering and isolate freeze socket corruption.
const getRequestDb = cache(() => {
  const connStr = getConnectionString();
  const client = postgres(connStr, {
    max: 1, // With Cloudflare Hyperdrive, 1 connection per request is optimal
    prepare: false, // Required for pooled (pgbouncer / Hyperdrive) connections
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return drizzle(client, { schema });
});

let fallbackDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getFallbackDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!fallbackDb) {
    const connStr = getConnectionString();
    const client = postgres(connStr, {
      max: 3,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    fallbackDb = drizzle(client, { schema });
  }
  return fallbackDb;
}

function getDbInstance(): ReturnType<typeof drizzle<typeof schema>> {
  if (process.env.NODE_ENV === 'test') {
    return getFallbackDb();
  }
  try {
    return getRequestDb();
  } catch {
    return getFallbackDb();
  }
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    const instance = getDbInstance();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

export type Database = typeof db;
