import { NextRequest, NextResponse } from "next/server";
import { QA_COOKIE, QA_UI_COOKIE, qaBypassEnabled, qaToken } from "@/lib/qa-bypass";

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
  // Relative Location keeps the browser on the host it already uses, so the
  // cookie set below is sent on the next request.
  const target = leave ? "/" : to.startsWith("/") ? to : `/${to}`;
  const response = new NextResponse(null, {
    status: 307,
    headers: { Location: target },
  });

  if (leave) {
    response.cookies.delete(QA_COOKIE);
    response.cookies.delete(QA_UI_COOKIE);
  } else {
    response.cookies.set(QA_COOKIE, qaToken(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    response.cookies.set(QA_UI_COOKIE, "1", {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  }

  return response;
}
