/**
 * Action plan projects for the signed-in workspace.
 *
 * GET   the plan: suggested ideas, started projects, live checks, totals
 * POST  { op: "start" | "update" | "installed" | "confirm_payment" | "drop", ... }
 *
 * No op marks a project done. "confirmed" is set only by the checks in
 * src/lib/actions/verify.ts when every required one passes.
 */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { actionEvidence, actionProjects, bankTransactions } from "@/db/schema";
import { resolveConsoleSession } from "@/lib/console-session";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";
import { recordActivity } from "@/lib/activity.server";
import { PROJECT_TYPES } from "@/lib/actions/catalog";
import { buildActionPlan } from "@/lib/actions/projects.server";

export const dynamic = "force-dynamic";
const log = logger("api.console.actions");

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((d) => !Number.isNaN(Date.parse(d)) && d <= new Date(Date.now() + 86_400_000).toISOString().slice(0, 10), "Date cannot be in the future");
const money = z.number().finite().min(0).max(100_000_000).nullable().optional();
const qty = z.number().finite().min(0).max(1_000_000_000).nullable().optional();
const Inputs = z
  .object({
    supplierName: z.string().trim().max(120).nullable().optional(),
    quoteEur: money,
    grantEur: money,
    kwp: z.number().finite().min(0).max(10_000).nullable().optional(),
    kwhPerKwp: z.number().finite().min(500).max(2500).nullable().optional(),
    savedKwhYr: qty,
    savedM3Yr: qty,
    savedLitresYr: qty,
    savedEurYr: money,
  })
  .strict();

const Body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("start"), type: z.enum(PROJECT_TYPES), startedOn: isoDay.optional() }),
  z.object({ op: z.literal("update"), id: z.number().int().positive(), inputs: Inputs }),
  z.object({ op: z.literal("installed"), id: z.number().int().positive(), installedOn: isoDay }),
  z.object({ op: z.literal("confirm_payment"), id: z.number().int().positive(), transactionId: z.number().int().positive() }),
  z.object({ op: z.literal("drop"), id: z.number().int().positive() }),
]);

async function session() {
  return resolveConsoleSession(await headers());
}

export async function GET() {
  const s = await session();
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  try {
    return NextResponse.json(await buildActionPlan(s.session));
  } catch (e) {
    const ref = log.error("plan read failed", e);
    return NextResponse.json({ error: "The action plan could not be loaded.", ref }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const s = await session();
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const parsed = await readJson(request, Body);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const ws = s.session.workspace.id;
  const who = s.session.account.id;

  try {
    if (body.op === "start") {
      const [row] = await db
        .insert(actionProjects)
        .values({ workspaceId: ws, type: body.type, stage: "under_way", startedOn: body.startedOn ?? new Date().toISOString().slice(0, 10), createdBy: who })
        .onConflictDoNothing()
        .returning({ id: actionProjects.id });
      if (!row) return NextResponse.json({ error: "This project is already in your plan." }, { status: 409 });
      await recordActivity(s.session, "started", `Action plan: ${body.type} project`);
      return NextResponse.json({ ok: true, id: row.id });
    }

    const [project] = await db.select().from(actionProjects).where(and(eq(actionProjects.id, body.id), eq(actionProjects.workspaceId, ws))).limit(1);
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    if (project.stage === "confirmed" && body.op !== "update") {
      return NextResponse.json({ error: "This project is confirmed and can no longer change." }, { status: 409 });
    }

    if (body.op === "update") {
      if (project.stage === "confirmed") return NextResponse.json({ error: "Confirmed figures are locked." }, { status: 409 });
      const inputs = { ...(project.inputs ?? {}), ...body.inputs };
      await db.update(actionProjects).set({ inputs, updatedAt: new Date() }).where(eq(actionProjects.id, project.id));
      return NextResponse.json({ ok: true });
    }

    if (body.op === "installed") {
      if (body.installedOn < project.startedOn) return NextResponse.json({ error: "The install date is before the project started." }, { status: 400 });
      await db.update(actionProjects).set({ stage: "being_checked", installedOn: body.installedOn, updatedAt: new Date() }).where(eq(actionProjects.id, project.id));
      await recordActivity(s.session, "reported installed", `Action plan: ${project.type} project`, `In place since ${body.installedOn}. Vuneli is now checking bills and proof.`);
      return NextResponse.json({ ok: true });
    }

    if (body.op === "confirm_payment") {
      const [tx] = await db.select().from(bankTransactions).where(and(eq(bankTransactions.id, body.transactionId), eq(bankTransactions.workspaceId, ws))).limit(1);
      if (!tx) return NextResponse.json({ error: "Payment not found in your bank records." }, { status: 404 });
      await db.insert(actionEvidence).values({
        projectId: project.id,
        workspaceId: ws,
        kind: "payment",
        bankTransactionId: tx.id,
        quotes: { supplier: tx.description ?? "", date: tx.bookedOn, amount: `€${Math.abs(tx.amount).toFixed(2)}` },
        createdBy: who,
      });
      await recordActivity(s.session, "linked payment", `Action plan: ${project.type} project`, `${tx.bookedOn} · €${Math.abs(tx.amount).toFixed(2)} · ${tx.description ?? ""}`);
      return NextResponse.json({ ok: true });
    }

    // drop
    await db.delete(actionProjects).where(eq(actionProjects.id, project.id));
    await recordActivity(s.session, "removed", `Action plan: ${project.type} project`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const ref = log.error("plan write failed", e);
    return NextResponse.json({ error: "That change could not be saved.", ref }, { status: 500 });
  }
}
