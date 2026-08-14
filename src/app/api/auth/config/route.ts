import { NextResponse } from "next/server";
import { getSupabaseServerConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Public Supabase values are intentionally served at runtime instead of being
 * embedded during `next build`. This keeps the browser client aligned with the
 * active Cloudflare Worker secrets after a source-driven deployment.
 */
export async function GET() {
  const { url, publishableKey } = getSupabaseServerConfig();
  return NextResponse.json(
    { url, publishableKey },
    { headers: { "Cache-Control": "no-store" } },
  );
}
