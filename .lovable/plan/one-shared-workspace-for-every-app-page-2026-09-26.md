# One shared workspace for every app page

## What is wrong today

Only 3 of 26 pages (Dashboard, Agents, CBAM) read the shared workspace. The other 23 each fetch their own copy from 40+ separate endpoints. Examples:

- Emissions are fetched separately by Actions, Calculator, Integrations and Studio.
- Company profile (`/api/users/...`) is fetched separately by Analytics, Insights, Integrations, Onboarding, Settings, Privacy.
- Dashboard metrics are fetched separately by Calculator, Learn and Studio.
- Location (`/api/geolocation`) is guessed per page instead of stored once on the company.

Result: a change on one page (new emission, completed action, new report) is invisible to the others until reload, figures can disagree, and agents cannot see what pages did.

## Target

```text
            Postgres (one source of truth)
                        |
          /api/console/*  (one workspace read + typed mutations)
                        |
        ConsoleDataProvider  (one client store, shared by all pages)
         |        |        |         |          |
     Dashboard  Actions  Studio   Learn    Settings ...
                        |
      every write -> audit event -> refresh() -> all pages + agents see it
```

Rules:
1. Pages never call data endpoints directly; they read from the shared store and call shared mutation functions.
2. Every write records an event, so agents and all pages see it.
3. Company facts (country, sector, revenue, site list) stored once, never re-guessed.
4. Old endpoints that duplicate data get removed after their page moves.

## Order: quick pages first, heavy pages after

### Phase 1 — foundation (must come first)
- Extend the shared workspace to cover profile, emissions summary, actions, reports, courses, marketplace holdings, notification settings.
- Split the store into sections that load on demand, so light pages stay fast.
- One mutation layer (`useWorkspaceAction`) that writes, logs the event and refreshes.

### Phase 2 — quick pages (small, mostly re-wiring)
Reports, Report detail, Leaderboard, Grant alerts, Billing, Marketplace impact, Settings, Privacy, Analytics.

### Phase 3 — medium pages (re-wire + simplify)
Actions (drop the extra AI call, one-click complete), Marketplace list/detail/admin, Onboarding (write company facts once), Compliance.

### Phase 4 — heavy pages (own pass each, rebuilt to current standard)
- **Studio (801 lines):** reduce to one flow — pick a real workspace fact, generate, save. Remove duplicate metric fetching.
- **Learn + Course creator + Lesson:** one-click "Build a course for my company" using workspace context; remove the separate generate page and auto-generate path; fix the course generator calling its own API over HTTP and notifying every user in the database.
- **Calculator (758):** writes emissions into the shared workspace so Dashboard and agents see them immediately.
- **Insights (599) and Integrations (737):** read shared profile/emissions; connections status from one place.
- Split each of these into smaller files as part of the rebuild.

### After each phase
Improvement notes recorded in the roadmap, full tests and typecheck, browser check desktop + phone, founder checklist updated. Greek translation of pages follows once pages stop changing.

## Technical details
- Store: extend `ConsoleDataProvider` into sectioned store (`useWorkspace(section)`), backed by `/api/console/overview` plus section endpoints under `/api/console/*`, all using `readJson` validation and `logger`.
- Mutations go through one helper that posts, writes `audit` events, then invalidates affected sections.
- Structural test: fails if any `/app` page calls `fetch(` directly (like the existing API input guard).
- Removed endpoints listed in the roadmap; no mocks or placeholder data — missing data shows an honest empty state.
