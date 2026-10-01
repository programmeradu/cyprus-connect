#!/usr/bin/env node
/**
 * Post-build script: 
 * 1. Sets process.env.HYPERDRIVE_URL in fetch handler
 * 2. Adds `scheduled` (cron) and `email` (forwarded bills) handlers to the
 *    worker's default export. Cloudflare only calls handlers that sit on the
 *    default export object; a separate named export is never invoked.
 *
 * Run automatically as part of `npm run deploy` via the `build:cf` hook.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerPath = join(__dirname, "../.open-next/worker.js");

let source = readFileSync(workerPath, "utf8");

// 1. Ensure HYPERDRIVE_URL is initialized on fetch
if (!source.includes("process.env.HYPERDRIVE_URL = env.HYPERDRIVE.connectionString;")) {
  source = source.replace(
    "async fetch(request, env, ctx) {",
    `async fetch(request, env, ctx) {
        if (env.HYPERDRIVE?.connectionString) {
            process.env.HYPERDRIVE_URL = env.HYPERDRIVE.connectionString;
        }`
  );
  console.log("✅ Injected HYPERDRIVE_URL initialization");
}

// 2. Inject scheduled cron handler
const injection = `
// ── Cloudflare Cron: scheduled event handler ──────────────────────────────────
// Injected by scripts/inject-scheduled-handler.mjs after opennextjs build.
// Crons (see wrangler.jsonc → triggers.crons):
//   "0 * * * *"  → grant-alerts scan (hourly)
//   "15 6 * * *" → database keep-alive ping (daily)
//   "*/15 * * * *" → agent heartbeat (enqueue + run a bounded batch)
// Each job self-fetches its API route via the WORKER_SELF_REFERENCE binding.
async function __vuneliScheduled(event, env, _ctx) {
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
  if (!env.CRON_SECRET) {
    console.log("[grant-alerts cron] skipped: CRON_SECRET is not set");
    return;
  }
  await run("grant-alerts", "https://vuneli.com/api/cron/grant-alerts", {
    method: "POST",
    headers: { "x-cron-secret": env.CRON_SECRET },
  });
}

// ── Cloudflare Email Routing: forwarded utility bills ─────────────────────────
// Mail to <token>@<BILL_INBOX_DOMAIN> is routed to this worker. The raw message
// is handed to /api/public/inbound/bill-email, which checks the shared secret,
// finds the inbox by token and reads any attached bill. Unknown addresses are
// refused so the sender gets a bounce instead of silence.
const __VUNELI_MAX_EMAIL = 15 * 1024 * 1024;
async function __vuneliEmail(message, env, _ctx) {
  if (env.HYPERDRIVE?.connectionString) {
    process.env.HYPERDRIVE_URL = env.HYPERDRIVE.connectionString;
  }
  if (!env.INBOUND_EMAIL_SECRET) {
    console.log("[bill-email] refused: INBOUND_EMAIL_SECRET is not set");
    message.setReject("This bill inbox is not set up yet.");
    return;
  }
  if (message.rawSize > __VUNELI_MAX_EMAIL) {
    message.setReject("The message is larger than 15 MB.");
    return;
  }
  const raw = await new Response(message.raw).arrayBuffer();
  const res = await env.WORKER_SELF_REFERENCE.fetch("https://vuneli.com/api/public/inbound/bill-email", {
    method: "POST",
    headers: {
      "content-type": "message/rfc822",
      "x-inbound-secret": env.INBOUND_EMAIL_SECRET,
      "x-envelope-to": message.to,
    },
    body: raw,
  });
  const body = await res.text();
  console.log(\`[bill-email] status=\${res.status} body=\${body.slice(0, 300)}\`);
  if (res.status === 404) message.setReject("Unknown bill inbox address.");
}
// ─────────────────────────────────────────────────────────────────────────────
`;

if (!source.includes("function __vuneliScheduled")) {
  source += injection;
  console.log("✅ Added scheduled() and email() handlers to .open-next/worker.js");
}

// 3. Put both handlers on the default export, where Cloudflare looks for them.
if (!source.includes("scheduled: __vuneliScheduled")) {
  const marker = "export default {";
  if (!source.includes(marker)) throw new Error("worker.js has no `export default {`; cannot attach cron/email handlers");
  source = source.replace(marker, `${marker}\n    scheduled: __vuneliScheduled,\n    email: __vuneliEmail,`);
  console.log("✅ Attached scheduled + email to the default export");
}

writeFileSync(workerPath, source, "utf8");
console.log("✅ worker.js updated successfully");
