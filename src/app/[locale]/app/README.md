# The Vuneli console contract

Every route under `/app` obeys this file. It is short on purpose. If a rule
here blocks something the product needs, change the rule in this file first,
then change the code.

## 1. One frame per page

```tsx
import { ConsolePage, Plate, PlateGrid, Ledger, Reading, ReadingRail } from "@/components/app/console/kit";
import { useConsole } from "@/components/app/console/ConsoleData";

export default function MeasurePage() {
  const { data, error, loading, refresh } = useConsole();

  return (
    <ConsolePage
      title="Measure"
      purpose="Every figure that enters a disclosure, with the source behind it."
      actions={<Btn variant="primary">Add a reading</Btn>}
      loading={loading}
      error={error}
      onRetry={refresh}
    >
      ...
    </ConsolePage>
  );
}
```

A page renders one `ConsolePage`. The top bar, the navigation, the palette and
the approval queue come from the layout. No page draws its own chrome.

## 2. One read per session

`ConsoleDataProvider` in `src/app/[locale]/app/layout.tsx` calls
`/api/console/overview` once and hands the records to every page through
`useConsole()`. A page never fetches the workspace again. A page that writes
calls `refresh()` when the write returns.

## 3. The primitives

| Need | Use |
| --- | --- |
| Page frame, three states | `ConsolePage` |
| Section strip | `ConsoleTabs` |
| A surface | `Plate`, laid out by `PlateGrid` |
| A list of records | `Ledger` |
| Rows and columns | `ConsoleTable` |
| A headline figure | `Reading` inside `ReadingRail` |
| Share, coverage, progress | `Bar` |
| A state word | `State` |
| An action | `Btn` |
| Nothing to show | `Empty` |
| No model key | `AiUnavailable` |
| Waiting | `DeckSkeleton`, `PlateSkeleton`, `ReadingSkeleton` |

Nothing else. If a page needs a shape the kit does not have, add it to the kit
with a comment saying why, then use it.

## 4. Surfaces

- The field is the page background. Plates are sage glass veils on it.
- No white cards. No drop shadows. Radius 18 for plates, 10 for controls.
- Hairlines carry structure: `--vc-rule` between blocks, `--vc-rule-soft`
  between rows.
- Light and dark are authored separately, never inverted.

## 5. Type

- Page title 25, section heading 16.5, body 14.5, meta 12.5. Nothing smaller
  than 12. No uppercase tracking.
- All numbers use tabular figures. Money in EUR, units metric, dates
  `d MMM yyyy`.

## 6. Behaviour

- One primary action per page. Everything else is quiet.
- Every asynchronous surface ships three states: skeleton, empty, error with a
  retry. "No data" alone is a defect.
- No control that does nothing. A button, a tab or a count that leads nowhere
  does not ship.
- No figure is written by hand. Every value comes from the database through an
  API route.
- Text wraps. `truncate` and `line-clamp` are not used on anything a person
  needs to read.
- Every interactive element keeps a visible focus ring and a target of at
  least 44px on touch.

## 7. The bridge

Routes written before the kit import `@/components/app/shell`. Those files are
adapters: they take the earlier props and draw kit markup, so no page looks
like a different product. `console-kit.css` also holds a bridge block that
restyles the raw `app-*` classes still in page bodies.

Both are temporary. When a page is rewritten against the kit, drop its
`shell` import. When the last `app-*` class is gone from `/app`, delete the
bridge block and `app.css`.
