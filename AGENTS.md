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
- Every supplier lives in one list (`cbam_suppliers`, email optional), read and written via `/api/console/suppliers`; CBAM, agents and the Suppliers page share it, and bank spend is matched by `src/lib/suppliers.ts`. Why: one copy of each supplier, so a change shows everywhere.
- Company details are read/written only through `src/lib/company-update.server.ts`; the company API and Verde's `update_company` approval both call it. Why: one validation and audit path whether a person or Verde makes the change.
- Home (`/app`) is a single "today" view built from `src/components/app/dashboard/home/`; the approval queue component `WaitingForYou` is shared with Agents. Why: one queue, no tabbed duplicate of other pages.
- Company logos come only from `/api/logo` (domain from `src/lib/company-logo.ts`: website, else work-email domain, never personal mail), permanently stored in `company_logos` to conserve Logo.dev API credits, and render through `CompanyLogo`, which falls back to the generated avatar. Why: one cached, validated lookup; zero wasted API credits; never a broken image.
- Sign-up set-up is one screen of company facts (or a Verde handoff); data sources and the rest live on the Home checklist. Why: tour + checklist already cover them, so nothing is asked twice.
- Customer-facing PDFs (Board Summary, reports, CBAM) are typeset in the browser with Typst (templates in `public/pdf-typst/`, renderer `src/lib/pdf/typst-render.ts`); each download is recorded in `document_fingerprints` and checked publicly at `/verify` via `document-verify.server.ts`. Why: print-grade layout, and a printed fingerprint anyone can check without seeing workspace data.
