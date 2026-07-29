import { NextRequest, NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

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

    const session = await betterFetch<{ user: { id: string } } | null>(
      "/api/auth/get-session",
      {
        baseURL: request.nextUrl.origin,
        headers: { cookie: request.headers.get("cookie") || "" },
      }
    );

    if (!session.data?.user) {
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
