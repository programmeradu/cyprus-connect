/**
 * The workspace supplier list. One home for every supplier: CBAM contacts,
 * suppliers added from bank payments, and ones typed in by hand.
 *
 * GET              suppliers with 12-month bank spend, CBAM status, checks,
 *                  untracked bank payees and suggested next steps
 * PUT              add or update one supplier
 * POST             { action: "link_registry" | "unlink_registry" | "check_wikirate", name, ... }
 *                  re-reads the source on the server; nothing is trusted from the browser
 * DELETE ?name=    remove a supplier (CBAM import lines are not touched)
 *
 * Nothing here sends email. CBAM requests are drafted by Border and wait for
 * a person to approve the exact text.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  activityEvents,
  agentTasks,
  bankTransactions,
  cbamDeclarations,
  cbamImportLines,
  cbamSupplierRequests,
  cbamSuppliers,
} from "@/db/schema";
import { resolveConsoleSession } from "@/lib/console-session";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";
import { lookupRegistry } from "@/lib/integrations/registry.server";
import { findWikiRateCompany } from "@/lib/integrations/wikirate.server";
import { screenCompany } from "@/lib/integrations/sanctions.server";
import { suppliersNeedingData } from "@/lib/agents/cbam-supplier-request";
import type { CbamDraft } from "@/lib/agents/cbam-calc";
import { payeeKey, payeeMatches, suggestNextSteps, totalsByPayee, type Payment, type SupplierView } from "@/lib/suppliers";

export const dynamic = "force-dynamic";
const log = logger("api.console.suppliers");

async function session() {
  return resolveConsoleSession(await headers());
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const s = await session();
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const ws = s.session.workspace.id;
  try {
    const since = new Date();
    since.setUTCFullYear(since.getUTCFullYear() - 1);

    const [rows, debits, cbamNames, [decl], sent, open] = await Promise.all([
      db.select().from(cbamSuppliers).where(eq(cbamSuppliers.workspaceId, ws)).orderBy(asc(cbamSuppliers.supplierName)),
      db
        .select({ description: bankTransactions.description, amount: bankTransactions.amount, bookedOn: bankTransactions.bookedOn })
        .from(bankTransactions)
        .where(and(eq(bankTransactions.workspaceId, ws), eq(bankTransactions.direction, "debit"), gte(bankTransactions.bookedOn, isoDay(since))))
        .limit(20_000),
      db
        .select({ name: cbamImportLines.supplierName, lines: sql<number>`count(*)::int` })
        .from(cbamImportLines)
        .where(eq(cbamImportLines.workspaceId, ws))
        .groupBy(cbamImportLines.supplierName),
      db
        .select({ draft: cbamDeclarations.draft, year: cbamDeclarations.year })
        .from(cbamDeclarations)
        .where(eq(cbamDeclarations.workspaceId, ws))
        .orderBy(desc(cbamDeclarations.year))
        .limit(1),
      db
        .select({ supplierName: cbamSupplierRequests.supplierName, sentAt: cbamSupplierRequests.sentAt, approvedBy: cbamSupplierRequests.approvedBy })
        .from(cbamSupplierRequests)
        .where(eq(cbamSupplierRequests.workspaceId, ws))
        .orderBy(desc(cbamSupplierRequests.sentAt))
        .limit(500),
      db
        .select({ id: agentTasks.id, pendingInput: agentTasks.pendingInput })
        .from(agentTasks)
        .where(and(eq(agentTasks.workspaceId, ws), eq(agentTasks.status, "open"), eq(agentTasks.pendingTool, "send_supplier_request"))),
    ]);

    let needing = new Set<string>();
    if (decl) {
      try {
        needing = new Set(suppliersNeedingData(JSON.parse(decl.draft) as CbamDraft));
      } catch {
        /* an unreadable draft only hides the CBAM status */
      }
    }
    const pending = new Map<string, number>();
    for (const t of open) {
      try {
        const p = JSON.parse(t.pendingInput ?? "{}") as { supplierName?: string };
        if (p.supplierName && !pending.has(p.supplierName)) pending.set(p.supplierName, t.id);
      } catch {
        /* skip unreadable task */
      }
    }
    const lastSent = new Map<string, { sentAt: string; approvedBy: string }>();
    for (const r of sent) if (!lastSent.has(r.supplierName)) lastSent.set(r.supplierName, { sentAt: r.sentAt.toISOString(), approvedBy: r.approvedBy });
    const cbamLines = new Map(cbamNames.map((c) => [c.name, Number(c.lines)]));

    const payments: Payment[] = debits.flatMap((d) => {
      const key = payeeKey(d.description);
      return key ? [{ key, amount: d.amount, bookedOn: d.bookedOn }] : [];
    });
    const payees = totalsByPayee(payments);

    // Every name the list must show: saved rows plus CBAM suppliers not yet saved.
    const saved = new Map(rows.map((r) => [r.supplierName, r]));
    const names = [...new Set([...saved.keys(), ...cbamLines.keys()])].sort((a, b) => a.localeCompare(b));
    const claimed = new Set<string>();

    const suppliers = names.map((name) => {
      const r = saved.get(name);
      const mine = payees.filter((p) => payeeMatches(p.key, { supplierName: name, bankPayee: r?.bankPayee ?? null }));
      mine.forEach((p) => claimed.add(p.key));
      const spend12m = Math.round(mine.reduce((a, p) => a + p.total, 0) * 100) / 100;
      const lastPaid = mine.reduce<string | null>((a, p) => (a && a > p.lastPaid ? a : p.lastPaid), null);
      return {
        name,
        saved: Boolean(r),
        email: r?.email ?? null,
        contactName: r?.contactName ?? null,
        notes: r?.notes ?? null,
        source: r?.source ?? "cbam",
        bankPayee: r?.bankPayee ?? null,
        registrationNo: r?.registrationNo ?? null,
        registryName: r?.registryName ?? null,
        registryStatus: r?.registryStatus ?? null,
        registryCheckedAt: r?.registryCheckedAt?.toISOString() ?? null,
        wikirateUrl: r?.wikirateUrl ?? null,
        wikirateCheckedAt: r?.wikirateCheckedAt?.toISOString() ?? null,
        sanctionsCheckedAt: r?.sanctionsCheckedAt?.toISOString() ?? null,
        sanctionsStatus: r?.sanctionsStatus ?? null,
        sanctionsHits: r?.sanctionsHits ?? [],
        spend12m,
        payments12m: mine.reduce((a, p) => a + p.count, 0),
        lastPaid,
        cbamLines: cbamLines.get(name) ?? 0,
        cbamNeedsData: needing.has(name),
        lastRequest: lastSent.get(name) ?? null,
        pendingTaskId: pending.get(name) ?? null,
      };
    });

    const untracked = payees.filter((p) => !claimed.has(p.key));
    const views: SupplierView[] = suppliers.map((x) => ({
      name: x.name,
      email: x.email,
      registrationNo: x.registrationNo,
      registryCheckedAt: x.registryCheckedAt,
      wikirateCheckedAt: x.wikirateCheckedAt,
      spend12m: x.spend12m,
      cbamNeedsData: x.cbamNeedsData,
      pendingTaskId: x.pendingTaskId,
    }));

    return NextResponse.json({
      suppliers,
      untracked: untracked.slice(0, 25),
      untrackedCount: untracked.length,
      suggestions: suggestNextSteps(views, untracked),
      bankPayments12m: payments.length,
      cbamYear: decl?.year ?? null,
    });
  } catch (error) {
    const ref = log.error("GET failed", error);
    return NextResponse.json({ message: "The supplier list could not be read.", ref }, { status: 500 });
  }
}

