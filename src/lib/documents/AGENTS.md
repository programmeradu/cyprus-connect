# Document intake

- Code recognises what it can (file bytes, EAC/water/bank text, sheet columns); AI is the fallback and each AI figure must quote the document (`quoteSupports`), else it starts unticked. Why: no guessed figures.
- Refused files are not stored; accepted ones wait as `intake_pending` until the person keeps or discards them. EAC/water bills reuse the Integrations readers and become the same rows. Why: one answer from both doors, no duplicates.
