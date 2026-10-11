import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveConsoleSession } from "@/lib/console-session";
import { logger } from "@/lib/log";
import { loadLenderPack } from "@/lib/reports/bank.server";

export const dynamic = "force-dynamic";
const log = logger("api.console.bank-pack");

export async function GET(req: Request) {
  const h = req ? new Headers(req.headers) : await headers();
  const s = await resolveConsoleSession(h);
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });

  try {
    const pack = await loadLenderPack(s.session.workspace.id);
    if (!pack) {
      return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    }
    return NextResponse.json(pack);
  } catch (error) {
    const ref = log.error("load lender pack failed", error);
    return NextResponse.json({ message: "Could not load the lender pack.", ref }, { status: 500 });
  }
}