const opt = (max: number) =>
  z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));

const Upsert = z
  .object({
    name: z.string().trim().min(1).max(200),
    email: z
      .string().trim().toLowerCase().max(254).nullable().optional()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || z.string().email().safeParse(v).success, "Enter a valid email, or leave it empty."),
    contactName: opt(120),
    notes: opt(1000),
    bankPayee: opt(48),
    source: z.enum(["manual", "bank", "cbam"]).optional(),
  })
  .strict();

async function logEvent(ws: string, who: string, verb: string, object: string, detail?: string) {
  await db.insert(activityEvents).values({ workspaceId: ws, actorType: "human", actorName: who, verb, object, detail: detail ?? null });
}

export async function PUT(req: Request) {
  const s = await session();
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const parsed = await readJson(req, Upsert);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  const ws = s.session.workspace.id;
  const who = s.session.account.name || s.session.account.email || s.session.account.id;
  try {
    const [existing] = await db
      .select({ id: cbamSuppliers.id })
      .from(cbamSuppliers)
      .where(and(eq(cbamSuppliers.workspaceId, ws), eq(cbamSuppliers.supplierName, b.name)))
      .limit(1);
    const values = { email: b.email, contactName: b.contactName, notes: b.notes, updatedBy: who, updatedAt: new Date() };
    if (existing) {
      await db.update(cbamSuppliers).set(b.bankPayee ? { ...values, bankPayee: b.bankPayee } : values).where(eq(cbamSuppliers.id, existing.id));
    } else {
      await db.insert(cbamSuppliers).values({ workspaceId: ws, supplierName: b.name, source: b.source ?? "manual", bankPayee: b.bankPayee, ...values });
      await logEvent(ws, who, "added supplier", b.name, b.source === "bank" ? "From bank payments." : undefined);
    }
    return NextResponse.json({ saved: true });
  } catch (error) {
    const ref = log.error("PUT failed", error);
    return NextResponse.json({ message: "The supplier could not be saved.", ref }, { status: 500 });
  }
}

