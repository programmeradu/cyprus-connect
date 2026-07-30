import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  workspaces,
  metricDefinitions,
  metricReadings,
  agents,
  agentRuns,
  agentTasks,
  dataConnections,
  obligations,
  activityEvents,
} from "@/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DEMO_WORKSPACE = "ws_demo_cy";

/**
 * The single read the console makes. Everything the dashboard draws comes
 * from here, so demo data and live data are the same code path.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspace") ?? DEMO_WORKSPACE;

  try {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return NextResponse.json(
        { error: "workspace_not_found", workspaceId },
        { status: 404 },
      );
    }

    const [defs, readings, roster, runs, tasks, connections, obs, events] =
      await Promise.all([
        db.select().from(metricDefinitions).orderBy(asc(metricDefinitions.sortOrder)),
        db
          .select()
          .from(metricReadings)
          .where(eq(metricReadings.workspaceId, workspaceId))
          .orderBy(asc(metricReadings.periodStart)),
        db.select().from(agents).orderBy(asc(agents.sortOrder)),
        db
          .select()
          .from(agentRuns)
          .where(eq(agentRuns.workspaceId, workspaceId))
          .orderBy(desc(agentRuns.startedAt))
          .limit(20),
        db
          .select()
          .from(agentTasks)
          .where(and(eq(agentTasks.workspaceId, workspaceId), eq(agentTasks.status, "open")))
          .orderBy(asc(agentTasks.dueAt))
          .limit(20),
        db
          .select()
          .from(dataConnections)
          .where(eq(dataConnections.workspaceId, workspaceId))
          .orderBy(asc(dataConnections.sortOrder)),
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
          .limit(12),
      ]);

    /** Fold the flat reading rows into one series per metric. */
    const series: Record<
      string,
      { label: string; periodStart: string; value: number; source: string; confidence: number }[]
    > = {};
    for (const r of readings) {
      (series[r.metricKey] ??= []).push({
        label: r.periodLabel,
        periodStart: r.periodStart,
        value: r.value,
        source: r.source,
        confidence: r.confidence,
      });
    }

    const metrics = defs.map((d) => {
      const points = series[d.key] ?? [];
      const current = points.at(-1)?.value ?? 0;
      const previous = points.at(-2)?.value ?? current;
      const first = points[0]?.value ?? current;
      const delta = previous === 0 ? 0 : ((current - previous) / previous) * 100;
      const sinceStart = first === 0 ? 0 : ((current - first) / first) * 100;
      return {
        ...d,
        current,
        previous,
        delta,
        sinceStart,
        points,
      };
    });

    return NextResponse.json({
      workspace,
      metrics,
      agents: roster,
      runs,
      tasks,
      connections,
      obligations: obs,
      events,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("console overview read failed", error);
    return NextResponse.json(
      {
        error: "console_unavailable",
        message: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 503 },
    );
  }
}
