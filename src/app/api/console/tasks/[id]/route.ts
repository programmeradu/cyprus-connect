import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { activityEvents, agentTasks, user as userTable, workspaces } from "@/db/schema";
import { bindSessionUser } from "@/lib/api-auth";
import { executeApprovedTask, reopenTask } from "@/lib/agents/approvals";

export const dynamic = "force-dynamic";

const Body = z.object({
  decision: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500).optional(),
});

/**
 * A person decides an open agent task. The task closes and the decision is
 * written to the audit ledger in one transaction. Only the workspace owner can
 * decide, and only a task that is still open.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const bound = await bindSessionUser(request);
  if (!bound.ok) return bound.response;

  const taskId = Number((await params).id);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ error: "Unknown task." }, { status: 400 });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
  }
  const { decision, note } = parsed.data;

  const [ws] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.ownerUserId, bound.userId))
    .limit(1);
  if (!ws) return NextResponse.json({ error: "No workspace for this account." }, { status: 404 });

  const [actor] = await db
    .select({ name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, bound.userId))
    .limit(1);

  const status = decision === "approve" ? "approved" : "rejected";
  const result = await db.transaction(async (tx) => {
    const [closed] = await tx
      .update(agentTasks)
      .set({ status })
      .where(and(eq(agentTasks.id, taskId), eq(agentTasks.workspaceId, ws.id), eq(agentTasks.status, "open")))
      .returning({
        id: agentTasks.id,
        title: agentTasks.title,
        workspaceId: agentTasks.workspaceId,
        agentKey: agentTasks.agentKey,
        runId: agentTasks.runId,
        pendingTool: agentTasks.pendingTool,
        pendingInput: agentTasks.pendingInput,
        pendingInputHash: agentTasks.pendingInputHash,
      });
    if (!closed) return null;
    await tx.insert(activityEvents).values({
      workspaceId: ws.id,
      actorType: "human",
      actorName: actor?.name?.trim() || "Workspace owner",
      verb: status,
      object: closed.title,
      detail: note || null,
    });
    return closed;
  });

  if (!result) {
    return NextResponse.json(
      { error: "This task is already decided or does not belong to your workspace." },
      { status: 409 },
    );
  }
  // Approving an agent's request runs the act it asked for, on the exact input it showed.
  if (decision === "approve" && result.pendingTool) {
    const approver = actor?.name?.trim() || "Workspace owner";
    const outcome = await executeApprovedTask(result, approver);
    if (outcome.ran && !outcome.ok) {
      await reopenTask(result.id, ws.id, outcome.error);
      await db.insert(activityEvents).values({
        workspaceId: ws.id,
        actorType: "agent",
        actorName: result.agentKey,
        verb: "could not carry out",
        object: result.title,
        detail: outcome.error,
      });
      return NextResponse.json({ error: outcome.error, reopened: true }, { status: 409 });
    }
    if (outcome.ran && outcome.ok) {
      await db.update(agentTasks).set({ result: JSON.stringify(outcome.output).slice(0, 2000) }).where(eq(agentTasks.id, result.id));
      await db.insert(activityEvents).values({
        workspaceId: ws.id,
        actorType: "agent",
        actorName: result.agentKey,
        verb: "carried out",
        object: result.title,
        detail: `Approved by ${approver}.`,
      });
      return NextResponse.json({ id: result.id, status, acted: true, result: outcome.output });
    }
  }
  return NextResponse.json({ id: result.id, status });
}
