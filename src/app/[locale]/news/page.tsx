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
    ? "Ειδήσεις - ESG & κλίμα | VerdeIQ"
    : "News - ESG & climate wire | VerdeIQ";
  const description = isEl
    ? "Επιμελημένη ροή ειδήσεων για βιωσιμότητα, ενέργεια και συμμόρφωση ΕΕ, με χρονοδιάγραμμα προθεσμιών και ανάλυση από την VerdeIQ."
    : "Curated ESG, climate, energy and EU compliance news for SMEs - with a live regulatory timeline and VerdeIQ analysis.";
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/news`,
      languages: {
        en: "/en/news",
        el: "/el/news",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function NewsPage() {
  return <NewsPageClient />;
}
