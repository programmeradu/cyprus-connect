## The real problem

`/app` has 20 pages, each invented from scratch. There is no page template, no shared header contract, no empty/loading/error convention, and no data contract. `app.css` already defines a good token set (surfaces, rules, `app-card`, `app-label`, `app-metric`, `app-btn`), but most pages never use it — they use raw Tailwind, so the CSS is doing damage control with a "legacy microtype correction" override block instead of pages being written correctly.

So the fix is not restyling 20 pages one by one. It is: build the template, then re-seat every page into it.

## 1. The workspace page template

One primitive set, used by every route without exception.

```text
+------------------------------------------------------------+
| PageHeader   Title (Fraunces 24px) ........ [ primary CTA ] |
|              One-line purpose sentence      [ secondary   ] |
| ---------------------------------------------------------- |  hairline
| PageToolbar  [ filter ] [ range ] [ search ]     meta right |  optional
| ---------------------------------------------------------- |
|                                                             |
|  Section  "Label"  ............................ [ action ]  |
|  +-------------------------------------------------------+  |
|  |  app-card / app-ledger / app-table                    |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  Section  "Label"                                           |
|  ...                                                        |
+------------------------------------------------------------+
```

New components in `src/components/app/shell/`:

- `PageShell` — max width, vertical rhythm (32px between sections), owns the page's loading / error / empty state so no page hand-rolls a spinner again.
- `PageHeader` — title, purpose line, actions slot, optional breadcrumb. Replaces the current `AppHeader` (which today also carries the avatar menu — that moves to the sidebar footer where it belongs).
- `PageToolbar` — filters/range/search row on a hairline.
- `Section` — label + optional action + children, consistent spacing.
- `DataTable` — left-aligned text, right-aligned tabular numerals, sticky header, zebra off by default.
- `MetricRow` / `Metric` — the only way a big number gets rendered.
- `EmptyState` — headline + one sentence + one primary action. No "No data".
- `Skeleton` variants that match the final layout (card, table row, metric).

## 2. Written design rules for the workspace

Codified in `src/app/[locale]/app/README.md` and enforced by lint where possible:

- Type scale inside `/app`: 24 page title, 17 section heading, 15 body, 13 meta, 12 label floor. Nothing smaller. No uppercase wide-tracking.
- Surfaces only from tokens: page `--app-surface-0`, card `--app-surface-1`, inset `-2`, hover `-3`. Never a raw `bg-white`, `bg-neutral-900`, `bg-*/10` wash.
- Radius 4 / 6 / 8 / 12. Shadows only on `app-overlay`.
- One primary action per page. Buttons are `app-btn` / `app-btn-ghost`, 40px.
- All numbers tabular. All money in EUR, all units metric, all dates `d MMM yyyy`.
- No decorative icons, no pill chips, no gradients — already project law, now applied here.
- Every async surface ships three states: skeleton, empty, error-with-retry.

Once pages are migrated, the "legacy microtype correction" and "legacy safety net" blocks in `app.css` get deleted — they exist only to paper over the mess.

## 3. Re-seat the pages

Ordered by traffic, in batches:

1. `dashboard`, `calculator`, `analytics`
2. `compliance`, `actions`, `insights`
3. `marketplace` (+ detail), `learn` (+ lesson), `studio`
4. `integrations`, `leaderboard`, `billing`, `settings` (+ privacy), `grant-alerts`, `onboarding`

Each page is rewritten as `PageShell > PageHeader > Section[]`, with its bespoke cards replaced by `app-card` / `DataTable` / `Metric`. Presentation only — data fetching stays as-is in this pass.

## 4. "Almost nothing functioning"

Separate from styling, and worth naming: several pages are visibly dead because the Gemini key is revoked (studio, insights, OCR upload) and because open-access mode means there is no user row behind the fetches, so pages fall back to zeros or empty arrays.

I will, in this pass, make that honest rather than broken: every widget with no data renders a real `EmptyState` telling you what to do, and AI surfaces render a clear "AI is unavailable — key missing" state instead of failing silently. Actually restoring the AI key and wiring real data is a follow-up I can start right after, if you want it in the same run.

## Technical notes

- New folder `src/components/app/shell/`, exported through one barrel so page files import a single line.
- `AppHeader.tsx` becomes a thin re-export of `PageHeader` during migration, then is deleted.
- Sidebar keeps its current `.app-chrome` treatment; the account menu moves into its footer.
- Verification: screenshot every `/app` route at 1280 and 390, light and dark, checking no horizontal scroll, no truncated labels, contrast ≥ 4.5:1.
