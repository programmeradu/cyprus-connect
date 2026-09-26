# Architecture decisions

- Agent work runs through `src/lib/agents` only: a Postgres job queue (`agent_jobs`, SKIP LOCKED + lease), driven by the Cloudflare cron every 15 min via `/api/cron/agents`. Why: durable, single-flight and retryable on the existing Cloudflare + Postgres stack, no new vendor. Moving to Queues/Durable Objects needs founder sign-off.
- Agents act only through typed tools in `src/lib/agents/tools.ts`, each with a fixed risk level (0 read, 1 internal write, 2 outward, 3 legal/financial). Why: one place to enforce policy and write the ledger.
- Risk level 3 always needs a human, whatever the workspace policy says (`decideStep`). Why: EU AI Act human oversight on legal/financial acts.
- Every tool call writes an `agent_steps` row with a SHA-256 hash of its input, including blocked and failed calls. Why: complete, replayable audit trail.
- `agent_runs.trigger = 'sample'` marks seed data; only cron/manual/event runs are real work. Why: never present sample rows as agent activity.
- Database changes that the app needs are kept as plain SQL in `scripts/sql/` (the drizzle folder is read-only here) and mirrored in `src/db/schema.ts`. Why: reproducible schema without a second migration tool.

- Approval tasks store the exact tool call (`pending_tool`, `pending_input`, SHA-256 `pending_input_hash`); approving re-checks the fingerprint and runs it via `src/lib/agents/approvals.ts`. Why: a person signs exactly what the agent showed, nothing else.
- CBAM declarations are deterministic (`cbam-calc.ts`, no AI) and a signature is void if the draft hash changes. Why: legal act must be reproducible.
- A per-agent pause lives in `agent_switches` (scripts/sql/0020); the workspace kill switch in `agent_controls` still wins, and both are checked in `runJob` before any step. Why: stop one agent without stopping the rest, enforced in one place.
- Outward agent acts (supplier emails) are risk level 2 tools whose approval card carries the full text (`approvalDetail`); approving sends that exact text via `src/lib/email/send.ts` (Resend over HTTPS, SMTP only locally) and logs it in `cbam_supplier_requests` (scripts/sql/0021). Why: a person approves what leaves the company, and sending works on Cloudflare Workers.
- The CBAM Registry export (`cbam-registry-xml.ts`) is marked `schemaStatus="unvalidated"` and `documentStatus="final"` only when signed on the exact draft with a full declarant. Why: never pass off an unchecked file as Registry-ready.
- Every API route reads its body through `src/lib/validate.ts` (`readJson` with a zod schema, `readUpload`/`checkUpload` which identify files by their bytes); `tests/api-input-guard.test.ts` fails on direct `request.json()`/`formData()`. Why: size caps and schema checks in one place.
- Admin rights live only in `user_roles` (scripts/sql/0022), checked server-side by `src/lib/admin-auth.ts`; the QA identity is never admin. Why: a profile edit can never grant admin.
- Server errors go through `logger(scope).error(...)` (`src/lib/log.ts`), which redacts sensitive keys and returns a short ref; routes return the ref, never the raw error. Why: findable logs without leaking internals.
