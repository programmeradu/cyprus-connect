/**
 * The company record every page shares. GET reads it; PATCH changes any part
 * of it in one transaction and records one audit event naming what changed.
 * Name, industry, team size and country are stored on the account profile;
 * sites and revenue on the workspace (see src/lib/company.server.ts).
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activityEvents, user, workspaces } from "@/db/schema";
import { resolveConsoleSession } from "@/lib/console-session";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";

export const dynamic = "force-dynamic";
const log = logger("api.console.company");

export interface CompanyRecord {
  companyName: string | null;
  industry: string | null;
  teamSize: string | null;
  country: string;
  sites: number;
  revenueEur: number | null;
  baselineYear: number;
  framework: string;
}

const text = (max: number) =>
  z.string().trim().max(max).nullable().optional().transform((v) => (v === undefined ? undefined : v || null));

const Patch = z
  .object({
    companyName: text(200),
    industry: text(100),
    teamSize: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]).nullable().optional(),
    country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Use a two-letter country code.").optional(),
    sites: z.number().int().min(1, "A company has at least one site.").max(10_000).optional(),
    revenueEur: z.number().finite().min(0, "Revenue cannot be negative.").max(1e13).nullable().optional(),
  })
  .strict();

const LABELS: Record<string, string> = {
  companyName: "company name",
  industry: "industry",
  teamSize: "team size",
  country: "country",
  sites: "number of sites",
  revenueEur: "yearly revenue",
};

async function read(accountId: string, workspaceId: string): Promise<CompanyRecord> {
  const [[p], [w]] = await Promise.all([
    db
      .select({ companyName: user.companyName, industry: user.companyIndustry, teamSize: user.teamSize, country: user.countryCode })
      .from(user)
      .where(eq(user.id, accountId))
      .limit(1),
    db
      .select({ sites: workspaces.sites, revenueEur: workspaces.revenueEur, baselineYear: workspaces.baselineYear, framework: workspaces.framework, country: workspaces.country })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1),
  ]);
  return {
    companyName: p?.companyName ?? null,
    industry: p?.industry ?? null,
    teamSize: p?.teamSize ?? null,
    country: (p?.country || w?.country || "CY").toUpperCase(),
    sites: w?.sites ?? 1,
    revenueEur: w?.revenueEur ?? null,
    baselineYear: w?.baselineYear ?? new Date().getFullYear(),
    framework: w?.framework ?? "VSME",
  };
}

export async function GET() {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  try {
    return NextResponse.json(await read(s.session.account.id, s.session.workspace.id));
  } catch (error) {
    const ref = log.error("GET failed", error);
    return NextResponse.json({ message: "Your company details could not be read.", ref }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const parsed = await readJson(req, Patch);
  if (!parsed.ok) return parsed.response;
  const { account, workspace } = s.session;
  const body = parsed.data;

  try {
    const before = await read(account.id, workspace.id);
    const changed = (Object.keys(body) as (keyof typeof body)[]).filter(
      (k) => body[k] !== undefined && body[k] !== before[k as keyof CompanyRecord],
    );
    if (!changed.length) return NextResponse.json({ company: before, changed: [] });

    await db.transaction(async (tx) => {
      const profile: Partial<typeof user.$inferInsert> = {};
      if (body.companyName !== undefined) profile.companyName = body.companyName;
      if (body.industry !== undefined) profile.companyIndustry = body.industry;
      if (body.teamSize !== undefined) profile.teamSize = body.teamSize;
      if (body.country !== undefined) profile.countryCode = body.country;
      if (Object.keys(profile).length) {
        await tx.update(user).set({ ...profile, updatedAt: new Date() }).where(eq(user.id, account.id));
      }
      const ws: Partial<typeof workspaces.$inferInsert> = {};
      if (body.sites !== undefined) ws.sites = body.sites;
      if (body.revenueEur !== undefined) ws.revenueEur = body.revenueEur;
      if (Object.keys(ws).length) await tx.update(workspaces).set(ws).where(eq(workspaces.id, workspace.id));
      await tx.insert(activityEvents).values({
        workspaceId: workspace.id,
        actorType: "human",
        actorName: account.name || account.email || "Workspace member",
        verb: "updated",
        object: "Company details",
        detail: `Changed ${changed.map((k) => LABELS[k]).join(", ")}.`,
      });
    });

    return NextResponse.json({ company: await read(account.id, workspace.id), changed });
  } catch (error) {
    const ref = log.error("PATCH failed", error);
    return NextResponse.json({ message: "Your company details could not be saved.", ref }, { status: 500 });
  }
}
