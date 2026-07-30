import { NextRequest, NextResponse } from "next/server";
import { QA_COOKIE, qaBypassEnabled, qaToken } from "@/lib/qa-bypass";

export const dynamic = "force-dynamic";

/**
 * Sets (or clears) the QA back-door cookie for the /app console.
 * Returns 404 in production so the route does not exist on the live site.
 */
export async function GET(request: NextRequest) {
  if (!qaBypassEnabled()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const leave = request.nextUrl.searchParams.get("leave") === "1";
  const to = request.nextUrl.searchParams.get("to") || "/en/app";
  const response = NextResponse.redirect(new URL(leave ? "/" : to, request.url));

  if (leave) {
    response.cookies.delete(QA_COOKIE);
  } else {
    response.cookies.set(QA_COOKIE, qaToken(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  }

  return response;
}
