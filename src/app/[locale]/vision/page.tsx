"use client";

import { useMemo, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { useTranslations } from "next-intl";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { LearnLinksSection } from "@/components/learn/LearnLinksSection";
import heroPhoto from "@/assets/vision-hero-photography.png";
import portPhoto from "@/assets/vision-limassol-port.png";
import hotelPhoto from "@/assets/vision-boutique-hotel.png";
import officePhoto from "@/assets/vision-cyprus-office.png";
import bentoSolar from "@/assets/vision-bento-solar.png";
import bentoShipping from "@/assets/vision-bento-shipping.png";
import bentoAudit from "@/assets/vision-bento-audit.png";
import bentoGrid from "@/assets/vision-bento-grid.png";
import ctaDawnPhoto from "@/assets/section-cta-dawn.jpg";

/**
 * /vision - the public strategy document.
 *
 * House rules respected: Fraunces display + Instrument Sans body only (no
 * mono, no thin weights), no decorative icons, no pill badges, no colour
 * chips, hairline rules and numerals for hierarchy, context photography only.
 */

const ACCENT_BUTTON =
  "inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full bg-[var(--accent-lime)] px-6 text-[15px] font-semibold tracking-[-0.01em] text-[var(--accent-lime-foreground)] shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--accent-lime)_55%,transparent)] transition-transform hover:scale-[1.02]";

type Row = {
  feature: string;
  category: string;
  status: "tagShipped" | "tagBeta" | "tagRoadmap" | "tagFuture";
  metric: string;
};

const REGISTER: Row[] = [
  { feature: "Scope 1, 2 and 3 emissions calculator", category: "Measure", status: "tagShipped", metric: "Cyprus baseline" },
  { feature: "EAC grid factor calibration, 610 gCO₂ per kWh", category: "Measure", status: "tagShipped", metric: "CERA regulated" },
  { feature: "EAC bill reading from PDF", category: "Measure", status: "tagShipped", metric: "Six second ingest" },
  { feature: "VSME report builder", category: "Report", status: "tagShipped", metric: "EFRAG standard" },
  { feature: "EU Taxonomy check and double materiality matrix", category: "Report", status: "tagShipped", metric: "Audit ready" },
  { feature: "Course generation and signed certificates", category: "Learn", status: "tagShipped", metric: "Verifiable record" },
  { feature: "CBAM declaration and XML export", category: "Comply", status: "tagBeta", metric: "EU registry XML" },
  { feature: "EAC tariff switch and CERA classification advice", category: "Reduce", status: "tagBeta", metric: "€200 to €1,200 saved" },
  { feature: "SoftOne and Epsilon Net read connectors", category: "Integrations", status: "tagRoadmap", metric: "SOAP and REST" },
  { feature: "Bank of Cyprus and Hellenic Bank account feeds", category: "Integrations", status: "tagRoadmap", metric: "PSD2 access" },
  { feature: "WhatsApp supplier data collection", category: "Integrations", status: "tagRoadmap", metric: "Greek and English" },
  { feature: "Cyprus SME Sustainability Index", category: "Analytics", status: "tagFuture", metric: "Quarterly benchmark" },
  { feature: "Regulatory horizon scanner", category: "Comply", status: "tagFuture", metric: "Official Journal sync" },
];

const CATEGORIES = ["All", "Measure", "Report", "Reduce", "Learn", "Comply", "Integrations", "Analytics"];

export default function VisionPage() {
  const t = useTranslations("vision");

  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ name: "", email: "", org: "", segment: "importer" });
  const [submitted, setSubmitted] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REGISTER.filter(
      (r) =>
        (category === "All" || r.category === category) &&
        (q === "" || r.feature.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) || r.metric.toLowerCase().includes(q)),
    );
  }, [category, query]);

  const quarters = [
    { n: "01", title: t("q1Title"), body: t("q1Desc"), media: officePhoto, alt: "A Nicosia office desk with a printed reporting checklist" },
    { n: "02", title: t("q2Title"), body: t("q2Desc"), media: bentoGrid, alt: "Transmission lines across a dry Cyprus landscape" },
    { n: "03", title: t("q3Title"), body: t("q3Desc"), media: hotelPhoto, alt: "A Paphos boutique hotel courtyard at sunrise" },
    { n: "04", title: t("q4Title"), body: t("q4Desc"), media: bentoAudit, alt: "A bound audit file open on a desk with tabbed pages" },
  ];

  const plays = [
    { n: "01", title: t("fusion1Title"), body: t("fusion1Desc"), meta: t("fusion1Meta") },
    { n: "02", title: t("fusion2Title"), body: t("fusion2Desc"), meta: t("fusion2Meta") },
    { n: "03", title: t("fusion3Title"), body: t("fusion3Desc"), meta: t("fusion3Meta") },
    { n: "04", title: t("fusion4Title"), body: t("fusion4Desc"), meta: t("fusion4Meta") },
    { n: "05", title: t("fusion5Title"), body: t("fusion5Desc"), meta: t("fusion5Meta") },
  ];


  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-[var(--accent-lime)] selection:text-black">
      <MarketingHeader />

      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={heroPhoto}
            alt="Wind turbines above the Oreites plateau in Cyprus at golden hour"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[62%_center] sm:object-center"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/55 to-transparent" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-black/75 via-black/35 to-transparent md:block" />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
              backgroundSize: "240px 240px",
            }}
          />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-16 pt-28 text-center sm:px-8 sm:pb-24 sm:pt-36 md:justify-end md:text-left">
          <div className="mx-auto w-full max-w-3xl md:mx-0">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/75">{t("badge")}</p>

            <h1
              className="mt-5 font-[family-name:var(--editorial-display)] text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.025em] text-white sm:text-[4.1rem]"
              style={{ textWrap: "balance" }}
            >
              {t("heroTitleA")}{" "}
              <span className="italic font-normal text-white/85">{t("heroTitleB")}</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-[16.5px] font-medium leading-[1.6] text-white/85 sm:text-[18px] md:mx-0">
              {t("heroSubtitle")}
            </p>

            <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center md:justify-start">
              <a href="#early-access" className={ACCENT_BUTTON}>
                {t("ctaBeta")}
              </a>
              <a
                href="#position"
                className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-white/30 px-6 text-[15px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
              >
                {t("ctaExplore")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Fact ledger */}
      <section className="border-b border-border/60">
        <dl className="mx-auto grid max-w-6xl grid-cols-1 gap-px bg-border/60 px-0 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [t("statGridLabel"), t("statGridValue")],
            [t("statCbamLabel"), t("statCbamValue")],
            [t("statScopeLabel"), t("statScopeValue")],
            [t("statLangLabel"), t("statLangValue")],
          ].map(([label, value]) => (
            <div key={label} className="bg-background px-5 py-7 sm:px-7">
              <dt className="text-[13px] font-semibold uppercase tracking-[0.1em] text-foreground/60">{label}</dt>
              <dd className="mt-2 font-[family-name:var(--editorial-display)] text-[24px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-[27px]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------------ Why Cyprus now */}
      <section id="position" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-10 md:grid-cols-12 md:gap-14">
          <div className="md:col-span-5">
            <h2 className="font-[family-name:var(--editorial-display)] text-[2.3rem] font-semibold leading-[1.04] tracking-[-0.025em] sm:text-[3.2rem]">
              {t("positionTitleA")}{" "}
              <span className="italic font-normal text-muted-foreground">{t("positionTitleB")}</span>
            </h2>
            <p className="mt-6 max-w-md text-[17px] font-medium leading-[1.6] text-foreground/70 sm:text-[18px]">
              {t("positionSubtitle")}
            </p>
            <div className="mt-8 overflow-hidden rounded-md border border-border/50 bg-muted/30">
              <Image
                src={portPhoto}
                alt="Cargo cranes and stacked containers at the port of Limassol"
                width={1408}
                height={1008}
                loading="lazy"
                sizes="(min-width: 768px) 40vw, 100vw"
                className="h-auto w-full object-cover"
              />
            </div>
          </div>

          <ol className="md:col-span-7">
            {[
              { n: "01", title: t("pos1Title"), body: t("pos1Desc") },
              { n: "02", title: t("pos2Title"), body: t("pos2Desc") },
              { n: "03", title: t("pos3Title"), body: t("pos3Desc") },
            ].map((item) => (
              <li key={item.n} className="border-t border-border/60 py-8 first:border-t-0 first:pt-0 sm:py-10">
                <div className="flex items-baseline gap-5 sm:gap-8">
                  <span
                    aria-hidden
                    className="font-[family-name:var(--editorial-display)] text-[1.9rem] italic leading-none tracking-[-0.03em] text-foreground/25 sm:text-[2.4rem]"
                  >
                    {item.n}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-[family-name:var(--editorial-display)] text-[23px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[28px]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[16.5px] leading-[1.62] text-foreground/70 sm:text-[17px]">{item.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------ Roadmap */}
      <section id="roadmap" className="border-t border-border/60 bg-muted/20 scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-3xl">
            <h2 className="font-[family-name:var(--editorial-display)] text-[2.3rem] font-semibold leading-[1.04] tracking-[-0.025em] sm:text-[3.2rem]">
              {t("horizonTitleA")}{" "}
              <span className="italic font-normal text-muted-foreground">{t("horizonTitleB")}</span>
            </h2>
            <p className="mt-6 max-w-xl text-[17px] font-medium leading-[1.6] text-foreground/70 sm:text-[18px]">
              {t("horizonSubtitle")}
            </p>
          </div>

          <div className="mt-12 sm:mt-16">
            {quarters.map((q, i) => {
              const flipped = i % 2 === 1;
              return (
                <article
                  key={q.n}
                  className="grid grid-cols-1 items-center gap-7 border-t border-border/60 py-9 sm:gap-12 sm:py-12 md:grid-cols-12 md:gap-14"
                >
                  <div
                    className={[
                      "relative overflow-hidden rounded-md border border-border/50 bg-background",
                      "md:col-span-6",
                      flipped ? "md:order-2 md:col-start-7" : "md:order-1",
                    ].join(" ")}
                  >
                    <Image
                      src={q.media as StaticImageData}
                      alt={q.alt}
                      width={1408}
                      height={1008}
                      loading="lazy"
                      sizes="(min-width: 768px) 48vw, 100vw"
                      className="h-auto w-full object-cover"
                    />
                  </div>

                  <div className={["min-w-0 md:col-span-6", flipped ? "md:order-1 md:row-start-1" : "md:order-2"].join(" ")}>
                    <span
                      aria-hidden
                      className="block font-[family-name:var(--editorial-display)] text-[2.6rem] italic leading-none tracking-[-0.03em] text-foreground/25 sm:text-[3.2rem]"
                    >
                      {q.n}
                    </span>
                    <h3 className="mt-4 font-[family-name:var(--editorial-display)] text-[25px] font-semibold leading-[1.14] tracking-[-0.02em] sm:text-[31px]">
                      {q.title}
                    </h3>
                    <p className="mt-4 text-[16.5px] leading-[1.62] text-foreground/70 sm:text-[17px]">{q.body}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-12 border-t border-border/60 pt-10 md:grid md:grid-cols-12 md:gap-14">
            <h3 className="font-[family-name:var(--editorial-display)] text-[26px] font-semibold leading-[1.12] tracking-[-0.02em] md:col-span-5 sm:text-[32px]">
              {t("horizon3YrTitle")}
            </h3>
            <p className="mt-4 text-[17px] leading-[1.62] text-foreground/75 md:col-span-7 md:mt-0 sm:text-[18px]">
              {t("horizon3YrDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Agent plays */}
      <section id="plays" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-3xl">
          <h2 className="font-[family-name:var(--editorial-display)] text-[2.3rem] font-semibold leading-[1.04] tracking-[-0.025em] sm:text-[3.2rem]">
            {t("fusionsTitleA")}{" "}
            <span className="italic font-normal text-muted-foreground">{t("fusionsTitleB")}</span>
          </h2>
          <p className="mt-6 max-w-xl text-[17px] font-medium leading-[1.6] text-foreground/70 sm:text-[18px]">
            {t("fusionsSubtitle")}
          </p>
        </div>

        <ol className="mt-12 grid grid-cols-1 gap-px bg-border/60 sm:mt-16 md:grid-cols-2">
          {plays.map((p, i) => (
            <li
              key={p.n}
              className={[
                "flex flex-col bg-background p-6 sm:p-8",
                i === 0 ? "md:col-span-2 md:flex-row md:items-center md:gap-10 lg:gap-14" : "",
              ].join(" ")}
            >
              <div className={i === 0 ? "md:w-1/2" : "flex h-full flex-col"}>
                <span
                  aria-hidden
                  className="block font-[family-name:var(--editorial-display)] text-[1.8rem] italic leading-none tracking-[-0.03em] text-foreground/25"
                >
                  {p.n}
                </span>
                <h3
                  className={[
                    "mt-3 font-[family-name:var(--editorial-display)] font-semibold leading-[1.14] tracking-[-0.02em]",
                    i === 0 ? "text-[26px] sm:text-[34px]" : "text-[22px] sm:text-[25px]",
                  ].join(" ")}
                >
                  {p.title}
                </h3>
                <p className="mt-3 text-[16px] leading-[1.62] text-foreground/70 sm:text-[16.5px]">{p.body}</p>
                <p className="mt-5 border-t border-border/60 pt-4 text-[14.5px] font-semibold leading-[1.5] text-foreground/60">
                  {p.meta}
                </p>
              </div>

              {i === 0 && (
                <div className="mt-6 overflow-hidden rounded-md border border-border/50 bg-muted/30 md:mt-0 md:w-1/2">
                  <Image
                    src={bentoShipping}
                    alt="Container ships and gantry cranes at the port of Limassol at sunrise"
                    width={1408}
                    height={1008}
                    loading="lazy"
                    sizes="(min-width: 768px) 46vw, 100vw"
                    className="h-auto w-full object-cover"
                  />
                </div>
              )}
            </li>
          ))}
        </ol>

      </section>

      {/* ---------------------------------------------------- Build register */}
      <section id="register" className="border-t border-border/60 bg-muted/20 scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-3xl">
            <h2 className="font-[family-name:var(--editorial-display)] text-[2.3rem] font-semibold leading-[1.04] tracking-[-0.025em] sm:text-[3.2rem]">
              {t("matrixTitleA")}{" "}
              <span className="italic font-normal text-muted-foreground">{t("matrixTitleB")}</span>
            </h2>
            <p className="mt-6 max-w-xl text-[17px] font-medium leading-[1.6] text-foreground/70 sm:text-[18px]">
              {t("matrixSubtitle")}
            </p>
          </div>

          {/* Controls */}
          <div className="mt-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-sm">
              <label htmlFor="register-search" className="block text-[13px] font-semibold uppercase tracking-[0.1em] text-foreground/60">
                {t("matrixSearchPh")}
              </label>
              <input
                id="register-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-border bg-background px-4 text-[15px] font-medium text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-foreground"
                placeholder="CBAM, EAC, Scope 3"
              />
            </div>

            <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
              <div className="flex min-w-max items-center gap-2 lg:min-w-0 lg:flex-wrap lg:justify-end">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                    className={[
                      "h-9 rounded-md border px-3.5 text-[14px] font-semibold transition-colors",
                      category === c
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground/70 hover:border-foreground/40 hover:text-foreground",
                    ].join(" ")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Register table */}
          <div className="mt-8 border-t border-border/60">
            <div className="hidden grid-cols-12 gap-6 border-b border-border/60 py-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-foreground/60 md:grid">
              <span className="col-span-6">{t("matrixColCapability")}</span>
              <span className="col-span-3">{t("matrixColMetric")}</span>
              <span className="col-span-3 text-right">{t("matrixColStatus")}</span>
            </div>

            {rows.length === 0 ? (
              <p className="py-10 text-[16px] font-medium text-foreground/70">{t("matrixEmpty")}</p>
            ) : (
              <ul>
                {rows.map((r) => (
                  <li
                    key={r.feature}
                    className="grid grid-cols-1 gap-2 border-b border-border/60 py-5 transition-colors hover:bg-background/70 md:grid-cols-12 md:items-center md:gap-6"
                  >
                    <div className="md:col-span-6">
                      <p className="text-[16.5px] font-semibold leading-[1.4] tracking-[-0.01em] text-foreground">{r.feature}</p>
                      <p className="mt-1 text-[14px] font-medium text-foreground/55 md:hidden">
                        {r.category} · {r.metric}
                      </p>
                      <p className="mt-1 hidden text-[14px] font-medium text-foreground/55 md:block">{r.category}</p>
                    </div>
                    <p className="hidden text-[15px] font-medium tabular-nums text-foreground/70 md:col-span-3 md:block">{r.metric}</p>
                    <p className="text-[14.5px] font-semibold text-foreground md:col-span-3 md:text-right">
                      <span className="inline-block border-b-2 border-[var(--accent-lime)] pb-0.5">{t(r.status)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Early access */}
      <section id="early-access" className="relative scroll-mt-24 overflow-hidden border-t border-border/60">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image src={ctaDawnPhoto} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/45" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28">
          <h2 className="font-[family-name:var(--editorial-display)] text-[2.4rem] font-semibold leading-[1.04] tracking-[-0.025em] sm:text-[3.4rem]">
            {t("waitlistTitleA")}{" "}
            <span className="italic font-normal text-muted-foreground">{t("waitlistTitleB")}</span>
          </h2>
          <p className="mt-5 max-w-xl text-[17px] font-medium leading-[1.6] text-foreground/75 sm:text-[18px]">
            {t("waitlistSubtitle")}
          </p>

          <div className="mt-10 max-w-xl">
            {submitted ? (
              <p className="border-l-2 border-[var(--accent-lime)] bg-background/70 py-4 pl-5 pr-4 text-[16px] font-semibold leading-[1.55] text-foreground">
                {t("waitlistSuccess")}
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (form.email) setSubmitted(true);
                }}
                className="grid grid-cols-1 gap-5 sm:grid-cols-2"
              >
                <Field id="v-name" label={t("waitlistNamePh")}>
                  <input
                    id="v-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={FIELD_CLASS}
                  />
                </Field>
                <Field id="v-email" label={t("waitlistEmailPh")}>
                  <input
                    id="v-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={FIELD_CLASS}
                  />
                </Field>
                <Field id="v-org" label={t("waitlistOrgPh")}>
                  <input
                    id="v-org"
                    required
                    value={form.org}
                    onChange={(e) => setForm({ ...form, org: e.target.value })}
                    className={FIELD_CLASS}
                  />
                </Field>
                <Field id="v-segment" label={t("waitlistSegmentPh")}>
                  <select
                    id="v-segment"
                    value={form.segment}
                    onChange={(e) => setForm({ ...form, segment: e.target.value })}
                    className={FIELD_CLASS}
                  >
                    <option value="importer">{t("segImporter")}</option>
                    <option value="hotel">{t("segHotel")}</option>
                    <option value="shipping">{t("segShipping")}</option>
                    <option value="accountant">{t("segAccountant")}</option>
                    <option value="other">{t("segOther")}</option>
                  </select>
                </Field>

                <div className="sm:col-span-2">
                  <button type="submit" className={`${ACCENT_BUTTON} w-full sm:w-auto`}>
                    {t("waitlistSubmit")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <LearnLinksSection />
    </div>
  );
}

const FIELD_CLASS =
  "h-11 w-full rounded-md border border-border bg-background/85 px-4 text-[15px] font-medium text-foreground outline-none transition-colors focus:border-foreground";

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold uppercase tracking-[0.1em] text-foreground/60">
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
