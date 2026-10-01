/** A fixed workspace briefing in the exact shape the copilot route builds. Shared by unit tests and scripts/verde-eval.ts. */
export const FIXED_BRIEFING = [
  "COMPANY DETAILS (profile + workspace)",
  "- name Halloumi House Ltd; industry Food production; team size 11-50; country CY; sites 2; yearly revenue not set EUR",
  "",
  "METRICS (metric_definitions + metric_readings)",
  '- total_co2e "Total emissions": 18.4 tCO2e (-6.1% vs May 2026). Better when down. Recent: Apr 2026=20.2, May 2026=19.6, Jun 2026=18.4',
  '- electricity_kwh "Electricity used": 14210 kWh (-3.2% vs May 2026). Better when down. Recent: Apr 2026=15020, May 2026=14680, Jun 2026=14210',
  '- renewable_share "Renewable share": no reading %. Better when up. Recent: none',
  "",
  "AGENTS (agents)",
  '- ledger "Ledger" - evidence sweep, autonomy 2, status active',
  "",
  "OPEN TASKS (agent_tasks)",
  "- #41 [high] Upload the June EAC bill (agent ledger, due 2026-07-15)",
  "",
  "OBLIGATIONS (obligations)",
  "- vsme-2026 VSME: Basic module report, due 2027-04-30, status at_risk, 35% complete",
  "",
  "RECENT ACTIVITY (activity_events)",
  "- Maria uploaded electricity bill",
].join("\n");

/** Fixed questions for the live answer tests. `trap` = the records do not hold the answer. */
export const VERDE_QUESTIONS: { q: string; trap?: boolean }[] = [
  { q: "What were our total emissions in June 2026?" },
  { q: "How much electricity did we use in June, and how does it compare to May?" },
  { q: "How far along is our VSME report?" },
  { q: "What share of our energy is renewable?", trap: true },
  { q: "What were our emissions in 2019?", trap: true },
  { q: "How much water did we use last quarter?", trap: true },
  { q: "What is our carbon intensity per euro of revenue?", trap: true },
  { q: "Give me a one-line summary of where we stand." },
  { q: "How many tonnes would we save by switching to solar?", trap: true },
  { q: "What should I do first this week?" },
];
