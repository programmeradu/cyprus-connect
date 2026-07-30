# Vuneli console — build direction

Status: agreed after the parity audit of the /app console against the Rinesk
study in /lab. This file sets the order of work. Do not add a feature that is
not in the current release unless the user approves it.

## Rules that hold for every release

1. No hard-coded figures, names, counts, labels or rows in the console.
   Every value comes from `/api/console/overview` or a later console API.
2. No control that does nothing. If a button, tab, icon or badge is on the
   screen, it must change the view or open a real record.
3. Light and dark are authored together. Text keeps a readable contrast.
4. No truncation of information the user needs. Text wraps.
5. The visual standard is `src/app/[locale]/lab/rinesk`. New surfaces match
   its density, radius, hairlines and single lime accent.

## Release 1 — the read-only console (done)

- One page, full-bleed. No sidebar on `/app`.
- Data contract: workspace, metrics, agents, runs, tasks, connections,
  obligations, events.
- Hero: greeting, category rail, metric rail, headline figure, signal chart
  with a value scale and a cursor read-out.
- Deck: Overview, Agents, Evidence, Obligations, Connections, Audit trail.
- Working chrome: route-aware navigation, command palette (Ctrl or Cmd + K),
  approval queue popover, account menu.

## Release 2 — the console acts

- Approve or reject a task from the queue. The action writes an
  `activity_event` and closes the `agent_task`.
- Start an agent run from the agent card. Show the run state as it changes.
- Filter the deck by period and by site.
- Export the current view to CSV and to PDF.

## Release 3 — the CBAM report agent

The wedge from `docs/research/VerdeIQ_Agentic_AI_Strategy_2026.md`. The
January 2026 definitive regime is the first paid job.

- Import customs lines and supplier data.
- Draft the quarterly declaration with a citation for every figure.
- Hold the declaration for a human signature. Never file without one.

## Release 4 — measurement depth

- Scope 3 supplier collection through the Weaver agent.
- Cyprus grid factors from EAC and Electricity Maps, held per period.
- Restatement history, so an audit can see why a past figure changed.

## Release 5 — assurance

- Evidence pack per disclosure: source document, factor, method, owner.
- Auditor view with read-only access.
- EU AI Act record: which agent produced which text, and who approved it.

## Out of scope for now

- Full autonomy on a legal disclosure. A person signs.
- Markets outside Cyprus.
- A marketplace or offset trading surface.
