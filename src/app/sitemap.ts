import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { PILLAR_SLUGS } from "@/data/learn/pillars";
import { GLOSSARY_SLUGS } from "@/data/learn/glossary";
import { AVAILABLE_TOOL_SLUGS } from "@/data/tools";
import { COUNTRY_SLUGS } from "@/data/tools/countries";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://vuneli.com").replace(/\/$/, "");

const STATIC_PATHS = ["", "/pricing", "/privacy", "/terms", "/security", "/dpa", "/learn", "/tools", "/glossary"] as const;
const LEARN_PATHS = PILLAR_SLUGS.map((slug) => `/learn/${slug}` as const);
const GLOSSARY_PATHS = GLOSSARY_SLUGS.map((slug) => `/glossary/${slug}` as const);
const TOOL_PATHS = AVAILABLE_TOOL_SLUGS.map((slug) => `/tools/${slug}` as const);
const COUNTRY_TOOL_PATHS = COUNTRY_SLUGS.map((slug) => `/tools/ghg-calculator/${slug}` as const);
const PUBLIC_PATHS = [...STATIC_PATHS, ...LEARN_PATHS, ...GLOSSARY_PATHS, ...TOOL_PATHS, ...COUNTRY_TOOL_PATHS];

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
      const isTool = path.startsWith("/tools/");
      return {
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: isLearnPillar
          ? ("monthly" as const)
          : isTool
            ? ("monthly" as const)
            : ("weekly" as const),
        priority: path === "" ? 1 : isTool ? 0.85 : isLearnPillar ? 0.7 : 0.8,
        alternates: { languages },
      };
    }),
  );
}
