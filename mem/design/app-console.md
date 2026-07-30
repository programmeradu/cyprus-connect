---
name: App console design system
description: The /app workspace console design language (Rinesk-derived), its dark-mode rules, and the no-hardcoded-data rule for dashboard widgets
type: design
---
The authenticated `/app` surface uses the **Console** design language, derived from the approved
"Rinesk" concept and reimagined for Vuneli. It is the template for every app page.

**Structure**
- Slim left rail (icon + label), workspace identity at top, account block at bottom.
- One rounded "instrument card" at the top of every page: soft sage-glass gradient, radius 26px on
  ALL corners (the concept rounds the bottom before the darker plane begins - never square it off).
- Below it, a darker recessed plane holding a 4-column analysis row divided by hairlines.
- Accent: lime `#E8F94A`. Ink: `#202b2b`. Type: Nunito for the console only.

**Dark mode is authored separately, never inverted.**
Page `#171717`, surfaces `#212121` / `#262626` (ChatGPT grey, zero chroma), glossy top card with a
faint green-tinted gradient, hairlines at 8-12% white, lime accent held at the same hue but lower
luminance so it does not glare. Contrast checked in both modes independently.

**Exception to mem://constraints/no-icons-no-pills**: inside `/app` only, the console uses the
concept's functional line icons and the segmented nav pill. Marketing pages keep the ban.

**Data rule: nothing on the dashboard is hardcoded.**
Every figure, series, agent, obligation and event is read from the database
(`workspaces`, `metric_definitions`, `metric_readings`, `agents`, `agent_runs`, `agent_tasks`,
`data_connections`, `obligations`, `activity_events`) through `/api/console/overview`.
Demo content is DB-seeded via `scripts/seed-console.ts`, so swapping demo for live data is a data
change, never a code change.

**Agentic foundation**: the layout must always have room for the agent roster, the
human-in-the-loop approval queue, run history, and per-agent autonomy level. Do not design a widget
that cannot show an agent as its author.
