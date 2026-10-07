import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveConsoleSession } from "@/lib/console-session";
import { logger } from "@/lib/log";
import { loadBankBorrowerPack, type BankTarget } from "@/lib/reports/bank.server";

export const dynamic = "force-dynamic";
const log = logger("api.console.bank-pack");

export async function GET(req: Request) {
  const s = await resolveConsoleSession(await headers());
  if (!s.ok) return NextResponse.json({ error: s.error, message: s.message }, { status: s.status });

  const url = new URL(req.url);
  const bank = (url.searchParams.get("bank") || "boc") as BankTarget;
  const targetBank: BankTarget = bank === "hellenic" ? "hellenic" : "boc";
  const principal = Number(url.searchParams.get("principal") || "250000");

  try {
    const pack = await loadBankBorrowerPack(s.session.workspace.id, targetBank, principal);
    if (!pack) {
      return NextResponse.json({ message: "Workspace not found." }, { status: 404 });
    }
    return NextResponse.json(pack);
  } catch (error) {
    const ref = log.error("load bank pack failed", error);
    return NextResponse.json({ message: "Could not load Bank ESG pack.", ref }, { status: 500 });
  }
}
