import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://vuneli.com").replace(/\/$/, "");

const COPY = {
  en: {
    title: "Vision - Where Vuneli is taking sustainability for Cyprus SMEs",
    description:
      "How Vuneli is building an always-on sustainability consultant for Cyprus and EU businesses: what works today, what is in beta and what comes next.",
  },
  el: {
    title: "Όραμα - Πού οδηγεί το Vuneli τη βιωσιμότητα για τις ΜμΕ της Κύπρου",
    description:
      "Πώς το Vuneli χτίζει έναν σύμβουλο βιωσιμότητας που δουλεύει συνεχώς για επιχειρήσεις στην Κύπρο και την ΕΕ: τι λειτουργεί σήμερα και τι έρχεται.",
  },
} as const;

/** The vision page is a client component, so its own metadata lives here. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = locale === "el" ? "el" : "en";
  const { title, description } = COPY[l];
  const url = `${SITE_URL}/${l}/vision`;
  const languages: Record<string, string> = {};
  for (const x of routing.locales) languages[x === "el" ? "el-CY" : x] = `${SITE_URL}/${x}/vision`;
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}/vision`;
  return {
    title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      title,
      description,
      url,
      siteName: "Vuneli",
      locale: l === "el" ? "el_CY" : "en_US",
      type: "article",
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`${SITE_URL}/og-image.png`] },
  };
}

export default function VisionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
