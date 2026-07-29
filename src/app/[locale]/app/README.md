# Vuneli Workspace (`/app`) - design doctrine

The workspace is a separate visual system from the marketing site. It shares the
brand typefaces and the "Verified Nature" temperament, but it is dense product
UI: flat opaque surfaces, hairline rules, value-based depth, real numbers.

`src/app/[locale]/app/app.css` is the only stylesheet that governs `/app`. It is
scoped under `.viq-app`, set by the app layout. Marketing CSS cannot reach in and
workspace rules cannot leak out.

---

## 1. Every page uses the same template

No exceptions. Import from one barrel:

```tsx
import {
  PageShell, PageHeader, PageToolbar, ToolbarTabs, Section,
  DataTable, Metric, MetricRow, EmptyState, AiUnavailable,
  SkeletonTable, SkeletonCards, SkeletonMetricRow
} from "@/components/app/shell";
```

Canonical page:

```tsx
<PageShell
  loading={isLoading}
  error={error}
  onRetry={load}
  header={
    <PageHeader
      title="Analytics"
      purpose="See how your emissions moved, and what drove the change."
      actions={<button className="app-btn">Export</button>}
    />
  }
  toolbar={<PageToolbar meta="Updated 4 Jul 2026">{filters}</PageToolbar>}
>
  <Section title="Headline">{...}</Section>
  <Section title="By source">{...}</Section>
</PageShell>
```

- `PageShell` owns the max width, the 32px rhythm between sections, and the
  loading / error states. Do not hand-roll a spinner or a `<Loader2 />` block.
- `PageHeader` owns the h1. A page never renders its own `<h1>`.
- `Section` owns the h2. Sections never set outer margins.
- One primary action per page. Everything else is `app-btn-ghost` or a text link.

## 2. Type scale

| Role          | Size            | Weight | Face                 |
| ------------- | --------------- | ------ | -------------------- |
| Page title    | 24px            | 600    | `--editorial-display`|
| Section title | 17px            | 600    | `--editorial-display`|
| Body          | 15px            | 400    | `--editorial-sans`   |
| Meta          | 13px            | 500    | `--editorial-sans`   |
| Label         | 12px (floor)    | 600    | `--editorial-sans`   |
| Metric        | 28-40px         | 600    | `--editorial-display`|

Nothing below 12px. No uppercase with wide tracking. No `font-light`.
Use `.app-label`, `.app-meta`, `.app-metric`, `.app-num` rather than re-deriving.

## 3. Surfaces and structure

- Page `--app-surface-0`, card `--app-surface-1`, inset `--app-surface-2`,
  hover `--app-surface-3`. Never a raw `bg-white`, `bg-neutral-900`,
  `bg-primary/10` wash, or a `dark:` colour tint on a card.
- Rules: `border-[var(--app-rule)]`, strong variant for controls.
- Classes: `.app-card`, `.app-card-inset`, `.app-ledger`, `.app-overlay`.
- Radius: 4px tags, 6px controls, 8px cards, 12px overlays. Nothing larger.
- Shadows only on `.app-overlay` (dropdowns, modals, popovers). Nowhere else.
- No glassmorphism, no gradients, no neumorphic shadows.

## 4. Content and data

- Text left, numbers right, always `tabular-nums`. Use `DataTable`.
- Money in EUR. Units metric. Dates `d MMM yyyy`. Cyprus and EU context only.
- Tables beat card grids for anything scannable.
- Never `truncate` or `line-clamp` a label that carries meaning. Wrap it.

## 5. Three states, always

Every async surface ships all three:

1. **Skeleton** matching the final layout (`SkeletonTable`, `SkeletonCards`,
   `SkeletonMetricRow`). Never a centred spinner.
2. **Empty** via `EmptyState`: headline, one sentence of guidance, one action.
   Never a bare "No data".
3. **Error** with a retry, through `PageShell`'s `error` / `onRetry` props.

AI-backed surfaces additionally use `AiUnavailable` when the model key is
missing or rejected, rather than failing silently.

## 6. Banned in `/app`

- Decorative icons (Lucide or otherwise) used as accents. Functional icons only:
  close, chevron, search, external link. Single stroke, monochrome.
- `rounded-full` pill chips. Use `.app-tag` (rectangular, bordered).
- Gradients, `glass`, `neomorph`, `shadow-premium`.
- Emoji as UI.
- Two equal-weight CTAs in one view.
- Hard-coded colour utilities (`text-white`, `bg-black`, `bg-[#...]`).

## 7. Verification before shipping a page

- 1280px and 390px, light and dark.
- No horizontal scroll. No truncated label. Body contrast >= 4.5:1.
- Focus rings visible on every interactive element.
- Touch targets >= 44x44px.
