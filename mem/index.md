# Project Memory

## Core
NO ICONS as decoration (Lucide/emoji) — icons flatten the brand and mark work as vibe-coded. Use type, spacing, dividers, numerals, and color for hierarchy. Exception: minimal functional icons only (search magnifier in input, close X, external-link arrow, accordion chevron).
NO PILLS / rounded-full chip badges for tags/categories/status. Use small-caps eyebrow labels, underlined labels, or numeric prefixes.
NO vibecoded microtype: no tiny overtracked uppercase metadata/dates/progress/source labels. Use heavier readable VerdeIQ editorial UI text.
Mobile-first premium editorial: Apple/Google-level polish, generous whitespace, tight type hierarchy, no cluttered rows. Verify at 390×844 before shipping.
i18n overflow policy (EN/EL): NEVER use `truncate`, `line-clamp`, `text-ellipsis`, or fixed widths on text. Prefer a shorter Greek word; if still tight, let text wrap (`whitespace-normal leading-tight text-balance`) or use fluid utilities `text-fluid-{xs,sm,base,lg,xl,2xl,hero}` defined in `src/app/globals.css`. Rows use `grid-cols-[auto_minmax(0,1fr)_auto]` with `min-w-0` on text cells and `shrink-0` on icons/actions.
Greek-shorter-word swap list (use these forms): Ταμπλό (not Πίνακας ελέγχου), Συνδέσεις (not Ενσωματώσεις), Ρυθμίσεις (not Ρυθμίσεις λογαριασμού), Νέα αναφορά, Έξοδος (not Αποσύνδεση), Αλλαγή (not Επεξεργασία when tight), Αποθήκευση, Ημ/νία, Ποσό. Nav labels ≤12 chars in EL.
Locale hook `:lang(el)` in globals.css already tightens letter-spacing and scales nav/button/badge font-size ~0.94–0.95em — do not duplicate per-component.
Fraunces ampersand override: `FrauncesAmpFix` @font-face in globals.css routes U+0026 through Instrument Sans so display headings don't get Fraunces's ornate calligraphic `&`. Any inline `fontFamily` for display type MUST prefix `"FrauncesAmpFix"` before `"Fraunces"`.
30-layer UX rulebook applies everywhere: one primary CTA per view, 8pt spacing, 6/8/12px radii (never rounded-2xl+ on rectangles or full on chips), borders over shadows, tabular-nums, 44px touch targets, visible focus rings, real copy (no Empower/Unlock/Supercharge), skeleton loaders matching final layout, motion 150–250ms ease-out. Full list in mem://design/ux-principles.

## Memories
- [30-layer UX rulebook](mem://design/ux-principles) — Consolidated premium UI/UX rules (spacing, hierarchy, motion, a11y, empty/error states, applied bans)
- [Typography system](mem://design/typography) — Locked pairing: Fraunces (display) + Instrument Sans (body/UI). No Inter/Space Grotesk/Geist/Poppins.
- [No icons, no pills](mem://constraints/no-icons-no-pills) — Global UI ban on decorative icons and pill/badge chips
- [Anti-vibecode UI rules](mem://constraints/anti-vibecode-ui) — Rules against generic AI/vibecoded UI tells, especially small metadata typography
