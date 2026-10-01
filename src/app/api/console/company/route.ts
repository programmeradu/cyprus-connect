/**
 * The company record every page shares. GET reads it; PATCH changes any part
 * of it in one transaction and records one audit event naming what changed.
 * Name, industry, team size and country are stored on the account profile;
 * sites and revenue on the workspace. The read/write logic lives in
 * src/lib/company-update.server.ts so the copilot approval gate shares it.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveConsoleSession } from "@/lib/console-session";
import { readJson } from "@/lib/validate";
import { logger } from "@/lib/log";
import { CompanyPatch, applyCompanyPatch, readCompany } from "@/lib/company-update.server";

export type { CompanyRecord } from "@/lib/company-update.server";

export const dynamic = "force-dynamic";
const log = logger("api.console.company");

export async function GET() {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  try {
    return NextResponse.json(await readCompany(s.session.account.id, s.session.workspace.id));
  } catch (error) {
    const ref = log.error("GET failed", error);
    return NextResponse.json({ message: "Your company details could not be read.", ref }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  const parsed = await readJson(req, CompanyPatch);
  if (!parsed.ok) return parsed.response;
  const { account, workspace } = s.session;

  try {
    const result = await applyCompanyPatch({
      accountId: account.id,
      workspaceId: workspace.id,
      actorName: account.name || account.email || "Workspace member",
      actorType: "human",
      body: parsed.data,
    });
    return NextResponse.json(result);
  } catch (error) {
    const ref = log.error("PATCH failed", error);
    return NextResponse.json({ message: "Your company details could not be saved.", ref }, { status: 500 });
  }
}
