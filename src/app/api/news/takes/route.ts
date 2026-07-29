import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

/**
 * "Vuneli takes" - three short analyst notes written from the live Cyprus
 * ESG/climate feed. The result is cached in memory for an hour, per locale,
 * so page views do not each cost a model call, and so the section stays
 * stable for readers who move between pages.
 *
 * Writing rules for the model follow the house style: ASD-STE100 simplified
 * technical English, active voice, no em-dashes, no marketing language.
 */

export const dynamic = "force-dynamic";

type Take = { title: string; body: string };

type CacheEntry = { takes: Take[]; generatedAt: number; sourceCount: number };

const CACHE_MS = 60 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

// Editorial fallback. Used when the feed is empty, the key is missing, or the
// model call fails, so the section never renders blank.
const FALLBACK: Record<string, Take[]> = {
  en: [
    {
      title: "The CBAM definitive period is surfacing hidden supply-chain costs",
      body: "Cyprus importers of steel, cement and fertilizer still underestimate certificate exposure. Collect supplier emissions data for the 2026 declaration now, not next spring.",
    },
    {
      title: "VSME is the on-ramp, not the ceiling",
      body: "An early VSME report gives an SME a defensible answer when a bank or a large customer asks for sustainability data, well before CSRD Wave 3 lands.",
    },
    {
      title: "Grid intensity matters more than tariff shopping",
      body: "For most Cyprus SMEs, moving load into lower-carbon hours cuts Scope 2 more than a supplier switch. The renewables share is the signal to watch.",
    },
  ],
  el: [
    {
      title: "Η οριστική περίοδος CBAM αναδεικνύει κρυφά κόστη",
      body: "Κύπριοι εισαγωγείς χάλυβα, τσιμέντου και λιπασμάτων υποτιμούν την έκθεση σε πιστοποιητικά. Συλλέξτε δεδομένα προμηθευτών για τη δήλωση του 2026 τώρα.",
    },
    {
      title: "Το VSME είναι η αρχή, όχι το όριο",
      body: "Η πρώιμη υιοθέτηση VSME δίνει στις ΜμΕ αξιόπιστη απάντηση σε τράπεζες και μεγάλους πελάτες πριν φτάσει το CSRD Κύμα 3.",
    },
    {
      title: "Η ένταση δικτύου μετράει περισσότερο από την αλλαγή παρόχου",
      body: "Ο χρονισμός φορτίων σε ώρες χαμηλού άνθρακα μειώνει το Scope 2 πιο πολύ από την αλλαγή προμηθευτή.",
    },
  ],
};

function clean(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/[—–]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") === "el" ? "el" : "en";
  const cached = cache.get(locale);

  if (cached && Date.now() - cached.generatedAt < CACHE_MS) {
    return NextResponse.json({ ...cached, cached: true });
  }

  try {
    const origin = new URL(request.url).origin;
    const feed = await fetch(`${origin}/api/news?country=cy`, {
      headers: { "User-Agent": "Vuneli/1.0" },
      cache: "no-store",
    });
    const feedJson = feed.ok ? await feed.json() : { items: [] };
    const items: Array<{ title?: string; description?: string; pubDate?: string }> =
      Array.isArray(feedJson.items) ? feedJson.items.slice(0, 10) : [];

    const key = process.env.GOOGLE_GEMINI_API_KEY;
    if (items.length === 0 || !key) {
      return NextResponse.json({
        takes: FALLBACK[locale],
        generatedAt: Date.now(),
        sourceCount: items.length,
        fallback: true,
      });
    }

    const headlines = items
      .map((it, i) => `${i + 1}. ${clean(it.title, 200)} | ${clean(it.description, 240)}`)
      .join("\n");

    const language = locale === "el" ? "Greek (Cyprus)" : "English";
    const prompt = `You are the analyst desk of Vuneli, a sustainability platform for small and medium companies in Cyprus.

Read these ESG, climate, energy and EU compliance headlines from this week:
${headlines}

Write exactly 3 short analyst notes that tell a Cyprus SME owner what the week means for them.

Rules:
- Write in ${language}.
- Use ASD-STE100 simplified technical English principles: active voice, short sentences of 20 words or less, no idioms, no marketing language.
- Never use em-dashes or en-dashes. Use a comma or a full stop.
- Each note has a "title" of 6 to 12 words and a "body" of 2 sentences, 30 to 45 words in total.
- Ground each note in the headlines above. Name the rule, cost or deadline that changes.
- Give a concrete next step where the headlines support one.
- Do not invent figures, dates or company names that the headlines do not contain.
- Do not repeat the same subject twice.

Return JSON only.`;

    const client = new GoogleGenAI({ apiKey: key });
    const result = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            takes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  body: { type: "string" },
                },
                required: ["title", "body"],
              },
            },
          },
          required: ["takes"],
        },
      },
    });

    const raw = result.text ?? "";
    const parsed = JSON.parse(raw) as { takes?: Take[] };
    const takes = (parsed.takes ?? [])
      .map((t) => ({ title: clean(t.title, 120), body: clean(t.body, 420) }))
      .filter((t) => t.title.length > 8 && t.body.length > 40)
      .slice(0, 3);

    if (takes.length < 3) {
      return NextResponse.json({
        takes: FALLBACK[locale],
        generatedAt: Date.now(),
        sourceCount: items.length,
        fallback: true,
      });
    }

    const entry: CacheEntry = {
      takes,
      generatedAt: Date.now(),
      sourceCount: items.length,
    };
    cache.set(locale, entry);
    return NextResponse.json({ ...entry, cached: false });
  } catch (error) {
    console.error("[news/takes] generation failed", error);
    return NextResponse.json({
      takes: FALLBACK[locale],
      generatedAt: Date.now(),
      sourceCount: 0,
      fallback: true,
    });
  }
}
