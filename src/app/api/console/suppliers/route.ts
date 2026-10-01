/**
 * The workspace supplier list. One home for every supplier: CBAM contacts,
 * suppliers added from bank payments, and ones typed in by hand.
 *
 * GET              suppliers with 12-month bank spend, CBAM status, checks,
 *                  untracked bank payees and suggested next steps
 * PUT              add or update one supplier
 * POST             { action: "link_registry" | "unlink_registry" | "check_wikirate", name, ... }
 *                  re-reads the source on the server; nothing is trusted from the browser
 * PATCH            { action: "add_payees", payees } adds bank payees, linking any that
 *                  already belong to a supplier instead of making a second row;
 *                  { action: "skip_payees" | "unskip_payees", ... } remembers "not a supplier"
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
  documents,
  supplierPayeeSkips,
} from "@/db/schema";
import { resolveConsoleSession } from "@/lib/console-session";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";
import { lookupRegistry } from "@/lib/integrations/registry.server";
import { findWikiRateCompany } from "@/lib/integrations/wikirate.server";
import { screenCompany } from "@/lib/integrations/sanctions.server";
import { suppliersNeedingData } from "@/lib/agents/cbam-supplier-request";
import type { CbamDraft } from "@/lib/agents/cbam-calc";
import {
  existingSupplierFor,
  notSupplierReason,
  payeeKey,
  payeeMatches,
  paymentFingerprint,
  suggestNextSteps,
  totalsByPayee,
  type NotSupplier,
  type Payment,
  type SupplierView,
} from "@/lib/suppliers";
import type { IntakeProposal } from "@/lib/documents/intake";

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

    const [rows, debits, cbamNames, [decl], sent, open, statements, skips] = await Promise.all([
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
      // Statements kept through Add data. Documents belong to the workspace owner.
      s.session.workspace.ownerUserId
        ? db
            .select({ parsedData: documents.parsedData })
            .from(documents)
            .where(and(eq(documents.userId, s.session.workspace.ownerUserId), eq(documents.uploadSource, "intake_bank_statement")))
            .limit(200)
        : Promise.resolve([] as { parsedData: string | null }[]),
      db.select().from(supplierPayeeSkips).where(eq(supplierPayeeSkips.workspaceId, ws)),
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

    // Linked-bank payments first, then statement lines not already counted:
    // the same day, amount and payee is one payment whichever way it arrived.
    const seen = new Set<string>();
    const reasons = new Map<string, NotSupplier>();
    const payments: Payment[] = [];
    const take = (description: string | null, amount: number, bookedOn: string) => {
      const key = payeeKey(description);
      if (!key) return;
      const fp = paymentFingerprint(bookedOn, amount, key);
      if (seen.has(fp)) return;
      seen.add(fp);
      const r = notSupplierReason(description);
      if (r && !reasons.has(key)) reasons.set(key, r);
      payments.push({ key, amount, bookedOn });
    };
    for (const d of debits) take(d.description, d.amount, d.bookedOn);
    const sinceDay = isoDay(since);
    for (const doc of statements) {
      let lines: { date: string; description: string; amount: number }[] = [];
      try {
        lines = (JSON.parse(doc.parsedData ?? "{}") as { proposal?: IntakeProposal }).proposal?.bank?.debits ?? [];
      } catch {
        /* an unreadable reading only leaves that statement out */
      }
      for (const l of lines) if (l.date >= sinceDay) take(l.description, l.amount, l.date);
    }
    const payees = totalsByPayee(payments);
    const skipped = new Set(skips.map((k) => k.payeeKey));

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

    // Wages, tax, fees and payees a person skipped are not suggested.
    const untracked = payees.filter((p) => !claimed.has(p.key) && !skipped.has(p.key) && !reasons.has(p.key));
    const skippedList = payees.filter((p) => !claimed.has(p.key) && skipped.has(p.key));
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
      skipped: skippedList.slice(0, 25),
      skippedKeys: [...skipped],
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

const PayeeIn = z.object({ key: z.string().trim().min(3).max(48), label: z.string().trim().min(1).max(200) }).strict();
const Bulk = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add_payees"), payees: z.array(PayeeIn).min(1).max(60) }).strict(),
  z.object({ action: z.literal("skip_payees"), payees: z.array(PayeeIn).min(1).max(60) }).strict(),
  z.object({ action: z.literal("unskip_payees"), keys: z.array(z.string().trim().min(3).max(48)).min(1).max(60) }).strict(),
]);

export async function PATCH(req: Request) {
  const s = await session();
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const parsed = await readJson(req, Bulk);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  const ws = s.session.workspace.id;
  const who = s.session.account.name || s.session.account.email || s.session.account.id;
  try {
    if (b.action === "unskip_payees") {
      for (const key of b.keys) {
        await db.delete(supplierPayeeSkips).where(and(eq(supplierPayeeSkips.workspaceId, ws), eq(supplierPayeeSkips.payeeKey, key)));
      }
      return NextResponse.json({ saved: true });
    }
    if (b.action === "skip_payees") {
      await db
        .insert(supplierPayeeSkips)
        .values(b.payees.map((p) => ({ workspaceId: ws, payeeKey: p.key, label: p.label, skippedBy: who })))
        .onConflictDoNothing();
      return NextResponse.json({ saved: true });
    }

    // add_payees: never a second row for a supplier that is already on the list.
    const [rows, cbamNames] = await Promise.all([
      db.select({ supplierName: cbamSuppliers.supplierName, bankPayee: cbamSuppliers.bankPayee }).from(cbamSuppliers).where(eq(cbamSuppliers.workspaceId, ws)),
      db.selectDistinct({ supplierName: cbamImportLines.supplierName }).from(cbamImportLines).where(eq(cbamImportLines.workspaceId, ws)),
    ]);
    const known = [...rows, ...cbamNames.filter((c) => !rows.some((r) => r.supplierName === c.supplierName)).map((c) => ({ supplierName: c.supplierName, bankPayee: null }))];
    const added: string[] = [];
    const already: { payee: string; supplier: string }[] = [];
    for (const p of b.payees) {
      const match = existingSupplierFor(p, known);
      if (match) {
        already.push({ payee: p.label, supplier: match });
        continue;
      }
      const name = p.label.slice(0, 200);
      const [row] = await db
        .insert(cbamSuppliers)
        .values({ workspaceId: ws, supplierName: name, source: "bank", bankPayee: p.key, updatedBy: who })
        .onConflictDoNothing({ target: [cbamSuppliers.workspaceId, cbamSuppliers.supplierName] })
        .returning({ id: cbamSuppliers.id });
      if (row) {
        added.push(name);
        known.push({ supplierName: name, bankPayee: p.key });
      } else {
        already.push({ payee: p.label, supplier: name });
      }
    }
    const keys = b.payees.map((p) => p.key);
    for (const key of keys) {
      await db.delete(supplierPayeeSkips).where(and(eq(supplierPayeeSkips.workspaceId, ws), eq(supplierPayeeSkips.payeeKey, key)));
    }
    if (added.length > 0) {
      await logEvent(ws, who, added.length === 1 ? "added supplier" : `added ${added.length} suppliers`, added.slice(0, 5).join(", "), "From bank payments.");
    }
    return NextResponse.json({ added, already });
  } catch (error) {
    const ref = log.error("PATCH failed", error);
    return NextResponse.json({ message: "The suppliers could not be saved.", ref }, { status: 500 });
  }
}
