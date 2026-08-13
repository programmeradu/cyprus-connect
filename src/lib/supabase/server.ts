import { createServerClient } from "@supabase/ssr";

export function getSupabaseServerConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publishableKey) {
    throw new Error("Supabase Auth requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }
  return { url, publishableKey };
}

function parseCookieHeader(header: string | null) {
  if (!header) return [];
  return header.split(";").map((entry) => {
    const separator = entry.indexOf("=");
    return separator === -1
      ? { name: entry.trim(), value: "" }
      : { name: entry.slice(0, separator).trim(), value: decodeURIComponent(entry.slice(separator + 1).trim()) };
  }).filter(({ name }) => Boolean(name));
}

export function createHeaderSupabaseClient(headers: Headers) {
  const { url, publishableKey } = getSupabaseServerConfig();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => parseCookieHeader(headers.get("cookie")),
    },
  });
}
