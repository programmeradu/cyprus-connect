/**
 * Runs the act behind an approved task. The task carries the exact tool call
 * the agent asked for; this checks its fingerprint, runs it with the approver's
 * name, and writes the ledger step. A tampered or stale call is refused.
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { agentSteps, agentTasks } from "@/db/schema";
import { TOOLS, type ToolName } from "./tools";
import { sha256Hex, stableStringify } from "./hash";

export interface ApprovedTask {
  id: number;
  workspaceId: string;
  agentKey: string;
  runId: number | null;
  pendingTool: string | null;
  pendingInput: string | null;
  pendingInputHash: string | null;
}

export type ApprovalOutcome =
  | { ran: false }
  | { ran: true; ok: true; output: unknown }
  | { ran: true; ok: false; error: string };

export async function executeApprovedTask(task: ApprovedTask, approvedBy: string): Promise<ApprovalOutcome> {
  if (!task.pendingTool) return { ran: false };
  const name = task.pendingTool as ToolName;
  const def = TOOLS[name];
  const runId = task.runId ?? 0;

  const [{ next }] = (await db.execute(
    sql`select coalesce(max(seq), 0) + 1 as next from agent_steps where run_id = ${runId}`,
  )) as unknown as Array<{ next: number }>;
  const log = (decision: "executed" | "failed", output: unknown, inputHash: string, input: string) =>
    db.insert(agentSteps).values({
      runId,
      workspaceId: task.workspaceId,
      agentKey: task.agentKey,
      seq: Number(next),
      tool: name,
      riskLevel: def?.risk ?? 3,
      decision,
      inputHash,
      input: input.slice(0, 8000),
      output: stableStringify({ approvedBy, taskId: task.id, ...(output as object) }).slice(0, 8000),
    });

  const fail = async (error: string, inputHash = task.pendingInputHash ?? "", input = task.pendingInput ?? "") => {
    await log("failed", { error }, inputHash, input);
    return { ran: true as const, ok: false as const, error };
  };

  if (!def) return fail("This task names a tool that no longer exists.");
  let raw: unknown;
  try {
    raw = JSON.parse(task.pendingInput ?? "");
  } catch {
    return fail("The approved request is unreadable.");
  }
  const inputText = stableStringify(raw);
  const inputHash = await sha256Hex(`${name}:${inputText}`);
  if (inputHash !== task.pendingInputHash) return fail("The approved request does not match its fingerprint.", inputHash, inputText);
  const parsed = def.input.safeParse(raw);
  if (!parsed.success) return fail("The approved request is no longer valid.", inputHash, inputText);

  try {
    const output = await def.run(
      { workspaceId: task.workspaceId, agentKey: task.agentKey, runId, approvedBy },
      parsed.data as never,
    );
    await log("executed", { result: output }, inputHash, inputText);
    return { ran: true, ok: true, output };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "The approved act failed.", inputHash, inputText);
  }
}

/** Put a task back in the queue after its act failed, keeping the reason. */
export async function reopenTask(taskId: number, workspaceId: string, reason: string) {
  await db
    .update(agentTasks)
    .set({ status: "open", result: `Failed: ${reason}`.slice(0, 2000) })
    .where(and(eq(agentTasks.id, taskId), eq(agentTasks.workspaceId, workspaceId)));
}
