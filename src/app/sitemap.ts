import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

// Public, indexable routes (relative to /[locale])
const PUBLIC_PATHS = ["", "/pricing"] as const;

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

      return {
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: path === "" ? 1 : 0.8,
        alternates: { languages },
      };
    }),
  );
}
