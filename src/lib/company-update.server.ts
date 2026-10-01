/**
 * The one place company details are read and changed. The company API and the
 * copilot approval gate both call this, so a change made by a person in a form
 * and a change approved from Verde are validated and recorded the same way.
 */

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activityEvents, user, workspaces } from "@/db/schema";

export interface CompanyRecord {
  companyName: string | null;
  industry: string | null;
  teamSize: string | null;
  country: string;
  sites: number;
  revenueEur: number | null;
  baselineYear: number;
  framework: string;
  /** Cyprus Registrar of Companies link, set only from the register. */
  registry: {
    registrationNo: string;
    type: string | null;
    legalName: string | null;
    status: string | null;
    registeredOn: string | null;
    address: string | null;
    checkedAt: string | null;
  } | null;
}

const text = (max: number) =>
  z.string().trim().max(max).nullable().optional().transform((v) => (v === undefined ? undefined : v || null));

export const TEAM_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;

export const CompanyPatch = z
  .object({
    companyName: text(200),
    industry: text(100),
    teamSize: z.enum(TEAM_SIZES).nullable().optional(),
    country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Use a two-letter country code.").optional(),
    sites: z.number().int().min(1, "A company has at least one site.").max(10_000).optional(),
    revenueEur: z.number().finite().min(0, "Revenue cannot be negative.").max(1e13).nullable().optional(),
  })
  .strict();

export type CompanyPatchInput = z.infer<typeof CompanyPatch>;

export const COMPANY_LABELS: Record<string, string> = {
  companyName: "company name",
  industry: "industry",
  teamSize: "team size",
  country: "country",
  sites: "number of sites",
  revenueEur: "yearly revenue",
};

export async function readCompany(accountId: string, workspaceId: string): Promise<CompanyRecord> {
  const [[p], [w]] = await Promise.all([
    db
      .select({ companyName: user.companyName, industry: user.companyIndustry, teamSize: user.teamSize, country: user.countryCode })
      .from(user)
      .where(eq(user.id, accountId))
      .limit(1),
    db
      .select({ sites: workspaces.sites, revenueEur: workspaces.revenueEur, baselineYear: workspaces.baselineYear, framework: workspaces.framework, country: workspaces.country,
        registrationNo: workspaces.registrationNo, registryType: workspaces.registryType, registryName: workspaces.registryName,
        registryStatus: workspaces.registryStatus, registryRegisteredOn: workspaces.registryRegisteredOn,
        registryAddress: workspaces.registryAddress, registryCheckedAt: workspaces.registryCheckedAt })
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
    registry: w?.registrationNo
      ? {
          registrationNo: w.registrationNo,
          type: w.registryType,
          legalName: w.registryName,
          status: w.registryStatus,
          registeredOn: w.registryRegisteredOn,
          address: w.registryAddress,
          checkedAt: w.registryCheckedAt ? w.registryCheckedAt.toISOString() : null,
        }
      : null,
  };
}

/**
 * Applies a validated patch in one transaction and writes one audit event
 * naming what changed. Returns the fields that really changed.
 */
export async function applyCompanyPatch(input: {
  accountId: string;
  workspaceId: string;
  actorName: string;
  actorType: "human" | "agent";
  body: CompanyPatchInput;
  via?: string;
}): Promise<{ company: CompanyRecord; changed: string[] }> {
  const { accountId, workspaceId, actorName, actorType, body, via } = input;
  const before = await readCompany(accountId, workspaceId);
  const changed = (Object.keys(body) as (keyof CompanyPatchInput)[]).filter(
    (k) => body[k] !== undefined && body[k] !== before[k as keyof CompanyRecord],
  );
  if (!changed.length) return { company: before, changed: [] };

  await db.transaction(async (tx) => {
    const profile: Partial<typeof user.$inferInsert> = {};
    if (body.companyName !== undefined) profile.companyName = body.companyName;
    if (body.industry !== undefined) profile.companyIndustry = body.industry;
    if (body.teamSize !== undefined) profile.teamSize = body.teamSize;
    if (body.country !== undefined) profile.countryCode = body.country;
    if (Object.keys(profile).length) {
      await tx.update(user).set({ ...profile, updatedAt: new Date() }).where(eq(user.id, accountId));
    }
    const ws: Partial<typeof workspaces.$inferInsert> = {};
    if (body.sites !== undefined) ws.sites = body.sites;
    if (body.revenueEur !== undefined) ws.revenueEur = body.revenueEur;
    if (Object.keys(ws).length) await tx.update(workspaces).set(ws).where(eq(workspaces.id, workspaceId));
    await tx.insert(activityEvents).values({
      workspaceId,
      actorType,
      actorName,
      verb: "updated",
      object: "Company details",
      detail: `Changed ${changed.map((k) => COMPANY_LABELS[k]).join(", ")}${via ? ` ${via}` : ""}.`,
    });
  });

  return { company: await readCompany(accountId, workspaceId), changed };
}
