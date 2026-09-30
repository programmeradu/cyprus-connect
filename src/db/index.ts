import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

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

function getCloudflareCtx() {
  try {
    const symbol = Symbol.for('__cloudflare-context__');
    const ctx = (globalThis as unknown as Record<symbol, { ctx?: { waitUntil: (p: Promise<unknown>) => void } }>)[symbol];
    return ctx?.ctx;
  } catch {
    return null;
  }
}

let currentRequestId = -1;
let currentClient: ReturnType<typeof postgres> | null = null;
let currentDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

function cleanupClient(clientToClose: ReturnType<typeof postgres> | null) {
  if (!clientToClose) return;
  try {
    const closePromise = clientToClose.end({ timeout: 0 }).catch(() => {});
    const cfCtx = getCloudflareCtx();
    if (cfCtx && typeof cfCtx.waitUntil === 'function') {
      cfCtx.waitUntil(closePromise);
    }
  } catch {}
}

// Global cleanup hook callable from worker fetch lifecycle
(globalThis as unknown as Record<string, unknown>).__CLEANUP_DB__ = async (reqId: number) => {
  if (currentRequestId === reqId && currentClient) {
    const client = currentClient;
    currentClient = null;
    currentDb = null;
    await client.end({ timeout: 0 }).catch(() => {});
  }
};

function getDbInstance(): ReturnType<typeof drizzle<typeof schema>> {
  const reqId = ((globalThis as unknown as Record<string, unknown>).__CF_REQUEST_ID__ as number) ?? 0;

  // If request ID has changed, close old client and instantiate fresh for this request
  if (currentClient && currentRequestId !== reqId) {
    cleanupClient(currentClient);
    currentClient = null;
    currentDb = null;
  }

  if (!currentDb || !currentClient) {
    currentRequestId = reqId;
    const connStr = getConnectionString();
    currentClient = postgres(connStr, {
      max: 5,
      fetch_types: false,
      prepare: false, // required for pooled (pgbouncer-style) connections
      connect_timeout: 10,
      idle_timeout: 0,
      onclose() {
        if (currentClient) {
          currentClient = null;
          currentDb = null;
        }
      },
    });
    currentDb = drizzle(currentClient, { schema });
  }
  return currentDb;
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
