-- Removes four made-up default deadlines that an earlier version of this file
-- (and of the Home overview) added to every workspace:
--   CBAM "Q3 2026 declaration" (no quarterly declarations exist from 2026),
--   VSME "Voluntary disclosure 2026" (VSME has no legal deadline),
--   CSRD "Wave 3 first report" (postponed by Directive (EU) 2025/794),
--   "Energy audit renewal" (no single date; large companies only).
-- Real deadlines are added only when they apply to the workspace.
-- Only untouched rows are removed (still planned, 0%), so nothing a person edited is lost.

DELETE FROM obligations
WHERE progress_pct = 0
  AND status = 'planned'
  AND (
    (id LIKE '%\_cbam\_q3' AND title = 'Q3 2026 declaration')
    OR (id LIKE '%\_vsme\_2026' AND title = 'Voluntary disclosure 2026')
    OR (id LIKE '%\_csrd\_w3' AND title = 'Wave 3 first report')
    OR (id LIKE '%\_energy\_audit' AND title = 'Energy audit renewal')
  );
