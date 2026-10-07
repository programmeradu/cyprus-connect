/**
 * Decision on a pending "Add data" document: POST { decision: "accept" | "discard" }.
 *
 * accept keeps the file as evidence. EAC and water bills become the same rows
 * the Integrations page shows, so a bill is never counted twice. The figures
 * themselves are saved by the page through /api/console/emissions, after the
 * person has checked them, before this call.
 * discard deletes the pending file.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { resolveConsoleSession } from "@/lib/console-session";
import { recordActivity } from "@/lib/activity.server";
import { readJson } from "@/lib/validate";
import { EAC_SOURCE, eacBills, type EacBill } from "@/lib/integrations/eac.server";
import { WATER_SOURCE, waterBills, type WaterBill } from "@/lib/integrations/water.server";
import { recheckActionPlan } from "@/lib/actions/projects.server";
import type { IntakeProposal } from "@/lib/documents/intake";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";
const log = logger("api.console.documents.intake.decide");

const PENDING_SOURCE = "intake_pending";
const Body = z.object({ decision: z.enum(["accept", "discard"]) });

const LABEL: Record<IntakeProposal["kind"], string> = {
  eac_bill: "electricity bill",
  water_bill: "water bill",
  bank_statement: "bank statement",
  utility_invoice: "utility invoice",
  fuel_receipt: "fuel receipt",
  waste_invoice: "waste invoice",
  consumption_sheet: "usage spreadsheet",
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await resolveConsoleSession(await headers());
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, message: resolved.message }, { status: resolved.status });
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ message: "Unknown document." }, { status: 400 });
  const parsed = await readJson(request, Body);
  if (!parsed.ok) return parsed.response;
  const userId = resolved.session.account.id;
  const mine = and(eq(documents.id, id), eq(documents.userId, userId), eq(documents.uploadSource, PENDING_SOURCE));

  try {
    const [row] = await db.select().from(documents).where(mine).limit(1);
    if (!row) return NextResponse.json({ message: "That document was already handled or is not yours." }, { status: 404 });

    if (parsed.data.decision === "discard") {
      await db.delete(documents).where(mine);
      return NextResponse.json({ ok: true });
    }

    const stored = JSON.parse(row.parsedData ?? "{}") as { proposal?: IntakeProposal; bill?: unknown };
    const kind = stored.proposal?.kind;
    if (!kind) return NextResponse.json({ message: "That document has no reading to keep." }, { status: 409 });
    const now = new Date().toISOString();

    if (kind === "eac_bill" || kind === "water_bill") {
      const bill = stored.bill as (EacBill & Partial<WaterBill>) | null;
      if (!bill) return NextResponse.json({ message: "That bill has no reading to keep." }, { status: 409 });
      const list = kind === "eac_bill" ? await eacBills(userId) : await waterBills(userId);
      const dup = list.some(
        (b) =>
          b.periodStart === bill.periodStart &&
          b.periodEnd === bill.periodEnd &&
          (b.accountNumber ?? "") === (bill.accountNumber ?? "") &&
          (kind === "eac_bill" || (b as WaterBill).board === bill.board),
      );
      if (dup) {
        // The same bill is already on file; keep that one.
        await db.delete(documents).where(mine);
        return NextResponse.json({ ok: true, duplicate: true });
      }
      await db
        .update(documents)
        .set({ uploadSource: kind === "eac_bill" ? EAC_SOURCE : WATER_SOURCE, processingStatus: "completed", parsedData: JSON.stringify(bill), updatedAt: now })
        .where(mine);
    } else {
      await db
        .update(documents)
        .set({ uploadSource: `intake_${kind}`, processingStatus: "completed", updatedAt: now })
        .where(mine);
    }
    await recordActivity(resolved.session, `added ${LABEL[kind]}`, row.fileName, stored.proposal?.description ?? null);
    try {
      await recheckActionPlan(resolved.session);
    } catch (e) {
      log.warn("action plan recheck deferred", { error: String(e) });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const ref = log.error("intake decision failed", error);
    return NextResponse.json({ message: "The document could not be saved. Try again.", ref }, { status: 500 });
  }
}
