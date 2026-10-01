# Add data: a page built around the document

The page does three jobs well today (read documents, accept typed figures, list recorded months), but they are stacked like a long form. The redesign gives each job a clear place, so you always know what is waiting for you, what was added, and what is missing.

## Layout (desktop)

```text
+---------------------------------------------------------------+
| Add data                                  [Forward bills by email: abc@bills.vuneli.com  Copy] |
| One line of what this page does                               |
+---------------------------------------+-----------------------+
| DROP AREA (compact once files exist)  | THIS YEAR AT A GLANCE |
|                                       | 12-month strip: each  |
| QUEUE                                 | month filled / empty  |
|  Needs your check (2)                 | / partly filled       |
|   [card: bill, figures table, quote]  | click a month = edit  |
|  Reading (1)                          |                       |
|  Added (3)   - collapsed rows         | WHAT WE ACCEPT        |
|  Not accepted (2) - collapsed rows    | short list + what to  |
|                                       | send instead          |
+---------------------------------------+-----------------------+
| OR TYPE FIGURES IN  (opens as a panel, month picked from strip) |
+---------------------------------------------------------------+
| RECORDED MONTHS table (totals, change, per-line breakdown)     |
+---------------------------------------------------------------+
```

Mobile: one column in this order: email address, drop area, queue, year strip, typing form, months.

## What changes, piece by piece

1. **Header** shows the private bill-forwarding address (now that bills.vuneli.com works) with a Copy button and a one-line "how to set up auto-forward" note. Hidden if the address isn't set up.
2. **Drop area** is large when empty. Once files are added it shrinks to a slim bar, so the queue takes the space. Whole page accepts drops, with a clear overlay.
3. **Queue grouped by state** instead of one card per file in upload order: Needs your check first, then Reading, then Added and Not accepted folded into short rows you can expand. A summary line on top: "2 need your check, 3 added, 1 not accepted".
4. **Review card redesign**: document type and period as the title, the file name full-length underneath (wraps, never cut). Figures as a proper table: what, amount, unit, month, the line it came from (expandable quote). Low-confidence rows clearly marked. Duplicate-month warning with Replace / Skip right on the row. One "Add these figures" button per card, plus "Add all checked" at the top when more than one card is waiting.
5. **Bank statement card**: spend summary by category, then the supplier payees with checkboxes, already-known suppliers marked as linked.
6. **Not accepted rows**: one line "Internet service invoice, not a footprint document" with the full reason and "what to send instead" on expand. No more three big identical paragraphs.
7. **Added rows** link to where the figures now show (the month in the table, or Suppliers), not just "Back to Home".
8. **Year strip** (right column): 12 months, each showing filled, partly filled, or empty, so gaps are obvious. Clicking a month opens the typing form on that month.
9. **Typing form** becomes a full-width panel with the five fields in one row on desktop, unit inside each field, the "you already recorded this month" note next to the save button, and the result (tonnes, by scope) shown inline after saving.
10. **Recorded months** table: each row expands to show electricity, gas, water, waste and car travel with their tonnes; Edit opens the form on that month.

All in the current Vuneli look (fonts, colours, no icons or pill badges), English and Greek, light and dark, checked at mobile and desktop widths.

## Email routing

The app reads the forwarding domain from a Cloudflare setting. To make addresses appear, the founder sets `BILL_INBOX_DOMAIN=bills.vuneli.com` and `INBOUND_EMAIL_SECRET` on the Worker (already listed in the setup notes). After deploy, send one EAC e-bill to your address to confirm it lands in the queue.

## Technical details

- Split `DocumentIntake.tsx` (448 lines) into `IntakeDropZone`, `IntakeQueue` (grouping + summary + "add all"), `ReviewCard`, `StatementCard`, `CompactRow`; the per-file reading logic stays in a `useIntakeItem` hook so behaviour and API calls don't change.
- Calculator page split into `YearStrip`, `ManualEntryPanel`, `MonthsTable`; shared selected-month state lifted to the page.
- Bill address read through the existing bill-inbox endpoint via `useWorkspaceResource`.
- New styles in the console CSS using existing tokens; EN/EL strings in `dashboard.intake` / `dashboard.calculator`.
- No database or API changes. Existing tests stay green; Playwright screenshots at 390 and 1280 wide, EN/EL, light/dark.
