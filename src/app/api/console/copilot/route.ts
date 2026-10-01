/**
 * The console copilot.
 *
 * One conversation per workspace, stored in the database. The model reads the
 * real workspace records before it answers, so every figure it quotes comes
 * from the same source as the dashboard. It can also propose an act; the act
 * is written as a pending proposal and only runs after a person approves it
 * in /api/console/copilot/proposal.
 */

import { aiErrorMessage, hasTextAi, textLanguageModel } from "@/lib/lovable-ai";
import { createUIMessageStream, createUIMessageStreamResponse, isStepCount, streamText, toUIMessageStream, type UIMessage } from "ai";
import { verdeTools } from "@/lib/copilot/tools.server";
import { logger } from "@/lib/log";
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
import { toolSystemPrompt } from "@/lib/copilot/prompt";
import { checkGrounding } from "@/lib/copilot/grounding";

export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 40;

/**
 * Turn a provider failure into a sentence an operator can act on. A generic
 * "try again" hides an exhausted balance, and the person then retries
 * forever against a wall.
 */

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

  // Older answers have no parts; they come back as one text part.
  const uiMessages = messages.map((m) => ({
    id: `db-${m.id}`,
    role: m.role === "user" ? "user" : "assistant",
    parts: Array.isArray(m.parts) && m.parts.length ? m.parts : [{ type: "text", text: m.content }],
  }));
  return NextResponse.json({ messages: uiMessages, proposals, workspace: { name: workspace.name } });
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

const log = logger("api.console.copilot");

const PAGES = new Set(["home", "footprint", "actions", "suppliers", "deadlines", "reports", "cbam", "agents", "integrations", "settings"]);

function textOf(message: unknown): string {
  const parts = (message as { parts?: Array<{ type?: string; text?: string }> })?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .filter((p) => p?.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("\n")
    .trim();
}

export async function POST(req: Request) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }
  const { workspace, account } = resolved.session;

  let prompt = "";
  let page: string | null = null;
  try {
    const body = (await req.json()) as { message?: unknown; prompt?: unknown; page?: unknown };
    prompt = typeof body.prompt === "string" ? body.prompt.trim() : textOf(body.message);
    page = typeof body.page === "string" && PAGES.has(body.page) ? body.page : null;
  } catch {
    prompt = "";
  }
  if (!prompt) {
    return NextResponse.json({ error: "empty_prompt", message: "Write a question first." }, { status: 400 });
  }
  if (prompt.length > 4000) prompt = prompt.slice(0, 4000);

  if (!hasTextAi()) {
    return NextResponse.json(
      { error: "ai_unavailable", message: "Verde is not configured on this deployment." },
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

  const briefing = await buildBriefing(workspace.id, account.id);
  const system = toolSystemPrompt(workspace.name, workspace.sector, workspace.framework, briefing, page);

  const [userRow] = await db
    .insert(copilotMessages)
    .values({ workspaceId: workspace.id, role: "user", content: prompt, parts: [{ type: "text", text: prompt }] })
    .returning();

  const { provider, model } = await textLanguageModel();
  const tools = verdeTools({ workspaceId: workspace.id, accountId: account.id });

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({ type: "start", messageId: `db-pending-${userRow.id}` });
      const result = streamText({
        model,
        system,
        messages: [
          ...history.map((m) => ({ role: m.role === "user" ? ("user" as const) : ("assistant" as const), content: m.content })),
          { role: "user" as const, content: prompt },
        ],
        tools,
        stopWhen: isStepCount(50),
        ...(provider === "groq" ? { providerOptions: { groq: { reasoningEffort: "low" } } } : {}),
      });
      writer.merge(toUIMessageStream({ stream: result.stream, tools, sendStart: false, sendFinish: false, sendReasoning: false }));

      // Every figure in the answer must appear in the records or a tool result.
      const [text, steps] = await Promise.all([result.text, result.steps]);
      const outputs = steps
        .flatMap((step) => step.toolResults ?? [])
        .map((r) => JSON.stringify((r as { output?: unknown }).output ?? ""))
        .join("\n");
      // Models often write dates with non-breaking hyphens; normalise before checking.
      const grounding = checkGrounding(text.replace(/[\u2010-\u2013]/g, "-"), `${briefing}\n${outputs}`);
      if (!grounding.ok) {
        writer.write({ type: "data-grounding", data: { unsupported: grounding.unsupported, unsourced: grounding.unsourced } });
      }
      writer.write({ type: "finish" });
    },
    onError: (error) => {
      log.error("stream failed", error);
      return aiErrorMessage(error);
    },
    onEnd: async ({ responseMessage }) => {
      try {
        const parts = (responseMessage as UIMessage).parts ?? [];
        const visible = parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("\n")
          .trim();
        const [row] = await db
          .insert(copilotMessages)
          .values({
            workspaceId: workspace.id,
            role: "assistant",
            content: visible || "I prepared the cards below.",
            parts: parts as unknown[],
          })
          .returning();
        // Proposals filed during this answer belong to it.
        const ids = parts
          .map((p) => (p as { type?: string; output?: { proposalId?: number } }).type === "tool-propose_change"
            ? (p as { output?: { proposalId?: number } }).output?.proposalId
            : undefined)
          .filter((id): id is number => typeof id === "number");
        for (const id of ids) {
          await db
            .update(copilotProposals)
            .set({ messageId: row.id })
            .where(and(eq(copilotProposals.id, id), eq(copilotProposals.workspaceId, workspace.id)));
        }
      } catch (error) {
        log.error("saving the answer failed", error);
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
