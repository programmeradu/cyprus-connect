import type { Pillar, PillarLocaleContent } from "../pillars";

/**
 * Compact factory to keep each pillar file focused on content, not boilerplate.
 * Every pillar still ships with a full <PillarLocaleContent> in EN and EL.
 */
export function makePillar(input: {
  slug: string;
  category: Pillar["category"];
  primaryKeyword: string;
  monthlyVolume?: number;
  readingMinutes: number;
  relatedSlugs: string[];
  publishedAt?: string;
  updatedAt?: string;
  heroImage?: string;
  en: PillarLocaleContent;
  el: PillarLocaleContent;
}): Pillar {
  const today = "2026-07-08";
  return {
    slug: input.slug,
    category: input.category,
    primaryKeyword: input.primaryKeyword,
    monthlyVolume: input.monthlyVolume,
    publishedAt: input.publishedAt ?? today,
    updatedAt: input.updatedAt ?? today,
    readingMinutes: input.readingMinutes,
    heroImage: input.heroImage ?? `/assets/learn/${input.slug}/hero.jpg`,
    relatedSlugs: input.relatedSlugs,
    en: input.en,
    el: input.el,
  };
}
