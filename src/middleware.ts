import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { APP_OPEN_ACCESS } from "@/lib/open-access";


const intlMiddleware = createIntlMiddleware(routing);

// Protected route suffixes (after locale prefix)
const protectedSuffixes = [
  "/app",
  "/app/actions",
  "/app/analytics",
  "/app/calculator",
  "/app/insights",
  "/app/integrations",
  "/app/leaderboard",
  "/app/onboarding",
  "/app/settings",
  "/app/studio",
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes entirely
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Strip locale prefix to check protection
  const localeMatch = pathname.match(/^\/(en|el)(\/.*)?$/);
  const pathWithoutLocale = localeMatch ? localeMatch[2] || "/" : pathname;

  const isProtected =
    !APP_OPEN_ACCESS &&
    protectedSuffixes.some(
      (route) => pathWithoutLocale === route || pathWithoutLocale.startsWith(route + "/")
    );

  if (isProtected) {
    // Cookie-only check: middleware runs on the edge and cannot self-fetch
    // the app origin reliably. Full session validation happens in the route
    // handlers / server components behind this gate.
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
      const locale = localeMatch?.[1] || routing.defaultLocale;
      const url = new URL(`/${locale}/auth`, request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Delegate to next-intl for locale routing / redirects
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
