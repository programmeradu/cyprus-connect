# Architecture decisions

- Agent work runs through `src/lib/agents` only: a Postgres job queue (`agent_jobs`, SKIP LOCKED + lease), driven by the Cloudflare cron every 15 min via `/api/cron/agents`. Why: durable, single-flight and retryable on the existing Cloudflare + Postgres stack, no new vendor. Moving to Queues/Durable Objects needs founder sign-off.
- Agents act only through typed tools in `src/lib/agents/tools.ts`, each with a fixed risk level (0 read, 1 internal write, 2 outward, 3 legal/financial). Why: one place to enforce policy and write the ledger.
- Risk level 3 always needs a human, whatever the workspace policy says (`decideStep`). Why: EU AI Act human oversight on legal/financial acts.
- Every tool call writes an `agent_steps` row with a SHA-256 hash of its input, including blocked and failed calls. Why: complete, replayable audit trail.
- `agent_runs.trigger = 'sample'` marks seed data; only cron/manual/event runs are real work. Why: never present sample rows as agent activity.
- Database changes that the app needs are kept as plain SQL in `scripts/sql/` (the drizzle folder is read-only here) and mirrored in `src/db/schema.ts`. Why: reproducible schema without a second migration tool.
