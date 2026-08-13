import { NextRequest, NextResponse } from "next/server";
import { getVuneliSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const isSessionRequest =
    request.nextUrl.pathname.endsWith("/session") ||
    request.nextUrl.pathname.endsWith("/get-session");
  if (!isSessionRequest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    return NextResponse.json({ data: await getVuneliSession(request.headers) });
  } catch (error) {
    console.error("[Supabase Auth] session resolution failed", error);
    return NextResponse.json({ error: "Unable to resolve session" }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "Supabase Auth is handled directly by the application client." },
    { status: 405 },
  );
}
