/**
 * The console copilot.
 *
 * One conversation per workspace, stored in the database. The model reads the
 * real workspace records before it answers, so every figure it quotes comes
 * from the same source as the dashboard. It can also propose an act; the act
 * is written as a pending proposal and only runs after a person approves it
 * in /api/console/copilot/proposal.
 */

import { aiChatStream, aiErrorMessage, hasLovableAi } from "@/lib/lovable-ai";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  agentTasks,
  agents,
  copilotMessages,
  copilotProposals,
  metricDefinitions,
  metricReadings,
  obligations,
  activityEvents,
} from "@/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { resolveConsoleSession } from "@/lib/console-session";
import { readCompany } from "@/lib/company-update.server";
import { ACTION_MARKER, parseAction, systemPrompt } from "@/lib/copilot/prompt";
import { checkGrounding } from "@/lib/copilot/grounding";

export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 40;

/**
 * Turn a provider failure into a sentence an operator can act on. A generic
 * "try again" hides an exhausted balance, and the person then retries
 * forever against a wall.
 */
function providerMessage(error: unknown): string {
  return aiErrorMessage(error);
}

/* ------------------------------------------------------------------ */
/* Read                                                                 */
/* ------------------------------------------------------------------ */

export async function GET() {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json(
      { error: resolved.error, message: resolved.message },
      { status: resolved.status },
    );
  }
  const { workspace } = resolved.session;

  const [messages, proposals] = await Promise.all([
    db
      .select()
      .from(copilotMessages)
      .where(eq(copilotMessages.workspaceId, workspace.id))
      .orderBy(asc(copilotMessages.id))
      .limit(HISTORY_LIMIT * 2),
    db
      .select()
      .from(copilotProposals)
      .where(eq(copilotProposals.workspaceId, workspace.id))
      .orderBy(desc(copilotProposals.id))
      .limit(30),
  ]);

  return NextResponse.json({ messages, proposals, workspace: { name: workspace.name } });
}

/** Clears the conversation. The proposals ledger is kept for the audit trail. */
export async function DELETE() {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json(
      { error: resolved.error, message: resolved.message },
      { status: resolved.status },
    );
  }
  await db
    .delete(copilotMessages)
    .where(eq(copilotMessages.workspaceId, resolved.session.workspace.id));
  return NextResponse.json({ ok: true });
}

/* ------------------------------------------------------------------ */
/* Briefing                                                             */
/* ------------------------------------------------------------------ */

function round(value: number, precision: number): string {
  return Number.isFinite(value) ? value.toFixed(precision) : "0";
}

/**
 * Turns the workspace records into a compact briefing. The model may quote
 * only what appears here, which is what keeps the answers auditable.
 */
