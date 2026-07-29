## Goal

Bring the authenticated `/app` surface onto the same "Verified Nature" editorial language as the marketing site, and give `/app` the same polished ChatGPT-grey dark mode already applied at the root.

## 1. Dark mode for /app (the new ask)

The neutral grey ramp now lives on `:root.dark` in `globals.css`, but `/app` overrides it with its own tinted chrome, so it still reads coloured.

- `src/app/[locale]/app/layout.tsx`: remove the fixed `bg-gradient-to-br from-primary/5 via-background to-accent/5` background wash. Replace with a flat `bg-background` plane so the grey ramp shows through unmodified.
- Sidebar (`src/components/app/Sidebar.tsx`) and `AppHeader.tsx`: move to the stepped neutral surfaces — sidebar `oklch(0.20 0 0)`, content `oklch(0.24 0 0)`, cards `oklch(0.27 0 0)`, popovers `oklch(0.30 0 0)`, hairlines `oklch(0.32 0 0)`.
- Remove per-component `dark:` colour tints (amber/red/emerald washes on cards) in favour of the shared semantic tokens.
- Verify contrast: body text and muted text must clear 4.5:1 on `oklch(0.24 0 0)`.

## 2. Retire the glass/gradient primitives

- `.glass-strong` on content cards -> `.surface-card` (flat fill, 1px hairline, 8px radius, no blur).
- Keep `.glass-strong` only for true overlays: dropdowns, modals, drawers, the notification popover.
- Delete `--gradient-primary`, `--gradient-secondary`, `--gradient-subtle`, `.neomorph`, `.shadow-premium`, `.gradient-text`, `.gradient-border` from `globals.css` once no call sites remain.

## 3. Strip the long tail (25 files)

Shared components first, since they cover most screens:

`StatCard`, `ActionCard`, `Badge`, `AppHeader`, `Sidebar`, `NotificationBell`, `ProgressBar`, `BenchmarkComparator`, `ComplianceChecker`, `EnergyCostCalculator`, `DocumentUpload`

Then the pages: `dashboard`, `analytics`, `insights`, `actions`, `compliance`, `calculator`, `learn` (+ lesson), `marketplace` (+ detail), `integrations`, `onboarding`, `billing`, `settings`, `leaderboard`, `studio`, `grant-alerts`.

Per file: drop `bg-gradient-*` overlays, swap `rounded-xl/2xl` down to the 6/8/12px scale, replace pill badges with bordered rectangular labels, remove decorative icons, and put numerals on `tabular-nums`.

## 4. Typography alignment

Apply the marketing type stack inside `/app`: Fraunces for headings and figures, Instrument Sans for body. Replace the `text-[9px]`/`text-[10px]` uppercase wide-tracking metadata with the `viq-*` label classes.

## 5. Correct the doctrine

`src/app/[locale]/app/README.md` lines 49 and 59 currently prescribe glassmorphism as intentional. Rewrite that section to state the editorial rules so the next contributor does not reintroduce it.  
  
ALSO SEPERATE /APP STYLING AND CSS FROM THE REST OF THE MARKETING  SITE AND PAGES.. 

## 6. Verify

Screenshot every `/app` route in both light and dark at 1280 wide and 390 wide. Check no horizontal scroll, no truncated labels, no low-contrast text.

## Technical notes

- Token edits are confined to `src/app/globals.css`; component edits are presentation-only, no business logic touched.
- `.surface-card` already exists in `globals.css` (line ~407) and is the migration target.
- Sequenced so shared primitives land first — that alone fixes most screens, and the page sweep becomes mostly deletions.