/**
 * A company's real logo by web domain, fetched server-side so the browser
 * never talks to the logo providers and the result is cached.
 *
 * Sources, in order: Logo.dev (only when LOGO_DEV_TOKEN is set), then the
 * site's own icon via Google's favicon service. Answers 404 when neither has
 * a usable image (missing, or smaller than 32 px); the page then shows the
 * generated avatar instead. Only fixed provider hosts are contacted.
 */

import { NextRequest, NextResponse } from "next/server";
import { normalizeDomain } from "@/lib/company-logo";
import { logger } from "@/lib/log";

const log = logger("api.logo");
const MAX_BYTES = 400_000;
const DAY = 86_400;

/** Width of a PNG from its header; null for other formats. */
function pngWidth(buf: Uint8Array): number | null {
  if (buf.length < 24 || buf[0] !== 0x89 || buf[1] !== 0x50) return null;
  return (buf[16] << 24) | (buf[17] << 16) | (buf[18] << 8) | buf[19];
}

async function tryFetch(url: string): Promise<{ body: Uint8Array; type: string } | null> {
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(5000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return null;
    const body = new Uint8Array(await res.arrayBuffer());
    if (!body.length || body.length > MAX_BYTES) return null;
    const w = pngWidth(body);
    if (w !== null && w < 32) return null;
    return { body, type };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const domain = normalizeDomain(request.nextUrl.searchParams.get("d"));
  if (!domain) return NextResponse.json({ error: "A valid domain is required." }, { status: 400 });

  try {
    const token = process.env.LOGO_DEV_TOKEN;
    const sources = [
      ...(token ? [`https://img.logo.dev/${domain}?token=${encodeURIComponent(token)}&size=128&format=png&fallback=404`] : []),
      `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`,
    ];
    for (const url of sources) {
      const hit = await tryFetch(url);
      if (hit) {
        return new NextResponse(hit.body as unknown as BodyInit, {
          status: 200,
          headers: {
            "content-type": hit.type,
            "cache-control": `public, max-age=${7 * DAY}, stale-while-revalidate=${30 * DAY}`,
            "x-content-type-options": "nosniff",
            "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
          },
        });
      }
    }
    return new NextResponse(null, { status: 404, headers: { "cache-control": `public, max-age=${DAY}` } });
  } catch (error) {
    return NextResponse.json({ error: "Logo lookup failed.", ref: log.error("lookup failed", error) }, { status: 500 });
  }
}