async function buildBriefing(workspaceId: string, accountId: string) {
  const company = await readCompany(accountId, workspaceId).catch(() => null);
  const [defs, readings, roster, tasks, obs, events] = await Promise.all([
    db.select().from(metricDefinitions).orderBy(asc(metricDefinitions.sortOrder)),
    db
      .select()
      .from(metricReadings)
      .where(eq(metricReadings.workspaceId, workspaceId))
      .orderBy(asc(metricReadings.periodStart)),
    db.select().from(agents).orderBy(asc(agents.sortOrder)),
    db
      .select()
      .from(agentTasks)
      .where(and(eq(agentTasks.workspaceId, workspaceId), eq(agentTasks.status, "open")))
      .orderBy(asc(agentTasks.dueAt))
      .limit(20),
    db
      .select()
      .from(obligations)
      .where(eq(obligations.workspaceId, workspaceId))
      .orderBy(asc(obligations.dueDate)),
    db
      .select()
      .from(activityEvents)
      .where(eq(activityEvents.workspaceId, workspaceId))
      .orderBy(desc(activityEvents.createdAt))
      .limit(10),
  ]);

  const byMetric = new Map<string, typeof readings>();
  for (const r of readings) {
    const list = byMetric.get(r.metricKey) ?? [];
    list.push(r);
    byMetric.set(r.metricKey, list);
  }

  const metricLines = defs.map((d) => {
    const points = byMetric.get(d.key) ?? [];
    const current = points.at(-1);
    const previous = points.at(-2);
    const trend =
      current && previous && previous.value !== 0
        ? `${(((current.value - previous.value) / previous.value) * 100).toFixed(1)}% vs ${previous.periodLabel}`
        : "no comparison period";
    const recent = points
      .slice(-6)
      .map((p) => `${p.periodLabel}=${round(p.value, d.precision)}`)
      .join(", ");
    return `- ${d.key} "${d.label}": ${current ? round(current.value, d.precision) : "no reading"} ${d.unit} (${trend}). Better when ${d.goodDirection}. Recent: ${recent || "none"}`;
  });

  const companyLine = company
    ? `- name ${company.companyName ?? "not set"}; industry ${company.industry ?? "not set"}; team size ${company.teamSize ?? "not set"}; country ${company.country}; sites ${company.sites}; yearly revenue ${company.revenueEur ?? "not set"} EUR`
    : "- could not be read";

  return [
    "COMPANY DETAILS (profile + workspace)",
    companyLine,
    "",
    "METRICS (metric_definitions + metric_readings)",
    metricLines.join("\n") || "- none recorded",
    "",
    "AGENTS (agents)",
    roster
      .map((a) => `- ${a.key} "${a.name}" - ${a.role}, autonomy ${a.autonomy}, status ${a.status}`)
      .join("\n") || "- none",
    "",
    "OPEN TASKS (agent_tasks)",
    tasks
      .map((t) => `- #${t.id} [${t.severity}] ${t.title} (agent ${t.agentKey}, due ${t.dueAt ?? "unset"})`)
      .join("\n") || "- none",
    "",
    "OBLIGATIONS (obligations)",
    obs
      .map(
        (o) =>
          `- ${o.id} ${o.framework}: ${o.title}, due ${o.dueDate}, status ${o.status}, ${Math.round(o.progressPct)}% complete`,
      )
      .join("\n") || "- none",
    "",
    "RECENT ACTIVITY (activity_events)",
    events.map((e) => `- ${e.actorName} ${e.verb} ${e.object}`).join("\n") || "- none",
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/* Write and stream                                                     */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  const requestHeaders = await headers();
  const resolved = await resolveConsoleSession(requestHeaders);
  if (!resolved.ok) {
    return NextResponse.json(
      { error: resolved.error, message: resolved.message },
      { status: resolved.status },
    );
  }
  const { workspace } = resolved.session;

  let prompt = "";
  try {
    const body = (await req.json()) as { prompt?: unknown };
    prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  } catch {
    prompt = "";
  }
  if (!prompt) {
    return NextResponse.json(
      { error: "empty_prompt", message: "Write a question first." },
      { status: 400 },
    );
  }
  if (prompt.length > 4000) prompt = prompt.slice(0, 4000);

  if (!hasLovableAi()) {
    return NextResponse.json(
      { error: "ai_unavailable", message: "The copilot is not configured on this deployment." },
      { status: 503 },
    );
  }

  const history = await db
    .select()
    .from(copilotMessages)
    .where(eq(copilotMessages.workspaceId, workspace.id))
    .orderBy(desc(copilotMessages.id))
    .limit(HISTORY_LIMIT);
  history.reverse();

  const briefing = await buildBriefing(workspace.id, resolved.session.account.id);
  const instructions = systemPrompt(
    workspace.name,
    workspace.sector,
    workspace.framework,
    briefing,
  );

  const [userRow] = await db
    .insert(copilotMessages)
    .values({ workspaceId: workspace.id, role: "user", content: prompt })
    .returning();

  const messages = [
    { role: "system" as const, content: instructions },
    ...history.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user" as const, content: prompt },
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

      send({ type: "user", id: userRow.id });

      let full = "";
      /** Text already sent to the browser. The action block is never sent. */
      let emitted = 0;

      const flush = (final: boolean) => {
        const cut = full.indexOf(ACTION_MARKER);
        // Hold back a short tail so a marker split across chunks is not shown.
        const safeEnd =
          cut !== -1 ? cut : final ? full.length : Math.max(0, full.length - ACTION_MARKER.length);
        if (safeEnd > emitted) {
          send({ type: "delta", text: full.slice(emitted, safeEnd) });
          emitted = safeEnd;
        }
      };

      try {
        for await (const text of aiChatStream({ messages })) {
          full += text;
          flush(false);
        }
        flush(true);

        const visible = (full.indexOf(ACTION_MARKER) === -1
          ? full
          : full.slice(0, full.indexOf(ACTION_MARKER))
        ).trim();

        const [assistantRow] = await db
          .insert(copilotMessages)
          .values({
            workspaceId: workspace.id,
            role: "assistant",
            content: visible || "I could not produce an answer for that.",
          })
          .returning();

        const action = parseAction(full);
        if (!action && full.includes(ACTION_MARKER)) {
          console.warn("copilot action block could not be read", full.slice(full.indexOf(ACTION_MARKER), full.indexOf(ACTION_MARKER) + 600));
        }
        if (action) {
          const [proposal] = await db
            .insert(copilotProposals)
            .values({
              workspaceId: workspace.id,
              messageId: assistantRow.id,
              kind: action.kind,
              title: action.title.slice(0, 200),
              summary: action.summary.slice(0, 500),
              payload: JSON.stringify(action.payload),
              status: "pending",
            })
            .returning();
          send({ type: "proposal", proposal });
        }

        // Every figure in the answer must appear in the records Verde was given.
        const grounding = checkGrounding(visible, briefing);
        if (!grounding.ok) send({ type: "grounding", unsupported: grounding.unsupported, unsourced: grounding.unsourced });

        send({ type: "done", id: assistantRow.id });
      } catch (error) {
        console.error("copilot stream failed", error);
        send({ type: "error", message: providerMessage(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
