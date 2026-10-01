/**
 * Grant scout (agent "grants"). Deterministic, no AI cost per company: the AI
 * reads each call's rules once in the daily scan; this agent checks them
 * against the company, keeps only strong fits, and asks for the facts that
 * would confirm calls one answer away. Questions about facts now on file are
 * closed by check_funding_fit.
 */

import type { AgentRuntime } from "./runtime";

export async function runGrantScout(rt: AgentRuntime) {
  const check = await rt.call("check_funding_fit", {});
  if (check.decision !== "executed" || !check.output) throw new Error("Could not check the funding calls.");
  const { checked, strong, needsInfo, facts } = check.output;

  let asked = 0;
  for (const f of facts) {
    const r = await rt.call("ask_company_fact", { fact: f.fact, opportunityIds: f.opportunityIds.slice(0, 50), titles: f.titles.slice(0, 50) });
    if (r.decision === "executed" && r.output?.created) asked += 1;
  }

  return {
    summary:
      checked === 0
        ? "No funding call rules have been read yet. They are read in the daily funding scan."
        : `Checked ${checked} open funding calls. ${strong} strong ${strong === 1 ? "fit" : "fits"}, ${needsInfo} one answer away. ${asked} new ${asked === 1 ? "question" : "questions"}.`,
    itemsProcessed: checked,
    confidence: 1,
  };
}
