# Architecture decisions

Scoped rules: `src/lib/agents/AGENTS.md` (agent runtime, approvals, CBAM), `src/lib/bank/AGENTS.md` (bank links).

- Schema changes are plain SQL in `scripts/sql/`, mirrored in `src/db/schema.ts`. Why: drizzle folder is read-only; one migration path.
- API bodies/uploads go through `src/lib/validate.ts`; `tests/api-input-guard.test.ts` enforces it. Why: size caps and schema checks in one place.
- Server errors use `logger(scope).error` (`src/lib/log.ts`); routes return its ref, never the raw error. Why: findable logs, no leaks.
- Admin rights live only in `user_roles`, checked by `src/lib/admin-auth.ts`; QA identity is never admin. Why: profile edits can't grant admin.
- /app pages read/write only via `workspace-store.ts` (`useWorkspaceResource`/`useWorkspaceAction`); `tests/app-data-guard.test.ts` enforces it. Why: one shared copy of data.
- Company facts have one home (profile: name/industry/size/country; workspace: sites/revenue), read via `company.server.ts`, written via `/api/console/company`. Why: every page sees the same company.
