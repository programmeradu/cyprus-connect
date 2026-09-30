#!/usr/bin/env node
/**
 * Post-build script: 
 * 1. Sets request ID and process.env.HYPERDRIVE_URL in fetch handler
 * 2. Wraps handler in try...finally with ctx.waitUntil cleanup for database connections
 * 3. Injects a `scheduled` export into .open-next/worker.js
 *    so Cloudflare's cron trigger can self-fetch API routes.
 *
 * Run automatically as part of `npm run deploy` via the `build:cf` hook.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerPath = join(__dirname, "../.open-next/worker.js");

let source = readFileSync(workerPath, "utf8");

// 1. Ensure __CF_REQUEST_ID__ and HYPERDRIVE_URL are initialized on fetch
if (!source.includes("globalThis.__CF_REQUEST_ID__ =")) {
  source = source.replace(
    "async fetch(request, env, ctx) {",
    `async fetch(request, env, ctx) {
        globalThis.__CF_REQUEST_ID__ = (globalThis.__CF_REQUEST_ID__ || 0) + 1;
        const reqId = globalThis.__CF_REQUEST_ID__;
        if (env.HYPERDRIVE?.connectionString) {
            process.env.HYPERDRIVE_URL = env.HYPERDRIVE.connectionString;
        }`
  );
  console.log("✅ Injected request ID and HYPERDRIVE_URL initialization");
}

// 2. Wrap default handler call in try...finally for database connection cleanup
if (!source.includes("ctx.waitUntil(globalThis.__CLEANUP_DB__(reqId))")) {
  source = source.replace(
    "return handler(reqOrResp, env, ctx, request.signal);",
    `try {
                return await handler(reqOrResp, env, ctx, request.signal);
            } finally {
                if (typeof globalThis.__CLEANUP_DB__ === "function") {
                    ctx.waitUntil(globalThis.__CLEANUP_DB__(reqId));
                }
            }`
  );
  console.log("✅ Injected database cleanup hook into fetch handler");
}

// 3. Inject scheduled cron handler
const injection = `
// ── Cloudflare Cron: scheduled event handler ──────────────────────────────────
// Injected by scripts/inject-scheduled-handler.mjs after opennextjs build.
// Crons (see wrangler.jsonc → triggers.crons):
//   "0 * * * *"  → grant-alerts scan (hourly)
//   "15 6 * * *" → database keep-alive ping (daily)
//   "*/15 * * * *" → agent heartbeat (enqueue + run a bounded batch)
// Each job self-fetches its API route via the WORKER_SELF_REFERENCE binding.
export async function scheduled(event, env, _ctx) {
  if (env.HYPERDRIVE?.connectionString) {
    process.env.HYPERDRIVE_URL = env.HYPERDRIVE.connectionString;
  }
  const run = async (name, url, init) => {
    const res = await env.WORKER_SELF_REFERENCE.fetch(url, init);
    const body = await res.text();
    console.log(\`[\${name} cron] status=\${res.status} body=\${body.slice(0, 300)}\`);
    if (!res.ok) throw new Error(\`\${name} cron failed: HTTP \${res.status}\`);
  };
  if (event.cron === "*/15 * * * *") {
    if (!env.CRON_SECRET) {
      console.log("[agents cron] skipped: CRON_SECRET is not set");
      return;
    }
    await run("agents", "https://vuneli.com/api/cron/agents", {
      method: "POST",
      headers: { "x-cron-secret": env.CRON_SECRET },
    });
    return;
  }
  if (event.cron === "15 6 * * *") {
    await run("keep-alive", "https://vuneli.com/api/keep-alive", { method: "GET" });
    return;
  }
  const secret = env.CRON_SECRET ?? "vuneli-cron-grant-alerts-2026-cy";
  await run(
    "grant-alerts",
    \`https://vuneli.com/api/cron/grant-alerts?secret=\${secret}\`,
    { method: "POST" },
  );
}
// ─────────────────────────────────────────────────────────────────────────────
`;

if (!source.includes("export async function scheduled")) {
  source += injection;
  console.log("✅ Injected scheduled() handler into .open-next/worker.js");
}

writeFileSync(workerPath, source, "utf8");
console.log("✅ worker.js updated successfully");
