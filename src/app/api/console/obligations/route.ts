/**
 * Legal deadlines for this company from the fixed rulebook: which apply,
 * which might (and the fact that would settle it), and which were checked
 * and don't apply, each with its reason and official source.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveConsoleSession } from "@/lib/console-session";
import { logger } from "@/lib/log";
import { listObligations, refreshObligations } from "@/lib/obligations/obligations.server";

export const dynamic = "force-dynamic";
const log = logger("api.console.obligations");

export async function GET() {
  const h = await headers();
  const s = await resolveConsoleSession(h);
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });
  try {
    const ws = s.session.workspace.id;
    let rows = await listObligations(ws);
    if (!rows.some((r) => r.ruleId)) {
      await refreshObligations(ws);
      rows = await listObligations(ws);
    }
    const order = (d: string) => (d ? d : "9999-12-31");
    rows.sort((a, b) => order(a.dueDate).localeCompare(order(b.dueDate)));
    const checkedAt = rows.reduce<string | null>((m, r) => (r.checkedAt && (!m || r.checkedAt > m) ? r.checkedAt : m), null);
    return NextResponse.json({ obligations: rows, checkedAt });
  } catch (error) {
    const ref = log.error("GET failed", error);
    return NextResponse.json({ message: `Deadlines could not be read. Reference ${ref}.`, ref }, { status: 500 });
  }
}
