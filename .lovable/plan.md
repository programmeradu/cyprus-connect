# Home: a calm "what needs me today" page

## Goal
A new user opens Home and knows what to do within five seconds. The current look stays the same: the soft top card, the lime accent, the hairline plates and the dark mode. The layout gets simpler, and nothing on it is invented.

## 1. What stays, what moves, what goes
This is based on how Persefoni, Watershed, Sweep, Normative, Greenly and Plan A, plus finance tools like Stripe, Linear and Ramp, open their home pages. Every one of them leads with one headline figure, the open tasks and the next deadline, and keeps the detail one click away.

| Today on Home | Decision | Why |
|---|---|---|
| Greeting + company card | **Keep**, make it smaller | Tells you whose workspace this is |
| Big headline figure + signal chart | **Keep** as "Your footprint" (one figure, change vs last month only when real, a 12-month chart) | Every industry leader opens with this |
| Category icons + metric tabs + side sparklines | **Move** to Measure | Too many switches for a first look |
| Evidence gauge + automation rate | **Merge** into one "Data health" line ("8 of 12 months backed by bills") with a "fix" link | A percentage on a dial doesn't tell you what to do |
| "What changed" signals | **Keep**, top 3 only | Useful, and short |
| Human in the loop (approvals) | **Keep, moved to the top** as "Waiting for you": approve, upload or dismiss right there. It also stays on Agents | This is the most important thing to act on |
| Next obligation | **Keep** as "Next deadline", with readiness and a Continue button | What sustainability leads care about most |
| Connections list | **Move** to Connect. Home shows a link only when a source is broken | Status details are noise on a home page |
| Cyprus grid chip | **Keep**, small | A local touch that's useful |
| Audit trail | **Shorten** to "What your agents did": the last 5 entries in plain words, with "full history" opening Agents | Builds trust without clutter |
| 5 section tabs (Overview, Evidence, Obligations, Connections, Audit) | **Remove** from Home. Each already has a home elsewhere | The main cause of the overwhelm |
| CSV and PDF export | **Replace** with one "Board summary" PDF | One clear file instead of five exports |
| Funding / savings | **Add**, small: "Money on the table", up to 3 sourced items | Shows what Vuneli is worth on day one |

## 2. Guided first visit (shown once)
- 4 to 5 short steps that point at the real parts of the page: your footprint, Waiting for you, Next deadline, Verde, and the top menu.
- Uses the current console style (a lime highlight ring and a small card), not a generic tour popup.
- Includes Skip and Back. The tour remembers when you've finished it and can be replayed from the account menu. Available in English and Greek, and it works on phones.

## 3. Setup checklist (after the tour)
A slim card at the top of Home that disappears once everything is done. Each step has one button that does the job:
1. Company details (name, sector, size, sites)
2. Connect a bank or forward a bill
3. Add your first month of figures
4. Add your suppliers
5. Run your first agent
Each step ticks itself off from the real saved data, so nothing is self-reported. Every step also has an "Ask Verde to do it" option.

## 4. Verde fills things in for you
- You can say "We're a 12-person bakery in Limassol with two shops." Verde works out the company details, sites and settings, then shows **one confirmation card** listing every change. Nothing is saved until you click Apply.
- Saves go through the same company and supplier channels the rest of the app uses, so every page updates at once.
- First round covers company facts, sites, suppliers and the bill-forwarding address. Settings like language and alerts come next.

## 5. Empty, loading and phone states
- A company with no data sees the checklist and short "here's what will appear" notes, not empty charts.
- On phones, the sections stack in this order: Waiting for you, Next deadline, Footprint, Agents, Money.
- Long names wrap instead of being cut off.

## Technical notes
- `src/app/[locale]/app/page.tsx`: remove the section tabs and deck, and build the new single-column plates from the existing `vc-plate` styles. Move metric switching into the Measure page component.
- New: `HomeToday.tsx`, `FirstVisitTour.tsx`, `SetupChecklist.tsx`. The checklist reads its status from `workspace-store` data (company, bank links, readings, suppliers, runs). Tour completion is saved on the profile, with localStorage as a cache only.
- Copilot: add a typed `propose_company_setup` proposal that returns a list of changes. The Apply button calls `/api/console/company` and `/api/console/suppliers`, so it uses the same validation, nothing new.
- Approvals use one shared component on Home and Agents.
- Board summary reuses the existing PDF loader.
- Add EN and EL strings. Check desktop and phone in light and dark mode. Update the tests that guard dashboard insights.
