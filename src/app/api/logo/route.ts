/**
 * A company's real logo by web domain, fetched server-side and permanently
 * stored in the database so Logo.dev API credits are consumed at most once
 * per domain.
 *
 * Sources, in order:
 * 1. Persistent database cache (company_logos table)
 * 2. Logo.dev (when LOGO_DEV_TOKEN / NEXT_PUBLIC_LOGO_DEV_KEY is set)
 * 3. Google's favicon service fallback
 *
 * Answers 404 when neither has a usable image (missing, or smaller than 32 px);
 * negative lookups are also cached in the database to prevent repeat credit burn.
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companyLogos } from "@/db/schema";
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

  // 1. Check permanent database cache first (avoids burning any API credits)
  try {
    const [cached] = await db
      .select({
        contentType: companyLogos.contentType,
        data: companyLogos.data,
        source: companyLogos.source,
        status: companyLogos.status,
      })
      .from(companyLogos)
      .where(eq(companyLogos.domain, domain))
      .limit(1);

    if (cached) {
      if (cached.status === 200 && cached.data) {
        const buf = Buffer.from(cached.data, "base64");
        return new NextResponse(buf, {
          status: 200,
          headers: {
            "content-type": cached.contentType,
            "cache-control": `public, max-age=${365 * DAY}, immutable`,
            "x-content-type-options": "nosniff",
            "x-logo-cache": "HIT",
            "x-logo-source": cached.source,
            "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
          },
        });
      }
      if (cached.status === 404) {
        return new NextResponse(null, {
          status: 404,
          headers: {
            "cache-control": `public, max-age=${7 * DAY}`,
            "x-logo-cache": "HIT-NEGATIVE",
          },
        });
      }
    }
  } catch (dbErr) {
    log.warn("Database logo cache check failed, falling back to provider lookup", {
      domain,
      err: String(dbErr),
    });
  }

  // 2. Fetch from providers: Logo.dev first, then Google Favicon fallback
  try {
    const token = process.env.LOGO_DEV_TOKEN || process.env.NEXT_PUBLIC_LOGO_DEV_KEY || process.env.LOGO_DEV_SECRET_KEY;
    const sources = [
      ...(token
        ? [
            {
              url: `https://img.logo.dev/${domain}?token=${encodeURIComponent(token)}&size=128&format=png&fallback=404`,
              source: "logo_dev",
            },
          ]
        : []),
      {
        url: `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`,
        source: "favicon",
      },
    ];

    for (const item of sources) {
      const hit = await tryFetch(item.url);
      if (hit) {
        const b64 = Buffer.from(hit.body).toString("base64");

        // Save permanently to database
        try {
          await db
            .insert(companyLogos)
            .values({
              domain,
              contentType: hit.type,
              data: b64,
              source: item.source,
              status: 200,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: companyLogos.domain,
              set: {
                contentType: hit.type,
                data: b64,
                source: item.source,
                status: 200,
                updatedAt: new Date(),
              },
            });
        } catch (saveErr) {
          log.warn("Failed to persist logo to database", { domain, err: String(saveErr) });
        }

        return new NextResponse(hit.body as unknown as BodyInit, {
          status: 200,
          headers: {
            "content-type": hit.type,
            "cache-control": `public, max-age=${365 * DAY}, immutable`,
            "x-content-type-options": "nosniff",
            "x-logo-cache": "MISS",
            "x-logo-source": item.source,
            "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
          },
        });
      }
    }

    // 3. Negative cache: record 404 tombstone so we don't query Logo.dev again for nonexistent logos
    try {
      await db
        .insert(companyLogos)
        .values({
          domain,
          contentType: "none",
          data: "",
          source: "none",
          status: 404,
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
    } catch (saveErr) {
      log.warn("Failed to persist negative logo cache to database", { domain, err: String(saveErr) });
    }

    return new NextResponse(null, {
      status: 404,
      headers: {
        "cache-control": `public, max-age=${7 * DAY}`,
        "x-logo-cache": "MISS-NEGATIVE",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Logo lookup failed.", ref: log.error("lookup failed", error) }, { status: 500 });
  }
}

