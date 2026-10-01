/**
 * Cached machine translation for public titles and agent-written notes.
 *
 * Reads only ever use the cache, so a page never waits on AI. Missing texts
 * are translated after the response is sent and show in Greek on the next
 * load. Each text is translated once (keyed by its SHA-256) and reused for
 * every account. Callers mark these as "translated automatically".
 */

import { after } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { textTranslations } from "@/db/schema";
import { sha256Hex } from "@/lib/agents/hash";
import { aiResponsesJson, AiGatewayError, hasLovableAi } from "@/lib/lovable-ai";
import { logger } from "@/lib/log";

const log = logger("translate");
const CHUNK = 40;
const MAX_LEN = 4000;
const inFlight = new Set<string>();
/** Set when the gateway refuses for credits/access, so we stop asking until restart. */
let pausedUntil = 0;

export function localeOf(headers: Headers): "en" | "el" {
  const v = (headers.get("x-vuneli-locale") || "").toLowerCase();
  return v.startsWith("el") ? "el" : "en";
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["i", "text"],
        properties: { i: { type: "number" }, text: { type: "string" } },
      },
    },
  },
};

async function translateAndStore(texts: string[], locale: "el"): Promise<void> {
  if (!hasLovableAi() || Date.now() < pausedUntil) return;
  for (let start = 0; start < texts.length; start += CHUNK) {
    const chunk = texts.slice(start, start + CHUNK);
    try {
      const out = await aiResponsesJson<{ items: { i: number; text: string }[] }>({
        system:
          "Translate each item from English into Greek as used in Cyprus. Keep company names, programme names, codes, numbers, units, dates and email addresses exactly as written. Use plain, professional business Greek. Return every item with its index.",
        user: JSON.stringify(chunk.map((text, i) => ({ i, text }))),
        schemaName: "translations",
        schema: SCHEMA,
      });
      const rows: { sourceHash: string; locale: string; text: string }[] = [];
      for (const item of out?.items ?? []) {
        const src = chunk[item.i];
        const t = item.text?.trim();
        if (!src || !t) continue;
        rows.push({ sourceHash: await sha256Hex(src), locale, text: t.slice(0, MAX_LEN) });
      }
      if (rows.length) await db.insert(textTranslations).values(rows).onConflictDoNothing();
    } catch (e) {
      if (e instanceof AiGatewayError && [401, 402, 403].includes(e.status)) pausedUntil = Date.now() + 6 * 3_600_000;
      log.error("translation batch failed", e);
      return;
    }
  }
}

/**
 * Returns cached translations for the texts; schedules the rest. Returns an
 * empty map for English.
 */
export async function cachedTranslations(texts: (string | null | undefined)[], locale: "en" | "el"): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (locale === "en") return out;
  const unique = [...new Set(texts.filter((t): t is string => typeof t === "string" && t.trim().length > 0 && t.length <= MAX_LEN))];
  if (!unique.length) return out;
  const hashes = await Promise.all(unique.map((t) => sha256Hex(t)));
  const byHash = new Map(hashes.map((h, i) => [h, unique[i]]));
  const rows = await db
    .select({ sourceHash: textTranslations.sourceHash, text: textTranslations.text })
    .from(textTranslations)
    .where(and(eq(textTranslations.locale, locale), inArray(textTranslations.sourceHash, hashes)));
  for (const r of rows) {
    const src = byHash.get(r.sourceHash);
    if (src) out.set(src, r.text);
  }
  const missing = unique.filter((t, i) => !out.has(t) && !inFlight.has(hashes[i]));
  if (missing.length) {
    const keys = missing.map((t) => hashes[unique.indexOf(t)]);
    keys.forEach((k) => inFlight.add(k));
    try {
      after(async () => {
        try {
          await translateAndStore(missing, locale);
        } finally {
          keys.forEach((k) => inFlight.delete(k));
        }
      });
    } catch {
      // Outside a request scope (scripts, tests): skip; the next request schedules it.
      keys.forEach((k) => inFlight.delete(k));
    }
  }
  return out;
}

export { translateAndStore };
