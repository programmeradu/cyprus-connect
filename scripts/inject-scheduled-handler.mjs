#!/usr/bin/env node
/**
 * Post-build script: injects a `scheduled` export into .open-next/worker.js
 * so Cloudflare's cron trigger can self-fetch the grant-alerts API route.
 *
 * Run automatically as part of `npm run deploy` via the `build:cf` hook.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerPath = join(__dirname, "../.open-next/worker.js");

const injection = `
// ── Cloudflare Cron: scheduled event handler ──────────────────────────────────
// Injected by scripts/inject-scheduled-handler.mjs after opennextjs build.
// Fires every hour (see wrangler.jsonc → triggers.crons) and self-fetches
// the grant-alerts cron route via the WORKER_SELF_REFERENCE service binding.
export async function scheduled(_event, env, _ctx) {
  const secret =
    env.CRON_SECRET ?? "vuneli-cron-grant-alerts-2026-cy";
  const url = \`https://vuneli.com/api/cron/grant-alerts?secret=\${secret}\`;
  const res = await env.WORKER_SELF_REFERENCE.fetch(url, { method: "POST" });
  const body = await res.text();
  console.log(\`[grant-alerts cron] status=\${res.status} body=\${body}\`);
  if (!res.ok) {
    throw new Error(\`Grant-alerts cron failed: HTTP \${res.status} — \${body}\`);
  }
}
// ─────────────────────────────────────────────────────────────────────────────
`;

let source = readFileSync(workerPath, "utf8");

if (source.includes("export async function scheduled")) {
  console.log("✅ scheduled handler already present in worker.js — skipping.");
  process.exit(0);
}

source += injection;
writeFileSync(workerPath, source, "utf8");
console.log("✅ Injected scheduled() handler into .open-next/worker.js");
