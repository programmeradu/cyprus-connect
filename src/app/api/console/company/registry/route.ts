/**
 * Company lookup in the Cyprus Registrar of Companies (open data on data.gov.cy).
 *
 * GET ?q=      search by name or number (HE 12345); up to 10 entries
 * GET ?no=     full entry: legal name, status, registered office, officials
 * POST         link one entry to this workspace; re-read from the register,
 *              never trusted from the browser. Optionally copies the legal
 *              name into the shared company name.
 * DELETE       remove the link
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activityEvents, user, workspaces } from "@/db/schema";
import { resolveConsoleSession } from "@/lib/console-session";
import { lookupRegistry, searchRegistry } from "@/lib/integrations/registry.server";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";
const log = logger("api.console.company.registry");

const FAIL: Record<string, { status: number; message: string }> = {
  too_short: { status: 400, message: "Type at least three letters of the name, or the registration number." },
  bad_number: { status: 400, message: "That is not a registration number. Use the form HE 12345." },
  not_found: { status: 404, message: "The register has no entry with that number." },
  unavailable: { status: 503, message: "The government open-data portal did not answer. Try again in a minute." },
};

export async function GET(req: Request) {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const url = new URL(req.url);
  const no = url.searchParams.get("no")?.slice(0, 20);
  const q = url.searchParams.get("q")?.slice(0, 120) ?? "";
  try {
    if (no) {
      const r = await lookupRegistry(no);
      if (!r.ok) return NextResponse.json({ error: r.reason, message: FAIL[r.reason].message }, { status: FAIL[r.reason].status });
      return NextResponse.json({ company: r.company });
    }
    const r = await searchRegistry(q);
    if (!r.ok) return NextResponse.json({ error: r.reason, message: FAIL[r.reason].message }, { status: FAIL[r.reason].status });
    return NextResponse.json({ results: r.results });
  } catch (error) {
    const ref = log.error("GET failed", error);
    return NextResponse.json({ message: "The register could not be searched.", ref }, { status: 500 });
  }
}

const Link = z
  .object({
    registrationNo: z.string().trim().min(1).max(20),
    useLegalName: z.boolean().optional(),
  })
  .strict();

export async function POST(req: Request) {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const parsed = await readJson(req, Link);
  if (!parsed.ok) return parsed.response;
  const { account, workspace } = s.session;
  try {
    const r = await lookupRegistry(parsed.data.registrationNo);
    if (!r.ok) return NextResponse.json({ error: r.reason, message: FAIL[r.reason].message }, { status: FAIL[r.reason].status });
    const c = r.company;
    await db.transaction(async (tx) => {
      await tx
        .update(workspaces)
        .set({
          registrationNo: c.displayNo,
          registryType: c.type,
          registryName: c.name,
          registryStatus: c.status,
          registryRegisteredOn: c.registeredOn,
          registryAddress: c.address,
          registryCheckedAt: new Date(),
          legalName: c.name,
        })
        .where(eq(workspaces.id, workspace.id));
      if (parsed.data.useLegalName) {
        await tx.update(user).set({ companyName: c.name, updatedAt: new Date() }).where(eq(user.id, account.id));
      }
      await tx.insert(activityEvents).values({
        workspaceId: workspace.id,
        actorType: "human",
        actorName: account.name || account.email || "Workspace member",
        verb: "linked",
        object: "Registrar of Companies entry",
        detail: `${c.name} (${c.displayNo}), ${c.status}.${parsed.data.useLegalName ? " Company name set to the registered name." : ""}`,
      });
    });
    return NextResponse.json({ company: c });
  } catch (error) {
    const ref = log.error("POST failed", error);
    return NextResponse.json({ message: "The register entry could not be linked.", ref }, { status: 500 });
  }
}

export async function DELETE() {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const { account, workspace } = s.session;
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(workspaces)
        .set({
          registrationNo: null,
          registryType: null,
          registryName: null,
          registryStatus: null,
          registryRegisteredOn: null,
          registryAddress: null,
          registryCheckedAt: null,
        })
        .where(eq(workspaces.id, workspace.id));
      await tx.insert(activityEvents).values({
        workspaceId: workspace.id,
        actorType: "human",
        actorName: account.name || account.email || "Workspace member",
        verb: "removed",
        object: "Registrar of Companies link",
        detail: null,
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const ref = log.error("DELETE failed", error);
    return NextResponse.json({ message: "The link could not be removed.", ref }, { status: 500 });
  }
}
