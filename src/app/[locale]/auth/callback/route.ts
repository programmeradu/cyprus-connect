import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseServerConfig } from "@/lib/supabase/server";

function safePath(candidate: string | null, locale: string) {
  const fallback = `/${locale}/app`;
  if (!candidate || !candidate.startsWith(`/${locale}/`)) return fallback;
  return candidate;
}

export async function GET(request: NextRequest, context: { params: Promise<{ locale: string }> }) {
  const { locale } = await context.params;
  const code = request.nextUrl.searchParams.get("code");
  const type = request.nextUrl.searchParams.get("type");
  const requestedNext = safePath(request.nextUrl.searchParams.get("next"), locale);
  const destination = type === "recovery" ? `/${locale}/auth?reset=1` : requestedNext;
  const response = NextResponse.redirect(new URL(destination, request.url));

  if (!code) return response;

  const { url, publishableKey } = getSupabaseServerConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/${locale}/auth?error=callback`, request.url));
  }
  return response;
}
