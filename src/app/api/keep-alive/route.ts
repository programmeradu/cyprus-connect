import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public keep-alive endpoint to prevent the Supabase free-tier project from
// pausing after 7 days of inactivity. Hit this on a schedule (GitHub Actions,
// cron-job.org, UptimeRobot, etc.) at least once every few days.
//
// We intentionally use the PostgREST Data API (not a direct postgres
// connection) because:
//   1. It uses the same env vars the app already relies on, so we know they
//      are correctly configured in every environment.
//   2. A successful REST query is counted as project activity by Supabase.
//   3. It avoids Supavisor pooler tenant-identifier issues that were causing
//      500s from the previous postgres-based implementation.
export async function GET() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "Supabase URL or anon key not configured" },
      { status: 500 },
    );
  }

  try {
    // Hit the PostgREST root. It responds 200 with the OpenAPI spec and,
    // importantly, executes against the database - which Supabase counts as
    // activity for pause-detection purposes.
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, status: res.status, error: body.slice(0, 200) },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      pingedAt: new Date().toISOString(),
      status: res.status,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}
