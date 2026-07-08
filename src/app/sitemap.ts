import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { PILLAR_SLUGS } from "@/data/learn/pillars";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://verdeiq.stauniverse.tech").replace(/\/$/, "");

// Public, indexable routes (relative to /[locale])
const STATIC_PATHS = ["", "/pricing", "/privacy", "/terms", "/security", "/dpa", "/learn"] as const;
const LEARN_PATHS = PILLAR_SLUGS.map((slug) => `/learn/${slug}` as const);
const PUBLIC_PATHS = [...STATIC_PATHS, ...LEARN_PATHS];

const hrefLangKey = (locale: string) => (locale === "el" ? "el-CY" : locale);

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_PATHS.flatMap((path) =>
    routing.locales.map((locale) => {
      const languages: Record<string, string> = {};
      for (const l of routing.locales) {
        languages[hrefLangKey(l)] = `${SITE_URL}/${l}${path}`;
      }
      languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}${path}`;

      const isLearnPillar = path.startsWith("/learn/");
      return {
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: isLearnPillar ? ("monthly" as const) : ("weekly" as const),
        priority: path === "" ? 1 : isLearnPillar ? 0.7 : 0.8,
        alternates: { languages },
      };
    }),
  );
}
