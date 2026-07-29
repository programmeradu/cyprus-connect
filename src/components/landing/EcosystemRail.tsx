"use client";

import { useTranslations } from "next-intl";
import ecoLearning from "@/assets/eco-01-learning.jpg";
import ecoMarketplace from "@/assets/eco-02-marketplace.jpg";
import ecoVisuals from "@/assets/eco-03-visuals.jpg";
import ecoLeaderboard from "@/assets/eco-04-leaderboard.jpg";

/**
 * Beyond Tracking - full-bleed editorial rail.
 * Four modules read as plates in a catalogue: image, hairline rule, serif
 * numeral, title, body. Horizontal scroll-snap on mobile, four columns on
 * desktop. No cards, no pills, no icons.
 */
export function EcosystemRail() {
  const t = useTranslations("landing");

  const items = [
    { n: "01", title: t("ecoLearningTitle"), body: t("ecoLearningDesc"), img: ecoLearning.src, alt: "Annotated sustainability training workbook on a limestone desk" },
    { n: "02", title: t("ecoMarketplaceTitle"), body: t("ecoMarketplaceDesc"), img: ecoMarketplace.src, alt: "Tree saplings beside a verified carbon credit certificate" },
    { n: "03", title: t("ecoStudioTitle"), body: t("ecoStudioDesc"), img: ecoVisuals.src, alt: "Printed sustainability report spreads with colour swatch strips" },
    { n: "04", title: t("ecoLeaderboardTitle"), body: t("ecoLeaderboardDesc"), img: ecoLeaderboard.src, alt: "Printed ranking table with a brass ruler marking one row" },
  ];

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-12 sm:items-end sm:gap-12">
          <h2 className="sm:col-span-6 font-[family-name:var(--editorial-serif)] text-[2.4rem] leading-[1.02] tracking-[-0.025em] sm:text-[3.5rem]">
            {t("beyondTitleA")}{" "}
            <span className="italic text-muted-foreground">{t("beyondTitleB")}</span>
          </h2>
          <p className="sm:col-span-6 max-w-md text-[16.5px] leading-[1.6] text-foreground/70 sm:text-[17.5px]">
            {t("beyondSubtitle")}
          </p>
        </div>
      </div>

      <div className="mt-12 sm:mt-16">
        <SnapRail
          count={items.length}
          gridClassName="sm:mx-auto sm:max-w-6xl sm:grid sm:grid-cols-4 sm:gap-x-8 sm:gap-y-0 sm:overflow-visible sm:px-6 sm:pb-0"
        >

          {items.map((it) => (
            <li
              key={it.n}
              className="w-[78vw] max-w-[320px] shrink-0 snap-start sm:w-auto sm:max-w-none"
            >
              <div className="overflow-hidden rounded-sm bg-muted/30">
                <img
                  src={it.img}
                  alt={it.alt}
                  width={1200}
                  height={912}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                />
              </div>
              <div className="mt-5 flex items-baseline gap-3 border-t border-border/60 pt-4">
                <span className="font-[family-name:var(--editorial-serif)] text-[20px] italic tabular-nums text-foreground/45">
                  {it.n}
                </span>
                <h3 className="min-w-0 font-[family-name:var(--editorial-serif)] text-[21px] leading-[1.15] tracking-[-0.015em] sm:text-[23px]">
                  {it.title}
                </h3>
              </div>
              <p className="mt-3 text-[15.5px] leading-[1.55] text-foreground/65 sm:text-[16px]">
                {it.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
