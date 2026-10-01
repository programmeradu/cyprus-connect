/**
 * Deadline keeper (agent "deadlines"). Deterministic, no AI: runs the fixed
 * rulebook on the company's facts every day and asks yes/no questions for the
 * facts that would settle deadlines that might apply.
 */

import type { AgentRuntime } from "./runtime";

export async function runDeadlineKeeper(rt: AgentRuntime) {
  const check = await rt.call("check_deadlines", {});
  if (check.decision !== "executed" || !check.output) throw new Error("Could not check the deadlines.");
  const { applies, might, not, facts } = check.output;
  let asked = 0;
  for (const f of facts) {
    const r = await rt.call("ask_deadline_fact", { fact: f.fact, ruleIds: f.ruleIds, titles: f.titles });
    if (r.decision === "executed" && r.output?.created) asked += 1;
  }
  return {
    summary: `${applies} ${applies === 1 ? "deadline applies" : "deadlines apply"}, ${might} might, ${not} checked and not applicable. ${asked} new ${asked === 1 ? "question" : "questions"}.`,
    itemsProcessed: applies + might + not,
    confidence: 1,
  };
}
