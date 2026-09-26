import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/** Uptime probe: 200 when the database answers within 5 s, 503 otherwise. No data is returned. */
export async function GET() {
  const started = Date.now();
  try {
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
    ]);
    return NextResponse.json({ status: "ok", db: "ok", ms: Date.now() - started }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "degraded", db: "down", ms: Date.now() - started }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
