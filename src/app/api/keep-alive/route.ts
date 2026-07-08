import { NextResponse } from "next/server";
import postgres from "postgres";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public keep-alive endpoint to prevent Supabase free-tier from pausing
// after 7 days of inactivity. Hit this on a schedule (cron-job.org, GitHub
// Actions, UptimeRobot, etc.) at least once every few days.
export async function GET() {
  const url = process.env.SUPABASE_DATABASE_URL;
  if (!url) {
    return NextResponse.json({ ok: false, error: "SUPABASE_DATABASE_URL not set" }, { status: 500 });
  }

  const sql = postgres(url, { max: 1, ssl: "require", prepare: false, idle_timeout: 5 });
  try {
    const rows = await sql`SELECT now() as now`;
    return NextResponse.json({ ok: true, now: rows[0]?.now });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  } finally {
    await sql.end({ timeout: 5 });
  }
}
