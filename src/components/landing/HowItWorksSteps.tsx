"use client";

import { useTranslations } from "next-intl";
import stepConnect from "@/assets/step-01-connect.jpg";
import stepAnalyze from "@/assets/step-02-analyze.jpg";
import stepAct from "@/assets/step-03-act.jpg";

/**
 * How It Works - staggered three-step sequence.
 * Portrait plates step down the page on desktop, joined by a hairline
 * baseline rule. Large serif numerals carry the order. No icons, no pills.
 */
export function HowItWorksSteps() {
  const t = useTranslations("landing");

  const steps = [
    { n: "1", title: t("stepConnectTitle"), body: t("stepConnectDesc"), img: stepConnect.src, alt: "Utility bill and accounting ledger beside a laptop with a connected cable", offset: "lg:mt-0" },
    { n: "2", title: t("stepAnalyzeTitle"), body: t("stepAnalyzeDesc"), img: stepAnalyze.src, alt: "Printed trend charts with pencil annotations under a magnifying loupe", offset: "lg:mt-16" },
    { n: "3", title: t("stepActionTitle"), body: t("stepActionDesc"), img: stepAct.src, alt: "Bound sustainability report with a signed checklist and fountain pen", offset: "lg:mt-32" },
  ];

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <h2 className="font-[family-name:var(--editorial-serif)] text-[2.4rem] leading-[1.02] tracking-[-0.025em] sm:text-[3.5rem]">
          {t("howTitleA")}{" "}
          <span className="italic text-muted-foreground">{t("howTitleB")}</span>
        </h2>
        <p className="mt-6 max-w-md text-[16.5px] leading-[1.6] text-foreground/70 sm:text-[17.5px]">
          {t("howSubtitle")}
        </p>
      </div>

      <div className="-mx-4 mt-12 sm:mx-0 sm:mt-16">
        <SnapRail
          as="ol"
          count={steps.length}
          gridClassName="sm:grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-12 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 lg:gap-x-12"
        >
          {steps.map((s) => (
            <li
              key={s.n}
              className={`w-[80vw] max-w-[330px] shrink-0 snap-start sm:w-auto sm:max-w-none ${s.offset}`}
            >
              <div className="flex items-end gap-4 border-b border-border/60 pb-4">

              <span className="font-[family-name:var(--editorial-serif)] text-[52px] italic leading-[0.8] tabular-nums text-foreground/30 sm:text-[64px]">
                {s.n}
              </span>
              <h3 className="min-w-0 pb-1 font-[family-name:var(--editorial-serif)] text-[22px] leading-[1.15] tracking-[-0.015em] sm:text-[25px]">
                {s.title}
              </h3>
            </div>
            <div className="mt-6 overflow-hidden rounded-sm bg-muted/30">
              <img
                src={s.img}
                alt={s.alt}
                width={1200}
                height={1504}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
              />
            </div>
            <p className="mt-6 text-[16px] leading-[1.55] text-foreground/65 sm:text-[16.5px]">
              {s.body}
            </p>
            </li>
          ))}
        </SnapRail>
      </div>

    </section>
  );
}
