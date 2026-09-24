import type { Metadata } from "next";
import { NewsPageClient } from "@/components/news/NewsPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEl = locale === "el";
  const title = isEl
    ? "Ειδήσεις - ESG & κλίμα | Vuneli"
    : "News - ESG & climate wire | Vuneli";
  const description = isEl
    ? "Επιμελημένη ροή ειδήσεων για βιωσιμότητα, ενέργεια και συμμόρφωση ΕΕ, με χρονοδιάγραμμα προθεσμιών και ανάλυση από την Vuneli."
    : "Curated ESG, climate, energy and EU compliance news for SMEs - with a live regulatory timeline and Vuneli analysis.";
  return {
    title,
    description,
    alternates: {
      canonical: `https://vuneli.com/${locale}/news`,
      languages: {
        en: "https://vuneli.com/en/news",
        "el-CY": "https://vuneli.com/el/news",
        "x-default": "https://vuneli.com/en/news",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://vuneli.com/${locale}/news`,
      siteName: "Vuneli",
      locale: isEl ? "el_CY" : "en_US",
      images: [{ url: "https://vuneli.com/opengraph-image.png", width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function NewsPage() {
  return <NewsPageClient />;
}
