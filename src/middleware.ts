import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import { QA_COOKIE, QA_HEADER, isQaRequest } from "@/lib/qa-bypass";
import { getSupabaseServerConfig } from "@/lib/supabase/server";
import { isDevOnlyApi, isPublicApi } from "@/lib/api-access";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * API gate: every non-public /api path needs a valid session (cookie or
 * bearer). Routes that touch account data additionally bind the account
 * with `bindSessionUser`, so this is the outer wall, not the only one.
 */
async function guardApi(request: NextRequest, pathname: string) {
  console.log("[api-gate-debug]", pathname);
  if (isDevOnlyApi(pathname) && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (request.method === "OPTIONS" || isPublicApi(pathname)) { const r = NextResponse.next(); r.headers.set("x-api-gate", "public"); return r; }

  const qa = isQaRequest({
    cookie: request.cookies.get(QA_COOKIE)?.value ?? null,
    header: request.headers.get(QA_HEADER),
  });
  if (qa) return NextResponse.next();

  const { url, publishableKey } = getSupabaseServerConfig();
  const response = NextResponse.next();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const authz = request.headers.get("authorization");
  const bearer = authz?.startsWith("Bearer ") ? authz.slice(7).trim() : "";
  const { data } =
    bearer && bearer !== "null" && bearer !== "undefined"
      ? await supabase.auth.getClaims(bearer)
      : await supabase.auth.getClaims();

  if (!data?.claims) {
    return NextResponse.json({ error: "Please sign in.", code: "UNAUTHENTICATED" }, { status: 401 });
  }
  return response;
}

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
  if (request.nextUrl.pathname.startsWith("/api")) console.log("[api-gate-debug] top");
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return guardApi(request, pathname);
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
