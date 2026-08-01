import { NextResponse } from "next/server";

export type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  imageUrl?: string;
  source?: string;
};

function decodeHTMLEntities(text: string): string {
  text = text.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
  text = text.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  const entities: Record<string, string> = {
    '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&apos;': "'", '&ldquo;': '"', '&rdquo;': '"', '&lsquo;': "'", '&rsquo;': "'",
    '&mdash;': '—', '&ndash;': '–', '&hellip;': '...',
  };
  for (const [e, c] of Object.entries(entities)) {
    text = text.replace(new RegExp(e, 'g'), c);
  }
  return text;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = (searchParams.get("country") || "").toLowerCase();

    // Primary live RSS feeds: Google News RSS for Cyprus / Grist for Global Climate
    const feeds = country === "cy"
      ? [
          "https://news.google.com/rss/search?q=(Cyprus+OR+%CE%9A%CF%8D%CF%80%CF%81%CE%BF%CF%82)+(sustainability+OR+climate+OR+energy+OR+renewable+OR+solar+OR+emissions+OR+ESG)&hl=en-CY&gl=CY&ceid=CY:en",
          "https://grist.org/feed/",
        ]
      : [
          "https://grist.org/feed/",
          "https://news.google.com/rss/search?q=EU+sustainability+climate+energy&hl=en-US&gl=US&ceid=US:en",
        ];

    const items: NewsItem[] = [];

    for (const feedUrl of feeds) {
      if (items.length >= 10) break;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(feedUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "application/rss+xml, application/xml, text/xml, */*",
          },
        });

        clearTimeout(timeout);

        if (!response.ok) continue;

        const xmlText = await response.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
        let match;

        while ((match = itemRegex.exec(xmlText)) !== null && items.length < 12) {
          const itemXml = match[1];

          let title = "";
          const titleCDataMatch = itemXml.match(/<title>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/title>/i);
          const titlePlainMatch = itemXml.match(/<title>(.*?)<\/title>/i);
          if (titleCDataMatch) title = titleCDataMatch[1];
          else if (titlePlainMatch) title = titlePlainMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "");

          const linkMatch = itemXml.match(/<link>(.*?)<\/link>/i);
          const link = linkMatch ? linkMatch[1].trim() : "";

          const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i);
          const pubDate = pubDateMatch ? pubDateMatch[1] : "";

          let description = "";
          const descCDataMatch = itemXml.match(/<description>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/description>/is);
          const descPlainMatch = itemXml.match(/<description>(.*?)<\/description>/is);
          if (descCDataMatch) description = descCDataMatch[1];
          else if (descPlainMatch) description = descPlainMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "");

          const sourceMatch = itemXml.match(/<source[^>]*>(.*?)<\/source>/i);
          const source = sourceMatch ? sourceMatch[1].trim() : "";

          const clean = (s: string, max?: number) => {
            let out = decodeHTMLEntities(s);
            out = out.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
            if (max && out.length > max) out = out.substring(0, max).trimEnd() + "…";
            return out;
          };

          title = clean(title);
          description = clean(description, 160);

          if (title && link && !items.some((existing) => existing.link === link)) {
            items.push({
              title,
              link,
              pubDate,
              description: description || "Read full live coverage on source.",
              source,
            });
          }
        }
      } catch (err) {
        console.error("Feed fetch error for", feedUrl, err);
      }
    }

    return NextResponse.json({ items }, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error: any) {
    console.error("News API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch live news" },
      { status: 500 }
    );
  }
}