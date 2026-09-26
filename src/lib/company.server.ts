/**
 * Company facts, one home each.
 *
 * - Name, industry, team size and country live on the account profile
 *   (`user` row). Settings and Onboarding write them there, and every older
 *   page reads them there.
 * - Sites, yearly revenue, baseline year and framework live on the workspace.
 *
 * The workspace row also carries name/sector/employees/country columns from
 * when it was created. Those are never trusted on read: `withCompanyFacts`
 * overlays the profile values, so every console page sees the same answer.
 */

import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { agentControls, agentSwitches, user, workspaces } from "@/db/schema";

type Workspace = typeof workspaces.$inferSelect;

export interface CompanyProfile {
  companyName: string | null;
  companyIndustry: string | null;
  teamSize: string | null;
  countryCode: string | null;
}

/** "11-50" → 11, "500+" → 500. The lower bound, never a guess above it. */
export function employeesFromTeamSize(teamSize: string | null | undefined): number | null {
  if (!teamSize) return null;
  const first = teamSize.match(/\d+/);
  return first ? Number(first[0]) : null;
}

export function withCompanyFacts(workspace: Workspace, profile: CompanyProfile | null | undefined): Workspace {
  if (!profile) return workspace;
  const name = profile.companyName?.trim();
  const sector = profile.companyIndustry?.trim();
  const country = profile.countryCode?.trim().toUpperCase();
  const employees = employeesFromTeamSize(profile.teamSize);
  return {
    ...workspace,
    name: name || workspace.name,
    legalName: name || workspace.legalName,
    sector: sector || workspace.sector,
    country: country || workspace.country,
    employees: employees ?? workspace.employees,
  };
}

export async function readCompanyProfile(accountId: string): Promise<CompanyProfile | null> {
  const [row] = await db
    .select({
      companyName: user.companyName,
      companyIndustry: user.companyIndustry,
      teamSize: user.teamSize,
      countryCode: user.countryCode,
    })
    .from(user)
    .where(eq(user.id, accountId))
    .limit(1);
  return row ?? null;
}

export async function loadCompanyWorkspace(accountId: string, workspace: Workspace): Promise<Workspace> {
  return withCompanyFacts(workspace, await readCompanyProfile(accountId));
}

/**
 * The agent roster with each agent's real state for this workspace:
 * "planned" when it has no real work behind it yet, "paused" when its own
 * switch or the workspace switch is off, otherwise "active".
 */
export async function rosterFor<A extends { key: string; status: string }>(
  workspaceId: string,
  roster: A[],
  runnable: readonly string[],
): Promise<(A & { status: "active" | "paused" | "planned" })[]> {
  const keys = roster.map((a) => a.key);
  const [controls, switches] = await Promise.all([
    db.select({ paused: agentControls.paused }).from(agentControls).where(eq(agentControls.workspaceId, workspaceId)).limit(1),
    keys.length
      ? db
          .select({ agentKey: agentSwitches.agentKey, paused: agentSwitches.paused, workspaceId: agentSwitches.workspaceId })
          .from(agentSwitches)
          .where(inArray(agentSwitches.agentKey, keys))
      : Promise.resolve([]),
  ]);
  const allPaused = !!controls[0]?.paused;
  const paused = new Set(switches.filter((s) => s.workspaceId === workspaceId && s.paused).map((s) => s.agentKey));
  return roster.map((a) => ({
    ...a,
    status: !runnable.includes(a.key) ? "planned" : allPaused || paused.has(a.key) ? "paused" : "active",
  }));
}
