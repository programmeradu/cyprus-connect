/**
 * The approval gate.
 *
 * A copilot proposal changes nothing until a person decides here. The act is
 * validated again against the workspace records before it runs, so an old or
 * altered proposal cannot reach another workspace. Every approved act writes
 * an activity event, which keeps the audit ledger complete.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  agentTasks,
  agents,
  copilotProposals,
  metricDefinitions,
  metricReadings,
  obligations,
  activityEvents,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { resolveConsoleSession } from "@/lib/console-session";

export const dynamic = "force-dynamic";

const SEVERITIES = new Set(["high", "normal", "low"]);
const OBLIGATION_STATUSES = new Set(["on_track", "at_risk", "late", "complete"]);

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function POST(req: Request) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json(
      { error: resolved.error, message: resolved.message },
      { status: resolved.status },
    );
  }
  const { workspace, account } = resolved.session;

  let proposalId = 0;
  let decision = "";
  try {
    const body = (await req.json()) as { id?: unknown; decision?: unknown };
    proposalId = Number(body.id);
    decision = typeof body.decision === "string" ? body.decision : "";
  } catch {
    /* handled below */
  }

  if (!Number.isInteger(proposalId) || !["approve", "reject"].includes(decision)) {
    return NextResponse.json(
      { error: "bad_request", message: "Send a proposal id and a decision." },
      { status: 400 },
    );
  }

  const [proposal] = await db
    .select()
    .from(copilotProposals)
    .where(
      and(eq(copilotProposals.id, proposalId), eq(copilotProposals.workspaceId, workspace.id)),
    )
    .limit(1);

  if (!proposal) {
    return NextResponse.json(
      { error: "not_found", message: "That proposal is not in this workspace." },
      { status: 404 },
    );
  }
  if (proposal.status !== "pending") {
    return NextResponse.json(
      { error: "already_decided", message: `This proposal is already ${proposal.status}.` },
      { status: 409 },
    );
  }

  const actor = account.name || account.email || "A workspace member";

  if (decision === "reject") {
    const [updated] = await db
      .update(copilotProposals)
      .set({
        status: "rejected",
        decidedBy: actor,
        decidedAt: new Date(),
        resultNote: "Declined by a person.",
      })
      .where(eq(copilotProposals.id, proposal.id))
      .returning();
    return NextResponse.json({ proposal: updated });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(proposal.payload) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  let note = "";

  try {
    if (proposal.kind === "create_task") {
      const title = asString(payload.title) ?? proposal.title;
      const agentKey = asString(payload.agentKey);
      let resolvedAgent = "copilot";
      if (agentKey) {
        const [row] = await db.select().from(agents).where(eq(agents.key, agentKey)).limit(1);
        if (row) resolvedAgent = row.key;
      }
      const severity = asString(payload.severity);
      await db.insert(agentTasks).values({
        workspaceId: workspace.id,
        agentKey: resolvedAgent,
        kind: "approval",
        title: title.slice(0, 200),
        detail: asString(payload.detail),
        severity: severity && SEVERITIES.has(severity) ? severity : "normal",
        status: "open",
        dueAt: asString(payload.dueAt),
      });
      note = `Task created: ${title}`;
    } else if (proposal.kind === "update_obligation") {
      const obligationId = asString(payload.obligationId);
      if (!obligationId) throw new Error("The proposal has no obligation id.");
      const [row] = await db
        .select()
        .from(obligations)
        .where(and(eq(obligations.id, obligationId), eq(obligations.workspaceId, workspace.id)))
        .limit(1);
      if (!row) throw new Error("That obligation is not in this workspace.");

      const status = asString(payload.status);
      const progressRaw = Number(payload.progressPct);
      const patch: { status?: string; progressPct?: number } = {};
      if (status && OBLIGATION_STATUSES.has(status)) patch.status = status;
      if (Number.isFinite(progressRaw)) {
        patch.progressPct = Math.min(100, Math.max(0, progressRaw));
      }
      if (Object.keys(patch).length === 0) throw new Error("The proposal changes nothing.");

      await db.update(obligations).set(patch).where(eq(obligations.id, row.id));
      note = `Obligation updated: ${row.title}`;
    } else if (proposal.kind === "log_reading") {
      const metricKey = asString(payload.metricKey);
      const value = Number(payload.value);
      const periodStart = asString(payload.periodStart);
      const periodLabel = asString(payload.periodLabel);
      if (!metricKey || !periodStart || !periodLabel || !Number.isFinite(value)) {
        throw new Error("The reading is incomplete.");
      }
      const [def] = await db
        .select()
        .from(metricDefinitions)
        .where(eq(metricDefinitions.key, metricKey))
        .limit(1);
      if (!def) throw new Error("That metric does not exist.");

      await db.insert(metricReadings).values({
        workspaceId: workspace.id,
        metricKey: def.key,
        periodStart,
        periodLabel,
        value,
        source: "copilot",
        confidence: 0.9,
      });
      note = `Reading logged: ${def.label} ${value} ${def.unit} for ${periodLabel}`;
    } else {
      throw new Error("That kind of act is not supported.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "The act could not run.";
    const [failed] = await db
      .update(copilotProposals)
      .set({
        status: "failed",
        decidedBy: actor,
        decidedAt: new Date(),
        resultNote: message,
      })
      .where(eq(copilotProposals.id, proposal.id))
      .returning();
    return NextResponse.json({ proposal: failed, message }, { status: 422 });
  }

  await db.insert(activityEvents).values({
    workspaceId: workspace.id,
    actorType: "human",
    actorName: actor,
    verb: "approved",
    object: proposal.title,
    detail: note,
  });

  const [approved] = await db
    .update(copilotProposals)
    .set({ status: "approved", decidedBy: actor, decidedAt: new Date(), resultNote: note })
    .where(eq(copilotProposals.id, proposal.id))
    .returning();

  return NextResponse.json({ proposal: approved, note });
}
