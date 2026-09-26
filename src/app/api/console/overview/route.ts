import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  workspaces,
  metricDefinitions,
  metricReadings,
  agents,
  agentRuns,
  agentTasks,
  obligations,
  activityEvents,
  user as userTable,
} from "@/db/schema";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/log";
import { liveConnections } from "@/lib/console/connections.server";
import { QA_ACCOUNT, QA_COOKIE, QA_HEADER, isQaRequest } from "@/lib/qa-bypass";

export const dynamic = "force-dynamic";

/**
 * Maps the free-text industry from onboarding onto a console sector.
 * An unknown value stays as written, so nothing is lost.
 */
function sectorFrom(industry: string | null): string {
  return industry && industry.trim().length > 0 ? industry.trim() : "General";
}

function employeesFrom(teamSize: string | null): number {
  if (!teamSize) return 0;
  const first = teamSize.match(/\d+/);
  return first ? Number(first[0]) : 0;
}

/**
 * The single read the console makes. Everything the dashboard draws comes
 * from here. The workspace is the one owned by the signed-in account: there
 * is no shared or demo fallback, so one account never sees another's data.
 */
export async function GET() {
  try {
    const requestHeaders = await headers();
    const cookieHeader = requestHeaders.get("cookie") || "";
    const qaCookie =
      cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${QA_COOKIE}=`))
        ?.slice(QA_COOKIE.length + 1) ?? null;

    // Preview-only QA identity. It owns its own empty workspace, so it can
    // never read or write an account's data. Disabled in production builds.
    const qa = isQaRequest({
      cookie: qaCookie,
      header: requestHeaders.get(QA_HEADER),
    });

    const session = qa ? null : await auth.api.getSession({ headers: requestHeaders });
    const account = qa ? { ...QA_ACCOUNT } : session?.user;

    if (!account) {
      return NextResponse.json(
        {
          error: "not_authenticated",
          message: "Please sign in to open your workspace.",
        },
        { status: 401 },
      );
    }

    // The workspace row has a foreign key on the user table, so the QA
    // identity needs a row of its own before it can own a workspace.
    if (qa) {
      await db
        .insert(userTable)
        .values({
          id: QA_ACCOUNT.id,
          name: QA_ACCOUNT.name,
          email: QA_ACCOUNT.email,
          emailVerified: true,
          companyName: "QA Workspace",
          companyIndustry: "General",
          countryCode: "CY",
          onboardingCompleted: true,
        })
        .onConflictDoNothing();
    }



    let [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerUserId, account.id))
      .limit(1);

    /** First visit after sign-up: give the account its own empty workspace. */
    if (!workspace) {
      const [profile] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, account.id))
        .limit(1);

      const created = await db
        .insert(workspaces)
        .values({
          id: `ws_${account.id}`,
          ownerUserId: account.id,
          name: profile?.companyName?.trim() || account.name || "My workspace",
          legalName: profile?.companyName?.trim() || null,
          sector: sectorFrom(profile?.companyIndustry ?? null),
          employees: employeesFrom(profile?.teamSize ?? null),
          sites: 1,
          country: profile?.countryCode?.toUpperCase() || "CY",
          ownerName: account.name || null,
          ownerRole: "Owner",
          isDemo: false,
        })
        .onConflictDoNothing()
        .returning();

      workspace =
        created[0] ??
        (
          await db
            .select()
            .from(workspaces)
            .where(eq(workspaces.ownerUserId, account.id))
            .limit(1)
        )[0];
    }

    if (!workspace) {
      return NextResponse.json(
        { error: "workspace_unavailable", message: "Your workspace could not be opened." },
        { status: 503 },
      );
    }

    const workspaceId = workspace.id;


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
          // Seed rows are never shown as agent activity.
          .where(and(eq(agentRuns.workspaceId, workspaceId), ne(agentRuns.trigger, "sample")))
          .orderBy(desc(agentRuns.startedAt))
          .limit(20),
        db
          .select()
          .from(agentTasks)
          .where(and(eq(agentTasks.workspaceId, workspaceId), eq(agentTasks.status, "open")))
          .orderBy(asc(agentTasks.dueAt))
          .limit(20),
        liveConnections(account.id, workspaceId),
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
      {
        label: string;
        periodStart: string;
        value: number;
        source: string;
        confidence: number;
        site: string | null;
      }[]
    > = {};
    const siteNames = new Set<string>();
    for (const r of readings) {
      if (r.site) siteNames.add(r.site);
      (series[r.metricKey] ??= []).push({
        label: r.periodLabel,
        periodStart: r.periodStart,
        value: r.value,
        source: r.source,
        confidence: r.confidence,
        site: r.site ?? null,
      });
    }

    // Headline figures read the whole-workspace rows; per-site rows are
    // kept on `points` for the site filter in the console.
    const metrics = defs.map((d) => {
      const all = series[d.key] ?? [];
      const workspaceRows = all.filter((p) => p.site === null);
      const points = all;
      const headline = workspaceRows.length > 0 ? workspaceRows : all;
      const current = headline.at(-1)?.value ?? 0;
      const previous = headline.at(-2)?.value ?? current;
      const first = headline[0]?.value ?? current;
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
      sites: [...siteNames].sort((a, b) => a.localeCompare(b)),
      agents: roster,
      runs,
      tasks,
      connections,
      obligations: obs,
      events,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const ref = logger("console.overview").error("overview read failed", error);
    return NextResponse.json(
      {
        error: "console_unavailable",
        message: `The console could not read your workspace. Reference ${ref}.`,
        ref,
      },
      { status: 503 },
    );
  }
}
