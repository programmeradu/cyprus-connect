import { cachedTranslations, localeOf } from "@/lib/translate.server";
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
import { loadCompanyWorkspace, rosterFor } from "@/lib/company.server";
import { RUNNABLE_AGENTS } from "@/lib/agents/orchestrator";
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
export async function GET(req: Request) {
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

    console.log("[overview] Step 1: getSession");
    const session = qa ? null : await auth.api.getSession({ headers: requestHeaders });
    const account = qa ? { ...QA_ACCOUNT } : session?.user;
    console.log("[overview] Step 1 done, account:", account?.id);

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

    console.log("[overview] Step 2: workspace lookup");
    let [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerUserId, account.id))
      .limit(1);

    /** First visit after sign-up: give the account its own empty workspace. */
    if (!workspace) {
      console.log("[overview] Step 2b: creating workspace");
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

    console.log("[overview] Step 3: loadCompanyWorkspace");
    // Company facts come from their one home (see company.server.ts).
    workspace = await loadCompanyWorkspace(account.id, workspace);
    const workspaceId = workspace.id;
    console.log("[overview] Step 3 done, workspaceId:", workspaceId);

    console.log("[overview] Step 4: Promise.all starting");
    const [defs, readings, roster, runs, tasks, connections, obs, events] =
      await Promise.all([
        (async () => {
          console.log("[overview] Q: defs start");
          const r = await db.select().from(metricDefinitions).orderBy(asc(metricDefinitions.sortOrder));
          console.log("[overview] Q: defs done");
          return r;
        })(),
        (async () => {
          console.log("[overview] Q: readings start");
          const r = await db.select().from(metricReadings).where(eq(metricReadings.workspaceId, workspaceId)).orderBy(asc(metricReadings.periodStart));
          console.log("[overview] Q: readings done");
          return r;
        })(),
        (async () => {
          console.log("[overview] Q: roster start");
          const r = await db.select().from(agents).orderBy(asc(agents.sortOrder));
          console.log("[overview] Q: roster done");
          return r;
        })(),
        (async () => {
          console.log("[overview] Q: runs start");
          const r = await db.select().from(agentRuns).where(and(eq(agentRuns.workspaceId, workspaceId), ne(agentRuns.trigger, "sample"))).orderBy(desc(agentRuns.startedAt)).limit(20);
          console.log("[overview] Q: runs done");
          return r;
        })(),
        (async () => {
          console.log("[overview] Q: tasks start");
          const r = await db.select().from(agentTasks).where(and(eq(agentTasks.workspaceId, workspaceId), eq(agentTasks.status, "open"))).orderBy(asc(agentTasks.dueAt)).limit(20);
          console.log("[overview] Q: tasks done");
          return r;
        })(),
        (async () => {
          console.log("[overview] Q: connections start");
          const r = await liveConnections(account.id, workspaceId);
          console.log("[overview] Q: connections done");
          return r;
        })(),
        (async () => {
          console.log("[overview] Q: obs start");
          const r = await db.select().from(obligations).where(eq(obligations.workspaceId, workspaceId)).orderBy(asc(obligations.dueDate));
          console.log("[overview] Q: obs done");
          return r;
        })(),
        (async () => {
          console.log("[overview] Q: events start");
          const r = await db.select().from(activityEvents).where(eq(activityEvents.workspaceId, workspaceId)).orderBy(desc(activityEvents.createdAt)).limit(12);
          console.log("[overview] Q: events done");
          return r;
        })(),
      ]);
    console.log("[overview] Step 4: Promise.all done");

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

    console.log("[overview] Step 5: rosterFor start");
    const agentsResult = await rosterFor(workspaceId, roster, Object.keys(RUNNABLE_AGENTS));
    console.log("[overview] Step 5: rosterFor done");

    // Agent-written notes are English; Greek pages get cached translations.
    const locale = localeOf(req.headers);
    const tr = await cachedTranslations(
      [...tasks.flatMap((x) => [x.title, x.detail]), ...runs.map((x) => x.summary), ...events.flatMap((x) => [x.object, x.detail])],
      locale,
    ).catch(() => new Map<string, string>());
    const tx = (v: string | null) => (v ? tr.get(v) ?? v : v);
    const tasksOut = locale === "el" ? tasks.map((x) => ({ ...x, title: tx(x.title) ?? x.title, detail: tx(x.detail) })) : tasks;
    const runsOut = locale === "el" ? runs.map((x) => ({ ...x, summary: tx(x.summary) ?? x.summary })) : runs;
    const eventsOut = locale === "el" ? events.map((x) => ({ ...x, object: tx(x.object) ?? x.object, detail: tx(x.detail) })) : events;

    return NextResponse.json({
      workspace,
      metrics,
      sites: [...siteNames].sort((a, b) => a.localeCompare(b)),
      agents: agentsResult,
      runs: runsOut,
      tasks: tasksOut,
      connections,
      obligations: obs,
      events: eventsOut,
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
