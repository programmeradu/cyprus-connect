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

export async function GET() {
  try {
    // Using Grist environmental news RSS feed
    const response = await fetch('https://grist.org/feed/', {
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
      
      // Clean and decode title - remove HTML tags first, then decode entities
      title = title
        .replace(/<[^>]*>/g, '')
        .trim();
      title = decodeHTMLEntities(title);
      
      // Clean and decode description - remove HTML tags, truncate, then decode entities
      description = description
        .replace(/<[^>]*>/g, '')
        .trim()
        .substring(0, 150);
      
      if (description.length === 150) {
        description += '...';
      }
      
      description = decodeHTMLEntities(description);
      
      if (title && link) {
        items.push({
          title: title.trim(),
          link: link,
          pubDate: pubDate,
          description: description || 'Read more about this sustainability story.',
          imageUrl: imageUrl || ''
        });
        count++;
      }
    }
    
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("News API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch news" },
      { status: 500 }
    );
  }
}