const Act = z.discriminatedUnion("action", [
  z.object({ action: z.literal("link_registry"), name: z.string().trim().min(1).max(200), registrationNo: z.string().trim().min(1).max(20) }).strict(),
  z.object({ action: z.literal("unlink_registry"), name: z.string().trim().min(1).max(200) }).strict(),
  z.object({ action: z.literal("check_wikirate"), name: z.string().trim().min(1).max(200) }).strict(),
  z.object({ action: z.literal("check_sanctions"), name: z.string().trim().min(1).max(200) }).strict(),
]);

const REG_FAIL: Record<string, { status: number; message: string }> = {
  bad_number: { status: 400, message: "That is not a registration number. Use the form HE 12345." },
  not_found: { status: 404, message: "The register has no entry with that number." },
  unavailable: { status: 503, message: "The government open-data portal did not answer. Try again in a minute." },
};

export async function POST(req: Request) {
  const s = await session();
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const parsed = await readJson(req, Act);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  const ws = s.session.workspace.id;
  const who = s.session.account.name || s.session.account.email || s.session.account.id;
  const where = and(eq(cbamSuppliers.workspaceId, ws), eq(cbamSuppliers.supplierName, b.name));
  try {
    // A CBAM supplier that was never saved gets its row on first action.
    await db
      .insert(cbamSuppliers)
      .values({ workspaceId: ws, supplierName: b.name, source: "cbam", updatedBy: who })
      .onConflictDoNothing({ target: [cbamSuppliers.workspaceId, cbamSuppliers.supplierName] });

    if (b.action === "unlink_registry") {
      await db.update(cbamSuppliers).set({ registrationNo: null, registryName: null, registryStatus: null, registryCheckedAt: null }).where(where);
      return NextResponse.json({ saved: true });
    }
    if (b.action === "link_registry") {
      const r = await lookupRegistry(b.registrationNo);
      if (!r.ok) return NextResponse.json({ error: r.reason, message: REG_FAIL[r.reason].message }, { status: REG_FAIL[r.reason].status });
      await db
        .update(cbamSuppliers)
        .set({ registrationNo: r.company.displayNo, registryName: r.company.name, registryStatus: r.company.status, registryCheckedAt: new Date() })
        .where(where);
      await logEvent(ws, who, "linked company register entry", b.name, `${r.company.name} (${r.company.displayNo}), ${r.company.status}.`);
      return NextResponse.json({ saved: true, company: { name: r.company.name, displayNo: r.company.displayNo, status: r.company.status } });
    }
    if (b.action === "check_sanctions") {
      const [row] = await db.select({ regNo: cbamSuppliers.registrationNo, regName: cbamSuppliers.registryName }).from(cbamSuppliers).where(where).limit(1);
      // A linked Cyprus register entry gives the legal name, number and country.
      const r = await screenCompany({ name: row?.regName || b.name, country: row?.regNo ? "cy" : null, registrationNo: row?.regNo ?? null });
      if (!r.ok) {
        const message = r.reason === "not_loaded" ? "The EU sanctions list could not be downloaded yet. Try again in a few minutes." : "The sanctions check did not finish. Try again in a minute.";
        return NextResponse.json({ error: r.reason, message }, { status: 503 });
      }
      await db.update(cbamSuppliers).set({ sanctionsCheckedAt: new Date(r.checkedAt), sanctionsStatus: r.status, sanctionsHits: r.hits }).where(where);
      await logEvent(ws, who, "screened supplier against sanctions lists", b.name, r.status === "clear" ? `No match on the EU consolidated sanctions list (list of ${r.listDate || "today"}).` : `${r.hits.length} possible match(es) to review.`);
      return NextResponse.json({ saved: true, status: r.status, hits: r.hits });
    }
    const w = await findWikiRateCompany(b.name);
    if (!w.ok && w.reason !== "not_found") {
      const message = w.reason === "not_configured" ? "WikiRate is not connected yet." : "WikiRate did not answer. Try again in a minute.";
      return NextResponse.json({ error: w.reason, message }, { status: 503 });
    }
    const url = w.ok && w.exact ? w.exact.url : null;
    await db.update(cbamSuppliers).set({ wikirateUrl: url, wikirateCheckedAt: new Date() }).where(where);
    return NextResponse.json({ saved: true, found: Boolean(url), url });
  } catch (error) {
    const ref = log.error("POST failed", error);
    return NextResponse.json({ message: "That check could not be completed.", ref }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const s = await session();
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const name = new URL(req.url).searchParams.get("name")?.trim().slice(0, 200);
  if (!name) return NextResponse.json({ message: "Name the supplier." }, { status: 400 });
  try {
    await db.delete(cbamSuppliers).where(and(eq(cbamSuppliers.workspaceId, s.session.workspace.id), eq(cbamSuppliers.supplierName, name)));
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const ref = log.error("DELETE failed", error);
    return NextResponse.json({ message: "The supplier could not be removed.", ref }, { status: 500 });
  }
}
