import { NextResponse } from "next/server";

// Comprehensive HTML entity decoder
function decodeHTMLEntities(text: string): string {
  // First decode numeric entities (&#8217;, &#39;, etc.)
  text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
  
  // Then decode hex entities (&#x27;, etc.)
  text = text.replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  // Finally decode named entities
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '...',
  };
  
  for (const [entity, char] of Object.entries(entities)) {
    text = text.replace(new RegExp(entity, 'g'), char);
  }
  
  return text;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = (searchParams.get('country') || '').toLowerCase();

    // Cyprus-specific news via Google News RSS (sustainability + Cyprus)
    // Fallback to Grist for global news
    const feedUrl = country === 'cy'
      ? 'https://news.google.com/rss/search?q=(Cyprus+OR+%CE%9A%CF%8D%CF%80%CF%81%CE%BF%CF%82)+(sustainability+OR+climate+OR+energy+OR+renewable+OR+solar+OR+emissions+OR+ESG)&hl=en-CY&gl=CY&ceid=CY:en'
      : 'https://grist.org/feed/';

    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'VerdeIQ/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('News feed request failed');
    }

    const xmlText = await response.text();
    
    // More robust XML parsing for RSS
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const items = [];
    let match;
    let count = 0;
    
    while ((match = itemRegex.exec(xmlText)) !== null && count < 10) {
      const itemXml = match[1];
      
      // Extract title - handle both CDATA and plain text
      let title = '';
      const titleCDataMatch = itemXml.match(/<title>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/title>/i);
      const titlePlainMatch = itemXml.match(/<title>(.*?)<\/title>/i);
      if (titleCDataMatch) {
        title = titleCDataMatch[1];
      } else if (titlePlainMatch) {
        title = titlePlainMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '');
      }
      
      // Extract link
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/i);
      const link = linkMatch ? linkMatch[1].trim() : '';
      
      // Extract pubDate
      const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i);
      const pubDate = pubDateMatch ? pubDateMatch[1] : '';
      
      // Extract description - handle both CDATA and plain text
      let description = '';
      const descCDataMatch = itemXml.match(/<description>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/description>/is);
      const descPlainMatch = itemXml.match(/<description>(.*?)<\/description>/is);
      if (descCDataMatch) {
        description = descCDataMatch[1];
      } else if (descPlainMatch) {
        description = descPlainMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '');
      }
      
      // Extract image from multiple sources
      let imageUrl = '';
      
      // Try media:content tag
      const mediaContentMatch = itemXml.match(/<media:content[^>]*url=["']([^"']+)["']/i);
      if (mediaContentMatch) {
        imageUrl = mediaContentMatch[1];
      }
      
      // Try media:thumbnail tag
      if (!imageUrl) {
        const mediaThumbnailMatch = itemXml.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i);
        if (mediaThumbnailMatch) {
          imageUrl = mediaThumbnailMatch[1];
        }
      }
      
      // Try enclosure tag (typically for podcasts but sometimes used for images)
      if (!imageUrl) {
        const enclosureMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i);
        if (enclosureMatch) {
          imageUrl = enclosureMatch[1];
        }
      }
      
      // Try to extract first image from description HTML (before cleaning)
      if (!imageUrl && description) {
        const imgMatch = description.match(/<img[^>]*src=["']([^"']+)["']/i);
        if (imgMatch) {
          imageUrl = imgMatch[1];
        }
      }
      
      // Try content:encoded for images
      if (!imageUrl) {
        const contentMatch = itemXml.match(/<content:encoded>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/content:encoded>/is);
        if (contentMatch) {
          const imgMatch = contentMatch[1].match(/<img[^>]*src=["']([^"']+)["']/i);
          if (imgMatch) {
            imageUrl = imgMatch[1];
          }
        }
      }
      
      // Decode HTML entities in image URL
      if (imageUrl) {
        imageUrl = decodeHTMLEntities(imageUrl);
      }
      
      // IMPORTANT: decode entities FIRST (Google News encodes tags as &lt;a&gt;...),
      // then strip HTML tags, then whitespace-collapse and truncate.
      const clean = (s: string, max?: number) => {
        let out = decodeHTMLEntities(s);
        // Repeat to catch double-encoded entities like &amp;lt;
        out = decodeHTMLEntities(out);
        out = out.replace(/<[^>]*>/g, ' ');
        out = out.replace(/\s+/g, ' ').trim();
        if (max && out.length > max) out = out.substring(0, max).trimEnd() + '…';
        return out;
      };

      title = clean(title);
      description = clean(description, 160);

      if (title && link) {
        items.push({
          title,
          link,
          pubDate,
          description: description || 'Read more about this sustainability story.',
          imageUrl,
        });
        count++;
      }
    }

    // Resolve missing images from each article's og:image / twitter:image.
    // Google News RSS links redirect to the publisher; follow redirects then
    // parse meta tags. Run in parallel with a per-article timeout.
    async function verifyImageUrl(url: string): Promise<boolean> {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3000);
        let res = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
          signal: ctrl.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VerdeIQ/1.0)' },
        });
        // Some CDNs reject HEAD — fall back to a tiny ranged GET
        if (!res.ok || res.status === 405) {
          res = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            signal: ctrl.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; VerdeIQ/1.0)',
              'Range': 'bytes=0-1023',
            },
          });
        }
        clearTimeout(timer);
        if (!res.ok) return false;
        const ct = res.headers.get('content-type') || '';
        return ct.toLowerCase().startsWith('image/');
      } catch {
        return false;
      }
    }

    async function resolveOgImage(articleUrl: string, title: string): Promise<string> {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(articleUrl, {
          redirect: 'follow',
          signal: ctrl.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; VerdeIQ/1.0; +https://verdeiq.stauniverse.tech)',
            'Accept': 'text/html,application/xhtml+xml',
          },
        });
        clearTimeout(timer);
        if (!res.ok) {
          console.log(`[news-image] ${res.status} fetch failed for "${title.slice(0, 60)}"`);
          return '';
        }
        const reader = res.body?.getReader();
        if (!reader) return '';
        const decoder = new TextDecoder();
        let html = '';
        let bytes = 0;
        while (bytes < 900_000) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.length;
          html += decoder.decode(value, { stream: true });
          if (html.includes('</head>')) break;
        }
        reader.cancel().catch(() => {});
        const patterns: Array<[string, RegExp]> = [
          ['og:image', /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i],
          ['og:image', /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i],
          ['twitter:image', /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i],
          ['twitter:image', /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i],
          ['image_src', /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i],
        ];
        for (const [field, p] of patterns) {
          const m = html.match(p);
          if (m?.[1]) {
            let url = decodeHTMLEntities(m[1].trim());
            if (url.startsWith('//')) url = 'https:' + url;
            if (!url.startsWith('http')) continue;
            const ok = await verifyImageUrl(url);
            console.log(`[news-image] "${title.slice(0, 60)}" ← ${field} → ${ok ? 'OK' : 'INVALID'} ${url}`);
            if (ok) return url;
          }
        }
        console.log(`[news-image] no valid meta image for "${title.slice(0, 60)}"`);
      } catch (e: any) {
        console.log(`[news-image] error for "${title.slice(0, 60)}": ${e?.message || e}`);
      }
      return '';
    }

    await Promise.all(
      items.map(async (it) => {
        if (!it.imageUrl) {
          it.imageUrl = await resolveOgImage(it.link, it.title);
        }
      })
    );

    return NextResponse.json({ items }, {
      headers: {
        // Cache 1h on CDN, serve stale for 24h while revalidating in background
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
    
    return NextResponse.json({ items }, {
      headers: {
        // Cache 1h on CDN, serve stale for 24h while revalidating in background
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error("News API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch news" },
      { status: 500 }
    );
  }
}