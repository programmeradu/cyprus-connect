import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import { QA_COOKIE, QA_HEADER, isQaRequest } from "@/lib/qa-bypass";
import { getSupabaseServerConfig } from "@/lib/supabase/server";


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

  // Preview-only QA back door: never active in a production build.
  const qa = isQaRequest({
    cookie: request.cookies.get(QA_COOKIE)?.value ?? null,
    header: request.headers.get(QA_HEADER),
  });

  const isProtected =
    !APP_OPEN_ACCESS &&
    !qa &&
    protectedSuffixes.some(
      (route) => pathWithoutLocale === route || pathWithoutLocale.startsWith(route + "/")
    );

  let response = intlMiddleware(request);

  if (isProtected) {
    const { url, publishableKey } = getSupabaseServerConfig();
    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data: claimsResult } = await supabase.auth.getClaims();

    if (!claimsResult?.claims) {
      const locale = localeMatch?.[1] || routing.defaultLocale;
      const url = new URL(`/${locale}/auth`, request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Delegate to next-intl for locale routing / redirects
  return response;
}

export const config = {
  matcher: [
    "/",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
