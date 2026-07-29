import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIGRATION_SECRET = "vuneli-migrate-cy-2026-a91f";

async function runMigrations() {
  const url = process.env.SUPABASE_DATABASE_URL;
  if (!url) throw new Error("SUPABASE_DATABASE_URL is not set");

  const migrationClient = postgres(url, { max: 1, ssl: "require", prepare: false });
  try {
    // Surface real underlying error
    try {
      await migrationClient`SELECT 1`;
    } catch (e: any) {
      throw new Error(`Connection test failed: ${e?.message} | code=${e?.code} | detail=${e?.detail}`);
    }
    const db = drizzle(migrationClient);
    const migrationsFolder = path.join(process.cwd(), "drizzle");
    try {
      await migrate(db, { migrationsFolder });
    } catch (e: any) {
      throw new Error(`Migrate failed: ${e?.message} | code=${e?.code} | detail=${e?.detail} | hint=${e?.hint} | where=${e?.where}`);
    }
    return { ok: true, migrationsFolder };
  } finally {
    await migrationClient.end({ timeout: 5 });
  }
}

function checkSecret(req: NextRequest) {
  const provided =
    req.nextUrl.searchParams.get("secret") ||
    req.headers.get("x-migration-secret");
  return provided === MIGRATION_SECRET;
}

export async function GET(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runMigrations();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? String(error),
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
