# Architecture decisions

Scoped rules: `src/lib/agents/AGENTS.md` (agent runtime, approvals, CBAM), `src/lib/bank/AGENTS.md` (bank links), `src/lib/copilot/AGENTS.md` (Verde), `src/lib/actions/` (Action plan), `src/lib/integrations/` (bill intake), `src/lib/pdf/` (PDFs), `src/lib/obligations/` (deadlines).

- Build with proven libraries/services ("superpowers") over from-scratch or basic versions; every UI uses the console design system, ships loading/empty/error states, and is checked in light+dark, EN+EL, 390/768/1440. Why: we are building an industry leader; no generic or lazy UI.
- Schema changes are plain SQL in `scripts/sql/`, mirrored in `src/db/schema.ts`. Why: drizzle folder is read-only; one migration path.
- API bodies/uploads go through `src/lib/validate.ts`; `tests/api-input-guard.test.ts` enforces it. Why: caps and checks in one place.
- Server errors use `logger(scope).error` (`src/lib/log.ts`); routes return its ref, never the raw error. Why: findable, safe.
- Admin rights live only in `user_roles`, checked by `src/lib/admin-auth.ts`; QA identity is never admin. Why: profile edits can't grant admin.
- /app pages read/write only via `workspace-store.ts` (`useWorkspaceResource`/`useWorkspaceAction`); `tests/app-data-guard.test.ts` enforces it. Why: one data copy.
- Company facts have one home (profile: name/industry/size/country; workspace: sites/revenue), read via `company.server.ts`, written via `/api/console/company`. Why: one company everywhere.
- Cron and email handlers are attached to the worker's default export by `scripts/inject-scheduled-handler.mjs`. Why: Cloudflare ignores named-export handlers.
- In development the DB client is short-lived per use on the pooler's transaction port (6543); production uses Hyperdrive. Why: a long-lived dev pool stalls; the session port caps at 15 clients.
- Every supplier lives in one list (`cbam_suppliers`, email optional), read and written via `/api/console/suppliers`; CBAM, agents and the Suppliers page share it, and bank spend is matched by `src/lib/suppliers.ts`. Why: one copy, changes show everywhere.
- Company details are read/written only through `src/lib/company-update.server.ts`; the company API and Verde's `update_company` approval both call it. Why: one validation and audit path whether a person or Verde makes the change.
- Home (`/app`) is a single "today" view built from `src/components/app/dashboard/home/`; the approval queue component `WaitingForYou` is shared with Agents. Why: one queue, no tabbed duplicate of other pages.
- Company logos come only from `/api/logo` (domain via `src/lib/company-logo.ts`: website, else work email), cached forever in `company_logos`, rendered by `CompanyLogo` with avatar fallback. Why: one lookup, no wasted credits or broken images.
- Sign-up set-up is one screen of company facts (or a Verde handoff); data sources and the rest live on the Home checklist. Why: tour + checklist already cover them, so nothing is asked twice.
- Sanctions screening matches suppliers locally against the EU consolidated list stored in `eu_sanctions_names` (refreshed by `/api/cron/sanctions-list`). Why: free, legally binding in Cyprus, no per-check API cost.
- Funding calls show only strong or one-answer-away fits from Grant scout; see `src/lib/funding/AGENTS.md`. Why: no duplicate public listings, no guessed eligibility.
- Agent notes and public titles on Greek pages come from the `text_translations` cache (`src/lib/translate.server.ts`), filled after the response; official Greek titles are used where the source publishes them (EUR-Lex). Why: pages never wait on AI, each text is translated once.
- Model calls go only through `src/lib/vuneli-ai.ts` (text and vision: Groq); gate features with `hasTextAi`/`hasDocumentAi`/`hasImageAi`/`hasEmbeddingAi`. Why: one switch.
- All /app document uploads go through one intake reader (`src/lib/documents/`, `/api/console/documents/intake`); nothing is saved until the person confirms. Why: one door, no silent or duplicate figures.
- Stripe: own account, one `STRIPE_SECRET_KEY` (prefix = test/live), webhook `/api/public/payments/webhook` dedupes via `stripe_events`; plan lists match built features. Why: no client-chosen mode, no unkept promises.
