"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { PricingTable } from "@/components/billing/PricingTable";
import { LearnLinksSection } from "@/components/learn/LearnLinksSection";
import heroPhoto from "@/assets/hub-pricing-colonnade.jpg";

const ACCENT_BUTTON =
  "inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full bg-[var(--accent-lime)] px-6 text-[15px] font-semibold tracking-[-0.01em] text-[var(--accent-lime-foreground)] shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--accent-lime)_55%,transparent)] transition-transform hover:scale-[1.02]";

export default function PricingPage() {
  const t = useTranslations("pricing");
  const locale = (useLocale() as "en" | "el") ?? "en";
  const el = locale === "el";

  const facts: [string, string][] = [
    [el ? "Νόμισμα" : "Currency", el ? "EUR, τιμολόγηση Κύπρου" : "EUR, Cyprus billing"],
    [el ? "ΦΠΑ" : "VAT", el ? "19% περιλαμβάνεται στις τιμές" : "19% included in shown prices"],
    [el ? "Δέσμευση" : "Commitment", el ? "Μηνιαία, ακύρωση ανά πάσα στιγμή" : "Monthly, cancel anytime"],
    [el ? "Δεδομένα" : "Data", el ? "Φιλοξενία στην ΕΕ" : "Hosted in the EU"],
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-[var(--accent-lime)] selection:text-black">
      <MarketingHeader />

      {/* ------------------------------------------------------------- Hero */}
      <section className="relative isolate flex min-h-[76svh] w-full flex-col overflow-hidden sm:min-h-[70svh]">
        <div className="absolute inset-0 -z-10">
          <Image
            src={heroPhoto}
            alt="Limestone colonnade in low Mediterranean sunlight"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[60%_center] sm:object-center"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-black/80 via-black/35 to-transparent md:block" />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-16 pt-28 text-center sm:px-8 sm:pb-20 sm:pt-36 md:justify-end md:text-left">
          <div className="mx-auto w-full max-w-3xl md:mx-0">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/75">
              {el ? "Τιμολόγηση" : "Pricing"}
            </p>
            <h1
              className="mt-5 font-[family-name:var(--editorial-display)] text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.025em] text-white sm:text-[4rem]"
              style={{ textWrap: "balance" }}
            >
              {t("titleA")} <span className="font-normal italic text-white/85">{t("titleB")}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[16.5px] font-medium leading-[1.6] text-white/85 sm:text-[18px] md:mx-0">
              {t("subtitle")}
            </p>
            <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center md:justify-start">
              <a href="#plans" className={ACCENT_BUTTON}>
                {el ? "Δείτε τα πακέτα" : "See the plans"}
              </a>
              <a
                href="#faq"
                className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-white/30 px-6 text-[15px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
              >
                {el ? "Συχνές ερωτήσεις" : "Questions"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- Fact ledger */}
      <section className="border-b border-border/60">
        <dl className="mx-auto grid max-w-6xl grid-cols-1 gap-px bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label} className="bg-background px-5 py-7 sm:px-7">
              <dt className="text-[13px] font-semibold uppercase tracking-[0.1em] text-foreground/60">{label}</dt>
              <dd className="mt-2 font-[family-name:var(--editorial-display)] text-[21px] font-semibold leading-[1.2] tracking-[-0.02em] sm:text-[24px]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------------------ Plans */}
      <section id="plans" className="scroll-mt-24 px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="mb-10 max-w-2xl text-[15px] leading-[1.6] text-foreground/65 sm:mb-14">
            {t("vatNoticeCY")}
          </p>
          <PricingTable />
        </div>
      </section>

      {/* -------------------------------------------------------------- FAQ */}
      <section id="faq" className="scroll-mt-24 border-t border-border/60 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-12 md:gap-14">
          <div className="md:col-span-5">
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-foreground/60">
              {t("faqSubtitle")}
            </p>
            <h2 className="mt-4 font-[family-name:var(--editorial-display)] text-[2rem] font-semibold leading-[1.06] tracking-[-0.025em] sm:text-[2.8rem]">
              {t("faqTitleA")}{" "}
              <span className="font-normal italic text-foreground/60">{t("faqTitleB")}</span>
            </h2>
          </div>

          <div className="md:col-span-7">
            <ul className="border-t border-border/60">
              {([1, 2, 3, 4, 5] as const).map((i) => (
                <li key={i} className="border-b border-border/60">
                  <details className="group py-6 sm:py-7">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
                      <div className="flex min-w-0 items-baseline gap-5 sm:gap-7">
                        <span
                          aria-hidden
                          className="shrink-0 font-[family-name:var(--editorial-display)] text-[1.15rem] italic leading-none tracking-[-0.03em] text-foreground/30 sm:text-[1.4rem]"
                        >
                          {String(i).padStart(2, "0")}
                        </span>
                        <h3 className="font-[family-name:var(--editorial-display)] text-[1.15rem] font-semibold leading-[1.22] tracking-[-0.02em] sm:text-[1.4rem]">
                          {t(`faq.q${i}` as `faq.q${typeof i}`)}
                        </h3>
                      </div>
                      <span
                        aria-hidden
                        className="mt-1 shrink-0 text-[18px] leading-none text-foreground/40 transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-4 max-w-2xl pl-[2.6rem] text-[15.5px] leading-[1.65] text-foreground/70 sm:pl-[3.2rem]">
                      {t(`faq.a${i}` as `faq.a${typeof i}`)}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 sm:py-24 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <h2 className="font-[family-name:var(--editorial-display)] text-[2rem] font-semibold leading-[1.06] tracking-[-0.025em] sm:text-[2.9rem]">
              {t("ctaTitleA")}{" "}
              <span className="font-normal italic text-foreground/60">{t("ctaTitleB")}</span>
            </h2>
            <p className="mt-5 max-w-xl text-[16.5px] leading-[1.62] text-foreground/70">{t("ctaSubtitle")}</p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row md:col-span-5 md:justify-end">
            <Link href="/auth" className={ACCENT_BUTTON}>
              {t("ctaButton")}
            </Link>
            <Link
              href="/tools"
              className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-foreground/25 px-6 text-[15px] font-semibold text-foreground transition-colors hover:border-foreground"
            >
              {el ? "Δείτε τα εργαλεία" : "See the tools"}
            </Link>
          </div>
        </div>
      </section>

      <LearnLinksSection />
    </div>
  );
}
