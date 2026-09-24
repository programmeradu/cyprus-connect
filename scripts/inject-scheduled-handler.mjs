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
// Crons (see wrangler.jsonc → triggers.crons):
//   "0 * * * *"  → grant-alerts scan (hourly)
//   "15 6 * * *" → database keep-alive ping (daily)
// Each job self-fetches its API route via the WORKER_SELF_REFERENCE binding.
export async function scheduled(event, env, _ctx) {
  const run = async (name, url, init) => {
    const res = await env.WORKER_SELF_REFERENCE.fetch(url, init);
    const body = await res.text();
    console.log(\`[\${name} cron] status=\${res.status} body=\${body.slice(0, 300)}\`);
    if (!res.ok) throw new Error(\`\${name} cron failed: HTTP \${res.status}\`);
  };
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

let source = readFileSync(workerPath, "utf8");

if (source.includes("export async function scheduled")) {
  console.log("✅ scheduled handler already present in worker.js — skipping.");
  process.exit(0);
}

source += injection;
writeFileSync(workerPath, source, "utf8");
console.log("✅ Injected scheduled() handler into .open-next/worker.js");
