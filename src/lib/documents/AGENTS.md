# Document intake

- Code recognises what it can (file bytes, EAC/water/bank text, sheet columns); AI is the fallback and each AI figure must quote the document (`quoteSupports`), else it starts unticked. Why: no guessed figures.
- Refused files are not stored; accepted ones wait as `intake_pending` until the person keeps or discards them. EAC/water bills reuse the Integrations readers and become the same rows. Why: one answer from both doors, no duplicates.
- Bank statements keep every money-out line; payees become suppliers only when a person ticks them, through `/api/console/suppliers` PATCH, which links a payee to an existing supplier instead of adding a second row. Suppliers spend counts statement lines once, by day + amount + payee. Why: one supplier list, no duplicate rows or double-counted spend.
