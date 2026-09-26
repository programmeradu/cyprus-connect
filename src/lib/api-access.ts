/**
 * Which API paths the public website may call without a session.
 *
 * Everything else under /api needs a signed-in account (checked in
 * middleware) and, where it touches account data, `bindSessionUser`.
 * Paths here verify their caller themselves (webhook signature, cron secret)
 * or return only public, non-personal data.
 */

export const PUBLIC_API_PREFIXES = [
  "/api/public/", // external callers; each verifies a signature
  "/api/auth/", // sign-in flow
  "/api/oauth/", // provider callbacks
  "/api/cron/", // guarded by CRON_SECRET
  "/api/admin/migrate", // guarded by its migration secret
  "/api/keep-alive",
  "/api/qa/enter", // off in production builds
  "/api/stripe/webhook", // signature-verified
  "/api/news",
  "/api/weather",
  "/api/geolocation",
  "/api/exchange-rates",
  "/api/energy-prices/",
  "/api/energy-pricing",
  "/api/climate-trace/",
  "/api/grant-alerts/subscribe",
  "/api/gemini/stream", // marketing assistant; rate-limited in the route
] as const;

/** Tools that only admins run; closed on the published site. */
export const DEV_ONLY_API_PREFIXES = [
  "/api/marketplace/projects/bulk-generate-banners",
  "/api/marketplace/projects/auto-generate-banners",
  "/api/climate-trace/admin/",
] as const;

function matches(pathname: string, prefix: string): boolean {
  if (prefix.endsWith("/")) return pathname.startsWith(prefix) || pathname === prefix.slice(0, -1);
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export function isDevOnlyApi(pathname: string): boolean {
  return DEV_ONLY_API_PREFIXES.some((p) => matches(pathname, p));
}

export function isPublicApi(pathname: string): boolean {
  if (isDevOnlyApi(pathname)) return false;
  return PUBLIC_API_PREFIXES.some((p) => matches(pathname, p));
}
