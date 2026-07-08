/**
 * Pillar page catalog — bilingual (EN/EL) SEO-optimized learn/knowledge pages.
 * Each pillar renders via /[locale]/learn/[slug].
 *
 * Content strategy is driven by Semrush research (July 2026):
 * - Own low-competition niches: VSME, carbon-accounting-for-SMEs
 * - Awareness drivers: CBAM (3.6k vol), scope 3 (2.4k vol), CSRD (2.9k vol)
 * - Cyprus-local intent: 0 competition, high local relevance
 * - EU/UK broad: ESG reporting software (720 vol, KDI 18)
 */

export type PillarSection = {
  heading: string;
  body: string[]; // paragraphs
};

export type PillarFAQ = {
  q: string;
  a: string;
};

export type PillarLocaleContent = {
  title: string;                 // <h1> and og:title
  metaTitle: string;             // <title>, under 60 chars
  metaDescription: string;       // under 160 chars
  heroEyebrow: string;
  heroSubtitle: string;
  tocLabel: string;
  introduction: string[];        // 2-3 paragraphs
  sections: PillarSection[];     // 4-6 sections
  keyTakeaways: string[];        // 4-6 bullets
  faq: PillarFAQ[];              // 4-6 Q&A pairs
  ctaHeading: string;
  ctaBody: string;
};

export type Pillar = {
  slug: string;
  category: "csrd" | "cbam" | "carbon" | "esg" | "sme" | "cyprus" | "standards";
  primaryKeyword: string;
  monthlyVolume?: number;
  publishedAt: string;           // ISO date
  updatedAt: string;             // ISO date
  readingMinutes: number;
  heroImage: string;             // /assets/learn/<slug>/hero.jpg
  ogImage?: string;              // absolute or root-relative; defaults to heroImage
  relatedSlugs: string[];        // 3-4 related pillar slugs
  en: PillarLocaleContent;
  el: PillarLocaleContent;
};

/**
 * PILLAR CATALOG — 20 initial pages.
 * Full content shipped page-by-page. Slugs, metadata, and hero image paths
 * are declared for all 20 up front so sitemap, routing, and internal linking work today.
 * Content stubs use the same structure; each pillar is expanded in ordered batches.
 */
export const PILLAR_SLUGS = [
  "csrd-reporting-guide",
  "vsme-reporting-guide",
  "carbon-footprint-software-smes",
  "cbam-explained",
  "scope-1-2-3-emissions",
  "esg-reporting-software",
  "carbon-accounting-for-smes",
  "esg-software-cyprus",
  "csrd-reporting-cyprus",
  "cbam-cyprus",
  "sustainability-reporting-eu",
  "ghg-protocol-guide",
  "net-zero-roadmap-smes",
  "science-based-targets-sbti",
  "eu-taxonomy-explained",
  "double-materiality-assessment",
  "scope-3-emissions-calculation",
  "carbon-offsetting-vs-reduction",
  "sustainability-kpis-for-smes",
  "esrs-standards-explained",
] as const;

export type PillarSlug = (typeof PILLAR_SLUGS)[number];

// Individual pillar content lives in ./pillars/<slug>.ts and is aggregated below.
import { csrdReportingGuide } from "./pillars/csrd-reporting-guide";
import { vsmeReportingGuide } from "./pillars/vsme-reporting-guide";
import { carbonFootprintSoftwareSmes } from "./pillars/carbon-footprint-software-smes";
import { cbamExplained } from "./pillars/cbam-explained";
import { scope123Emissions } from "./pillars/scope-1-2-3-emissions";
import { esgReportingSoftware } from "./pillars/esg-reporting-software";
import { carbonAccountingForSmes } from "./pillars/carbon-accounting-for-smes";
import { esgSoftwareCyprus } from "./pillars/esg-software-cyprus";
import { csrdReportingCyprus } from "./pillars/csrd-reporting-cyprus";
import { cbamCyprus } from "./pillars/cbam-cyprus";
import { sustainabilityReportingEu } from "./pillars/sustainability-reporting-eu";
import { ghgProtocolGuide } from "./pillars/ghg-protocol-guide";
import { netZeroRoadmapSmes } from "./pillars/net-zero-roadmap-smes";
import { scienceBasedTargetsSbti } from "./pillars/science-based-targets-sbti";
import { euTaxonomyExplained } from "./pillars/eu-taxonomy-explained";
import { doubleMaterialityAssessment } from "./pillars/double-materiality-assessment";
import { scope3EmissionsCalculation } from "./pillars/scope-3-emissions-calculation";
import { carbonOffsettingVsReduction } from "./pillars/carbon-offsetting-vs-reduction";
import { sustainabilityKpisForSmes } from "./pillars/sustainability-kpis-for-smes";
import { esrsStandardsExplained } from "./pillars/esrs-standards-explained";

export const PILLARS: Record<PillarSlug, Pillar> = {
  "csrd-reporting-guide": csrdReportingGuide,
  "vsme-reporting-guide": vsmeReportingGuide,
  "carbon-footprint-software-smes": carbonFootprintSoftwareSmes,
  "cbam-explained": cbamExplained,
  "scope-1-2-3-emissions": scope123Emissions,
  "esg-reporting-software": esgReportingSoftware,
  "carbon-accounting-for-smes": carbonAccountingForSmes,
  "esg-software-cyprus": esgSoftwareCyprus,
  "csrd-reporting-cyprus": csrdReportingCyprus,
  "cbam-cyprus": cbamCyprus,
  "sustainability-reporting-eu": sustainabilityReportingEu,
  "ghg-protocol-guide": ghgProtocolGuide,
  "net-zero-roadmap-smes": netZeroRoadmapSmes,
  "science-based-targets-sbti": scienceBasedTargetsSbti,
  "eu-taxonomy-explained": euTaxonomyExplained,
  "double-materiality-assessment": doubleMaterialityAssessment,
  "scope-3-emissions-calculation": scope3EmissionsCalculation,
  "carbon-offsetting-vs-reduction": carbonOffsettingVsReduction,
  "sustainability-kpis-for-smes": sustainabilityKpisForSmes,
  "esrs-standards-explained": esrsStandardsExplained,
};

export function getPillar(slug: string): Pillar | null {
  return (PILLARS as Record<string, Pillar | undefined>)[slug] ?? null;
}

export function getAllPillars(): Pillar[] {
  return PILLAR_SLUGS.map((s) => PILLARS[s]);
}

export function getRelatedPillars(slug: string): Pillar[] {
  const p = getPillar(slug);
  if (!p) return [];
  return p.relatedSlugs.map((s) => getPillar(s)).filter((x): x is Pillar => Boolean(x));
}
