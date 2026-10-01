# Architecture decisions

Scoped rules: `src/lib/agents/AGENTS.md` (agent runtime, approvals, CBAM), `src/lib/bank/AGENTS.md` (bank links).

- Schema changes are plain SQL in `scripts/sql/`, mirrored in `src/db/schema.ts`. Why: drizzle folder is read-only; one migration path.
- API bodies/uploads go through `src/lib/validate.ts`; `tests/api-input-guard.test.ts` enforces it. Why: size caps and schema checks in one place.
- Server errors use `logger(scope).error` (`src/lib/log.ts`); routes return its ref, never the raw error. Why: findable logs, no leaks.
- Admin rights live only in `user_roles`, checked by `src/lib/admin-auth.ts`; QA identity is never admin. Why: profile edits can't grant admin.
- /app pages read/write only via `workspace-store.ts` (`useWorkspaceResource`/`useWorkspaceAction`); `tests/app-data-guard.test.ts` enforces it. Why: one shared copy of data.
- Company facts have one home (profile: name/industry/size/country; workspace: sites/revenue), read via `company.server.ts`, written via `/api/console/company`. Why: every page sees the same company.
- Utility bills (EAC, water) arrive by upload or by forwarding to a per-account `<token>@BILL_INBOX_DOMAIN` (Cloudflare Email Routing → worker `email` handler → `/api/public/inbound/bill-email`); both paths use the same readers, and bills are matched to bank payments in `src/lib/integrations/bill-match.ts`. Why: these boards have no API, so email + bank are the automatic sources.
- Cron and email handlers are attached to the worker's default export by `scripts/inject-scheduled-handler.mjs`. Why: Cloudflare ignores named-export handlers.
- In development the DB client is short-lived per use on the pooler's transaction port (6543); production uses Hyperdrive. Why: a long-lived pool in `next dev` stalls and the session port caps at 15 clients.
