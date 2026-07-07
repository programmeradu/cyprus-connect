import { NextRequest, NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";

// Protected routes that require authentication
const protectedRoutes = [
  '/app/actions',
  '/app/analytics',
  '/app/calculator',
  '/app/insights',
  '/app/integrations',
  '/app/leaderboard',
  '/app/onboarding',
  '/app/settings',
  '/app/studio',
  '/app',
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isProtectedRoute) {
    // Check session using better-auth
    const session = await betterFetch<{ user: { id: string } } | null>(
      "/api/auth/get-session",
      {
        baseURL: request.nextUrl.origin,
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      }
    );

    // If no session, redirect to auth page
    if (!session.data?.user) {
      const url = new URL("/auth", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
    matcher: [
      // Skip Next.js internals and all static files
      '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    ],
};