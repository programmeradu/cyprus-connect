# Project Memory

## Core
i18n overflow policy (EN/EL): NEVER use `truncate`, `line-clamp`, `text-ellipsis`, or fixed widths on text. Prefer a shorter Greek word; if still tight, let text wrap (`whitespace-normal leading-tight text-balance`) or use fluid utilities `text-fluid-{xs,sm,base,lg,xl,2xl,hero}` defined in `src/app/globals.css`. Rows use `grid-cols-[auto_minmax(0,1fr)_auto]` with `min-w-0` on text cells and `shrink-0` on icons/actions.
Greek-shorter-word swap list (use these forms): Ταμπλό (not Πίνακας ελέγχου), Συνδέσεις (not Ενσωματώσεις), Ρυθμίσεις (not Ρυθμίσεις λογαριασμού), Νέα αναφορά, Έξοδος (not Αποσύνδεση), Αλλαγή (not Επεξεργασία when tight), Αποθήκευση, Ημ/νία, Ποσό. Nav labels ≤12 chars in EL.
Locale hook `:lang(el)` in globals.css already tightens letter-spacing and scales nav/button/badge font-size ~0.94–0.95em — do not duplicate per-component.

## Memories
