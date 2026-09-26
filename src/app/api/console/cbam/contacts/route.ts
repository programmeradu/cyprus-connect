/**
 * CBAM contacts: supplier emails (PUT kind=supplier) and the declarant profile
 * used on the Registry file (PUT kind=declarant). DELETE ?supplier=Name removes
 * a supplier contact. Nothing here sends email; Border drafts, a person approves.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cbamDeclarants, cbamSuppliers } from "@/db/schema";
import { resolveConsoleSession } from "@/lib/console-session";

export const dynamic = "force-dynamic";

const opt = (max: number) =>
  z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));

const Body = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("supplier"),
    supplierName: z.string().trim().min(1).max(200),
    email: z.string().trim().toLowerCase().email().max(254),
    contactName: opt(120),
  }),
  z.object({
    kind: z.literal("declarant"),
    legalName: opt(200),
    eori: z
      .string().trim().toUpperCase().max(17).nullable().optional()
      .transform((v) => (v ? v.replace(/\s/g, "") : null))
      .refine((v) => v === null || /^[A-Z]{2}[A-Z0-9]{1,15}$/.test(v), "An EORI starts with two letters, then up to 15 letters or digits."),
    accountNumber: opt(40),
    replyToEmail: z
      .string().trim().toLowerCase().max(254).nullable().optional()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || z.string().email().safeParse(v).success, "Enter a valid reply-to email."),
  }),
]);

export async function PUT(req: Request) {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const ws = s.session.workspace.id;
  const who = s.session.account.name || s.session.account.email || s.session.account.id;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check the fields." }, { status: 400 });
  }
  const b = parsed.data;
  const now = new Date();
  if (b.kind === "supplier") {
    await db
      .insert(cbamSuppliers)
      .values({ workspaceId: ws, supplierName: b.supplierName, email: b.email, contactName: b.contactName, updatedBy: who })
      .onConflictDoUpdate({
        target: [cbamSuppliers.workspaceId, cbamSuppliers.supplierName],
        set: { email: b.email, contactName: b.contactName, updatedBy: who, updatedAt: now },
      });
    return NextResponse.json({ saved: true });
  }
  const values = { legalName: b.legalName, eori: b.eori, accountNumber: b.accountNumber, replyToEmail: b.replyToEmail, updatedBy: who, updatedAt: now };
  await db
    .insert(cbamDeclarants)
    .values({ workspaceId: ws, ...values })
    .onConflictDoUpdate({ target: cbamDeclarants.workspaceId, set: values });
  return NextResponse.json({ saved: true });
}

export async function DELETE(req: Request) {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const name = new URL(req.url).searchParams.get("supplier")?.trim();
  if (!name) return NextResponse.json({ message: "Name the supplier." }, { status: 400 });
  await db
    .delete(cbamSuppliers)
    .where(and(eq(cbamSuppliers.workspaceId, s.session.workspace.id), eq(cbamSuppliers.supplierName, name)));
  return NextResponse.json({ deleted: true });
}
