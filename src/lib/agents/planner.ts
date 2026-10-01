/**
 * The planning loop. An agent gets a mission (its standing job) or a goal a
 * person gave it, and decides itself which sources to combine. Every tool it
 * picks still runs through AgentRuntime: same typed inputs, same risk policy,
 * same step ledger. Outward acts still wait for a person.
 *
 * What the model never decides:
 *   - legal acts (risk 3) and CBAM drafting stay with the deterministic agent;
 *   - the evidence fingerprint on a recorded fact: the planner sets it to the
 *     SHA-256 of the tool answers the agent had read when it recorded it.
 */

import { z } from "zod";
import { aiToolTurn, aiErrorMessage, type ToolSpec, type ToolTurnMessage } from "@/lib/lovable-ai";
import { StepLimitError, type AgentRuntime } from "./runtime";
import { TOOLS, type ToolName } from "./tools";
import { sha256Hex, stableStringify } from "./hash";
import type { AgentOutcome } from "./orchestrator";

/** Tools a planner may pick. Legal signatures and CBAM drafting are left out on purpose. */
export const PLANNER_TOOLS: ToolName[] = [
  "read_company_profile",
  "read_metrics",
  "read_obligations",
  "read_workspace_facts",
  "read_utility_bills",
  "read_bank_spend",
  "read_cyprus_context",
  "search_company_registry",
  "lookup_company_registry",
  "find_wikirate_company",
  "read_wikirate_figures",
  "compare_with_peers",
  "read_cbam_imports",
  "read_cbam_suppliers",
  "record_fact",
  "create_task",
  "send_supplier_request",
];

const MAX_TURNS = 10;
const MAX_TOOL_ANSWER = 6000;

/** JSON schema for the model; the evidence hash on record_fact is filled in by the planner. */
export function toolSpecs(names: ToolName[]): ToolSpec[] {
  return names.map((name) => {
    const def = TOOLS[name];
    let schema = def.input as z.ZodType;
    if (name === "record_fact") schema = (def.input as unknown as z.ZodObject<z.ZodRawShape>).omit({ sourceHash: true });
    const parameters = z.toJSONSchema(schema, { target: "openapi-3.0" }) as Record<string, unknown>;
    delete parameters.$schema;
    return {
      type: "function",
      function: { name, description: `${def.description} (risk ${def.risk})`, parameters },
    };
  });
}

function systemPrompt(agentName: string, today: string): string {
  return [
    `You are ${agentName}, one of Vuneli's sustainability agents, working for one small or mid-sized company in Cyprus or the EU. Today is ${today}.`,
    "Work like a careful consultant: decide which sources the job needs, read them, and combine them when that gives a better answer (for example the register entry with bills and bank spend, or supplier names with their published figures).",
    "Rules:",
    "- Use only figures that came back from a tool. Never estimate, round up, or fill a gap. If a source is not configured or has nothing, say so and move on.",
    "- Name the source and year next to every figure you use.",
    "- Record a finding other agents should reuse with record_fact (sourceKind 'connector' for a source's answer, 'derived' for your own arithmetic on them).",
    "- When a person must act or decide, use create_task with a short title and a detail that cites the figures. Do not create a task that only says what you read.",
    "- An email to a supplier (send_supplier_request) only goes out after a person approves the exact text; write it plainly and politely.",
    "- Peer figures from WikiRate are from large companies; say that whenever you compare.",
    "- Stop when the job is done. Finish with two or three plain sentences a business owner understands: what you found and what is waiting for them. No markdown, bullet points, headings, tool names or fact keys.",
  ].join("\n");
}

export async function runPlanner(
  rt: AgentRuntime,
  options: { agentName: string; mission: string; goal: string | null; tools?: ToolName[] },
): Promise<AgentOutcome> {
  const allowed = options.tools ?? PLANNER_TOOLS;
  const allowedSet = new Set<string>(allowed);
  const specs = toolSpecs(allowed);
  const messages: ToolTurnMessage[] = [
    { role: "system", content: systemPrompt(options.agentName, new Date().toISOString().slice(0, 10)) },
    {
      role: "user",
      content: options.goal
        ? `A person gave you this goal: ${options.goal}\n\nYour standing job, for context: ${options.mission}`
        : `Your standing job: ${options.mission}`,
    },
  ];
  const evidence: string[] = [];
  let executed = 0;
  let waiting = 0;
  let summary = "";

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const reply = await aiToolTurn({ messages, tools: specs, temperature: 0.2 });
      if (!reply.toolCalls.length) {
        summary = (reply.content ?? "").trim();
        break;
      }
      messages.push({ role: "assistant", content: reply.content, tool_calls: reply.toolCalls });
      for (const call of reply.toolCalls) {
        const name = call.function.name;
        let answer: unknown;
        if (!allowedSet.has(name)) {
          answer = { error: `Tool ${name} is not available to this agent.` };
        } else {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
          } catch {
            answer = { error: "Arguments were not valid JSON." };
          }
          if (answer === undefined) {
            if (name === "record_fact") {
              args.sourceHash = await sha256Hex(evidence.slice(-6).join("\n") || "no-evidence");
            }
            const r = await rt.call(name as ToolName, args);
            if (r.decision === "executed") executed += 1;
            if (r.decision === "queued_for_approval") waiting += 1;
            answer =
              r.decision === "executed"
                ? r.output
                : r.decision === "queued_for_approval"
                  ? { status: "waiting for a person's approval" }
                  : { status: r.decision, error: r.error ?? null };
            if (r.decision === "executed") evidence.push(`${name}:${stableStringify(r.output)}`);
          }
        }
        messages.push({ role: "tool", tool_call_id: call.id, content: stableStringify(answer).slice(0, MAX_TOOL_ANSWER) });
      }
    }
  } catch (error) {
    if (error instanceof StepLimitError) {
      summary = summary || roundUp(executed, waiting, true);
    } else {
      throw new Error(aiErrorMessage(error));
    }
  }

  if (!summary) summary = roundUp(executed, waiting, false);
  return {
    summary: dropRepeatedParagraphs(summary).slice(0, 1200),
    itemsProcessed: executed,
    confidence: waiting > 0 ? 0.6 : executed > 0 ? 0.8 : 0.3,
  };
}

/** A plain closing line when the model did not write one. */
function roundUp(executed: number, waiting: number, hitLimit: boolean): string {
  const did = executed > 0 ? `Checked ${executed} ${executed === 1 ? "source" : "sources"}` : "Looked through the workspace";
  const next = waiting > 0 ? ` ${waiting} ${waiting === 1 ? "item is" : "items are"} waiting for your approval.` : " Nothing needs you right now.";
  return `${did}${hitLimit ? " before reaching its limit for one run" : ""}.${next}`;
}

/** Models sometimes restate a short opener in a longer closing paragraph; keep only the fuller one. */
export function dropRepeatedParagraphs(text: string): string {
  const words = (x: string) => new Set(x.toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, " ").split(/\s+/).filter((w) => w.length > 3));
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return paras
    .filter((p, i) => {
      const mine = [...words(p)];
      if (mine.length < 4) return true;
      return !paras.some((q, j) => {
        if (j === i || q.length <= p.length) return false;
        const theirs = words(q);
        return mine.filter((w) => theirs.has(w)).length / mine.length >= 0.8;
      });
    })
    .join("\n\n");
}
