/**
 * Runs one tool call for an agent: validate input, check the step limit and
 * autonomy policy, execute or park it for a human, and write the ledger row.
 * Every path writes a step, including blocked and failed ones.
 */

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { agentSteps, agentTasks } from "@/db/schema";
import { decideStep, type PolicyMode, type RiskLevel } from "./policy";
import { TOOLS, type ToolContext, type ToolName } from "./tools";
import { sha256Hex, stableStringify } from "./hash";

export class StepLimitError extends Error {
  constructor(limit: number) {
    super(`Run stopped: it reached the limit of ${limit} steps.`);
  }
}

export interface StepResult<O = unknown> {
  decision: "executed" | "queued_for_approval" | "blocked" | "failed";
  output: O | null;
  error?: string;
}

export class AgentRuntime {
  private seq = 0;

  constructor(
    readonly ctx: ToolContext,
    private readonly policies: Partial<Record<RiskLevel, PolicyMode>>,
    private readonly maxSteps: number,
  ) {}

  get steps(): number {
    return this.seq;
  }

  async call<N extends ToolName>(
    name: N,
    rawInput: unknown,
  ): Promise<StepResult<Awaited<ReturnType<(typeof TOOLS)[N]["run"]>>>> {
    if (this.seq >= this.maxSteps) throw new StepLimitError(this.maxSteps);
    this.seq += 1;
    const seq = this.seq;
    const def = TOOLS[name];
    const inputText = stableStringify(rawInput ?? {});
    const inputHash = await sha256Hex(`${name}:${inputText}`);

    const write = (decision: StepResult["decision"], output: unknown) =>
      db.insert(agentSteps).values({
        runId: this.ctx.runId,
        workspaceId: this.ctx.workspaceId,
        agentKey: this.ctx.agentKey,
        seq,
        tool: name,
        riskLevel: def.risk,
        decision,
        inputHash,
        input: inputText.slice(0, 8000),
        output: output === null ? null : stableStringify(output).slice(0, 8000),
      });

    const parsed = def.input.safeParse(rawInput ?? {});
    if (!parsed.success) {
      const error = `Invalid input: ${parsed.error.issues.map((i) => i.message).join("; ")}`;
      await write("failed", { error });
      return { decision: "failed", output: null, error };
    }

    const decision = decideStep(def.risk, this.policies);
    if (decision === "block") {
      await write("blocked", { reason: "Policy denies this risk level." });
      return { decision: "blocked", output: null };
    }
    if (decision === "ask") {
      // One open approval per exact call: a daily re-run does not pile up duplicates.
      const [open] = await db
        .select({ id: agentTasks.id })
        .from(agentTasks)
        .where(
          and(
            eq(agentTasks.workspaceId, this.ctx.workspaceId),
            eq(agentTasks.status, "open"),
            eq(agentTasks.pendingInputHash, inputHash),
          ),
        )
        .limit(1);
      const titleFn = def.approvalTitle as ((i: unknown) => string) | undefined;
      const title = (titleFn ? titleFn(parsed.data) : `Approve ${name.replace(/_/g, " ")} (risk level ${def.risk})`).slice(0, 200);
      const taskId =
        open?.id ??
        (
          await db
            .insert(agentTasks)
            .values({
              workspaceId: this.ctx.workspaceId,
              agentKey: this.ctx.agentKey,
              kind: "approval",
              title,
              detail: (
                (def.approvalDetail ? `${(def.approvalDetail as (i: unknown) => string)(parsed.data)}\n\n` : "") +
                `${def.description} Run #${this.ctx.runId}, step ${seq}. Fingerprint ${inputHash.slice(0, 12)}.`
              ).slice(0, 20_000),
              severity: def.risk >= 3 ? "high" : "normal",
              status: "open",
              runId: this.ctx.runId,
              pendingTool: name,
              pendingInput: inputText,
              pendingInputHash: inputHash,
            })
            .returning({ id: agentTasks.id })
        )[0].id;
      await write("queued_for_approval", { taskId, reused: Boolean(open) });
      return { decision: "queued_for_approval", output: null };
    }

    try {
      // The parse succeeded, so the input matches the tool's schema.
      const output = (await def.run(this.ctx, parsed.data as never)) as Awaited<
        ReturnType<(typeof TOOLS)[N]["run"]>
      >;
      await write("executed", output);
      return { decision: "executed", output };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tool failed.";
      await write("failed", { error: message });
      return { decision: "failed", output: null, error: message };
    }
  }
}
