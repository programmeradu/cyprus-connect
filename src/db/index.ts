import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';
import { cache } from 'react';

/**
 * `next dev` exposes a local Hyperdrive stand-in that forwards to wrangler's
 * localConnectionString (the capped session pooler). Skip it in development
 * and talk to DATABASE_URL directly through one shared pool.
 */
const IS_DEV = process.env.NODE_ENV === 'development';

function usesHyperdrive(): boolean {
  if (IS_DEV) return false;
  if (typeof process !== 'undefined' && process.env?.HYPERDRIVE_URL) return true;
  try {
    const ctx = (globalThis as unknown as Record<symbol, { env?: { HYPERDRIVE?: { connectionString?: string } } }>)[
      Symbol.for('__cloudflare-context__')
    ];
    const conn = ctx?.env?.HYPERDRIVE?.connectionString;
    // In local dev the binding just echoes wrangler's localConnectionString
    // (the raw pooler), so it is not a real Hyperdrive pool.
    return Boolean(conn) && !conn!.includes('pooler.supabase.com');
  } catch {
    return false;
  }
}

function getConnectionString(): string {
  if (IS_DEV) return toTransactionPool((process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL)!);
  if (typeof process !== 'undefined' && process.env?.HYPERDRIVE_URL) {
    return toTransactionPool(process.env.HYPERDRIVE_URL);
  }
  try {
    const symbol = Symbol.for('__cloudflare-context__');
    const ctx = (globalThis as unknown as Record<symbol, { env?: { HYPERDRIVE?: { connectionString?: string } } }>)[symbol];
    if (ctx?.env?.HYPERDRIVE?.connectionString) {
      return toTransactionPool(ctx.env.HYPERDRIVE.connectionString);
    }
  } catch {}
  return toTransactionPool((process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL)!);
}

/**
 * The hosted pooler's session mode (port 5432) allows only 15 clients in
 * total, shared by every environment using the database; once the preview,
 * the live site and local tools are all connected, requests fail with
 * EMAXCONNSESSION. Transaction mode (6543) multiplexes clients and works with
 * our settings (prepare: false), so use it whenever a session-mode URL is set.
 */
export function toTransactionPool(url: string): string {
  return url.replace(/(\.pooler\.supabase\.com):5432(?=\/|$|\?)/, "$1:6543");
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

// Kept on globalThis: the dev server loads this module once per route bundle,
// and a module-level pool per bundle still exhausts the connection limit.
const POOL_KEY = Symbol.for('vuneli.db.pool.v2');
type Db = ReturnType<typeof drizzle<typeof schema>>;
const store = globalThis as unknown as Record<symbol, Db | undefined>;

function getFallbackDb(): ReturnType<typeof drizzle<typeof schema>> {
  let fallbackDb = store[POOL_KEY];
  if (!fallbackDb) {
    const connStr = getConnectionString();
    const client = postgres(connStr, {
      max: 5,
      prepare: false,
      // The hosted pooler silently drops idle sockets; a query sent on a
      // dropped socket hangs forever. Retire sockets quickly so none go stale.
      idle_timeout: 5,
      max_lifetime: 120,
      keep_alive: 10,
      connect_timeout: 10,
    });
    fallbackDb = drizzle(client, { schema });
    store[POOL_KEY] = fallbackDb;
  }
  return fallbackDb;
}

function getDbInstance(): ReturnType<typeof drizzle<typeof schema>> {
  // Without Hyperdrive (tests, local dev, the preview) there is no pooler in
  // front of Postgres. React.cache only scopes inside a React render, so in
  // API routes it would open a fresh client on every access and exhaust the
  // database's connection limit. Share one small pool instead.
  if (process.env.NODE_ENV === 'test' || !usesHyperdrive()) {
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
