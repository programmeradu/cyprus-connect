"use client";

import Image, { type StaticImageData } from "next/image";
import { useTranslations } from "next-intl";

import chapterEnergy from "@/assets/power-01-energy-bill.jpg";
import chapterBenchmark from "@/assets/power-02-benchmark-sheets.jpg";
import chapterCompliance from "@/assets/power-03-compliance-binders.jpg";
import chapterIntegrations from "@/assets/power-04-integrations-index.jpg";

/**
 * PowerChapters - the platform capability section, built as numbered editorial
 * chapters (Envirogen numbering + Lifecycle hairline rules).
 *
 * Rules respected: no icons, no pill badges, no eyebrow labels, no generic
 * illustration. Each chapter carries its own context-aware photograph, and all
 * four photographs are deliberately different in framing so the section never
 * reads as a template.
 */
type Chapter = {
  n: string;
  title: string;
  body: string;
  media: StaticImageData;
  alt: string;
};

export function PowerChapters() {
  const t = useTranslations("landing");

  const chapters: Chapter[] = [
    {
      n: "01",
      title: t("powerEnergyTitle"),
      body: t("powerEnergyDesc"),
      media: chapterEnergy,
      alt: "An electricity bill annotated by hand with monthly kWh readings",
    },
    {
      n: "02",
      title: t("powerBenchmarkTitle"),
      body: t("powerBenchmarkDesc"),
      media: chapterBenchmark,
      alt: "Two printed bar charts laid side by side for comparison",
    },
    {
      n: "03",
      title: t("powerComplianceTitle"),
      body: t("powerComplianceDesc"),
      media: chapterCompliance,
      alt: "Bound compliance reports with a tabbed page and a date stamp",
    },
    {
      n: "04",
      title: t("powerIntegrationsTitle"),
      body: t("powerIntegrationsDesc"),
      media: chapterIntegrations,
      alt: "An open card-index drawer with records linked by a single thread",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Section head - kept short so the chapters carry the weight */}
      <div className="max-w-3xl">
        <h2 className="font-[family-name:var(--editorial-serif)] text-[2.4rem] leading-[1.02] tracking-[-0.025em] sm:text-[3.5rem]">
          {t("powerTitleA")}{" "}
          <span className="italic text-muted-foreground">{t("powerTitleMid")}</span>{" "}
          <span className="italic text-muted-foreground">{t("powerTitleB")}</span>
        </h2>
        <p className="mt-6 max-w-xl font-[family-name:var(--editorial-serif)] text-[19px] italic leading-[1.45] text-foreground/70 sm:text-[22px]">
          {t("powerSubtitle")}
        </p>
      </div>

      <div className="mt-14 sm:mt-20">
        {chapters.map((c, i) => {
          const flipped = i % 2 === 1;
          return (
            <article
              key={c.n}
              className="grid grid-cols-1 items-center gap-8 border-t border-border/60 py-10 sm:gap-12 sm:py-14 md:grid-cols-12 md:gap-14 lg:py-16"
            >
              {/* Media */}
              <div
                className={[
                  "relative overflow-hidden rounded-md border border-border/50 bg-muted/30",
                  "md:col-span-7",
                  flipped ? "md:order-2 md:col-start-6" : "md:order-1",
                ].join(" ")}
              >
                <Image
                  src={c.media}
                  alt={c.alt}
                  width={1408}
                  height={1008}
                  loading="lazy"
                  sizes="(min-width: 768px) 58vw, 100vw"
                  className="h-auto w-full object-cover"
                />
              </div>

              {/* Copy */}
              <div
                className={[
                  "min-w-0 md:col-span-5",
                  flipped ? "md:order-1 md:col-start-1 md:row-start-1" : "md:order-2",
                ].join(" ")}
              >
                <span
                  aria-hidden
                  className="block font-[family-name:var(--editorial-serif)] text-[2.75rem] italic leading-none tracking-[-0.03em] text-foreground/25 sm:text-[3.5rem]"
                >
                  {c.n}
                </span>
                <h3 className="mt-4 font-[family-name:var(--editorial-serif)] text-[26px] leading-[1.12] tracking-[-0.02em] text-foreground sm:text-[34px]">
                  {c.title}
                </h3>
                <p className="mt-4 text-[16.5px] leading-[1.6] text-foreground/70 sm:text-[17.5px]">
                  {c.body}
                </p>
              </div>
            </article>
          );
        })}
        <div className="border-t border-border/60" />
      </div>
    </section>
  );
}

export default PowerChapters;
