## Where we are

`/app` (the console overview) now has the finished visual language: sage background, flat glass plates, hairline rules, one lime accent, data read from `/api/console/overview`. The other 18 pages still use the older `app.css` shell (`PageShell`, `app-card`) or raw Tailwind, so they will look like a different product the moment you click a rail item.

The fix is not to restyle 18 pages by hand. It is to promote what the console proved into a shared kit, then re-seat each page into it.

## 1. Promote the console language into universal primitives

New folder `src/components/app/console/kit/`, one barrel export:

- `ConsolePage` — page frame: background, max width, section rhythm, and the three async states (skeleton / empty / error-with-retry) so no page hand-rolls a spinner.
- `ConsoleHeader` — page title, one purpose line, actions slot. Same type scale as the overview greeting.
- `ConsoleTabs` — the deck tab strip, already working on the overview, made route- or state-driven for any page.
- `Plate` — the flat sage glass surface, with `padded` / `flush` variants. Replaces `.vc-plate` ad-hoc markup and `app-card`.
- `PlateHeader` — plate label + optional right-side action or meta.
- `Ledger` — the hairline-ruled row list (agents, obligations, events all use this shape today).
- `ConsoleTable` — left text, right tabular numerals, sticky header, wrapping cells, no truncation.
- `Reading` / `ReadingRail` — the metric figure + label + delta, the only way a big number renders.
- `Empty`, `Skeleton` (plate / row / reading / chart variants), `AiUnavailable`.
- Charts stay where they are (`SignalChart`, `TickSeries`, `ArcGauge`, `MiniBars`) but get a common `ChartFrame` so axes, legend and cursor read-out behave identically everywhere.

CSS consolidation: `app.css` + `console.css` + `console-deck.css` collapse into one token layer plus one component layer. The "legacy microtype correction" and "legacy safety net" blocks get deleted once the pages stop needing them.

## 2. Write the rules down, then enforce them

`src/app/[locale]/app/README.md` gets the console contract: type scale (24 / 17 / 15 / 13 / 12 floor), surfaces from tokens only, radius 8 / 12 / 26, one primary action per page, tabular numerals, EUR and metric units, `d MMM yyyy` dates, every async surface ships three states, no hardcoded figures or counts anywhere. An eslint rule blocks raw `bg-white`, `bg-neutral-*` and hex colours inside `/app`.

## 3. Data contract per page

Every page reads from an API route the same way the overview reads `/api/console/overview`. Pages that currently compute or hold demo values in the component get a route and a seed row instead. No page ships a number that is not in the database.

## 4. Migration order

1. `analytics`, `compliance`, `actions` — closest to the console shape, they validate the kit.
2. `insights`, `calculator`, `integrations`.
3. `marketplace` (+ detail), `learn` (+ lesson), `studio`.
4. `leaderboard`, `billing`, `settings` (+ privacy), `grant-alerts`, `onboarding`.

Each batch: rewrite the page as `ConsolePage > ConsoleHeader > Plate[]`, wire its data route, then screenshot at 1280 and 390 in light and dark before moving on.  
  
while building also  mak sure you establish the right connections between the components amd pages and features  so that they are work together from the get go!

## 5. Verification per batch

No horizontal scroll, no truncated label, contrast at or above 4.5:1 in both modes, empty and error states rendered on purpose, and every control on screen does something real.

## Technical notes

- The rail (`ConsoleRail`) and topbar (`ConsoleTopbar`) become one `ConsoleChrome` so the overview and inner pages share identical navigation; the overview keeps its full-bleed hero as a page-level variant, not a separate shell.
- `PageShell`, `PageHeader`, `Section`, `DataTable`, `Metric` in `src/components/app/shell/` become thin re-exports of the kit during migration, then are deleted.
- Presentation and data wiring only. No new features from the roadmap enter in this pass; Release 2 actions come after.