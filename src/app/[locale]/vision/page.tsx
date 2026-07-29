"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { LearnLinksSection } from "@/components/learn/LearnLinksSection";
import heroPhoto from "@/assets/vision-hero-photography.png";
import portPhoto from "@/assets/vision-limassol-port.png";
import hotelPhoto from "@/assets/vision-boutique-hotel.png";
import officePhoto from "@/assets/vision-cyprus-office.png";
import ctaDawnPhoto from "@/assets/section-cta-dawn.jpg";
import testimonialBranch from "@/assets/testimonial-impact-curve.png";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";

export default function VisionPage() {
  const tV = useTranslations("vision");
  const tNav = useTranslations("nav");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    org: "",
    segment: "importer",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-[var(--accent-lime)] selection:text-black">
      {/* Ambient background pattern */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35] dark:opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% 20%, color-mix(in oklab, var(--foreground) 4%, transparent), transparent 60%),
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'><g fill='none' stroke='%23000' stroke-width='0.5' stroke-opacity='0.06'><path d='M0 120 Q150 60 300 120 T600 120'/><path d='M0 200 Q150 140 300 200 T600 200'/><path d='M0 280 Q150 220 300 280 T600 280'/><path d='M0 360 Q150 300 300 360 T600 360'/><path d='M0 440 Q150 380 300 440 T600 440'/><path d='M0 520 Q150 460 300 520 T600 520'/></g></svg>")
          `,
          backgroundSize: "auto, 600px 600px",
          backgroundRepeat: "no-repeat, repeat",
        }}
      />

      <MarketingHeader />

      {/* Hero Cinematic Photographic Backdrop */}
      <section className="relative isolate flex min-h-[90svh] w-full flex-col overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src={heroPhoto}
            alt="Oreites Cyprus wind turbines at golden hour dusk"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Top scrim for header readability */}
          <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/55 to-transparent" />
          {/* Readability wash */}
          <div className="absolute inset-0 hidden bg-gradient-to-r from-black/75 via-black/35 to-transparent md:block" />
          <div className="absolute inset-0 bg-black/55 md:hidden" />
          {/* Multi-stop bottom seam fade */}
          <div
            className="absolute inset-x-0 bottom-0 h-64"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, transparent 0%, color-mix(in oklab, var(--background) 25%, transparent) 35%, color-mix(in oklab, var(--background) 65%, transparent) 65%, var(--background) 100%)",
            }}
          />
          {/* Subtle noise grain */}
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

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-16 pt-32 sm:px-8 sm:pb-24 sm:pt-40">
          <div className="max-w-3xl text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md mb-6">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent-lime)]" />
              <span>{tV("badge")}</span>
            </div>

            <h1
              className="font-[family-name:var(--editorial-sans)] font-semibold text-[2.5rem] leading-[0.98] tracking-[-0.03em] sm:text-[4.5rem] text-white"
              style={{ textWrap: "balance" }}
            >
              {tV("heroTitleA")}
              <br />
              <em className="font-[family-name:var(--editorial-serif)] font-normal italic text-white/90">
                {tV("heroTitleB")}
              </em>
            </h1>

            <p className="mt-6 max-w-xl font-[family-name:var(--editorial-serif)] text-[20px] italic leading-[1.45] text-white/85 sm:text-[23px]">
              {tV("heroSubtitle")}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a href="#beta-signup">
                <PremiumButton size="lg">
                  {tV("ctaBeta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </PremiumButton>
              </a>
              <a href="#horizon">
                <button
                  className="h-12 px-7 rounded-full border border-white/25 bg-black/30 hover:bg-white/10 text-white text-sm font-medium transition-colors backdrop-blur-md"
                  style={{ fontFamily: "var(--editorial-sans)" }}
                >
                  {tV("ctaExplore")}
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* SECTION 01 — 12-Month & 3-Year Strategic Horizons */}
      <section id="horizon" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-10 sm:grid-cols-12 sm:gap-12">
          <div className="sm:col-span-5">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">01 / Strategic Roadmap</span>
            <h2 className="mt-3 font-[family-name:var(--editorial-serif)] text-[2.4rem] leading-[1.02] tracking-[-0.025em] sm:text-[3.5rem]">
              {tV("horizonTitleA")}
              <br />
              <span className="italic text-muted-foreground">{tV("horizonTitleB")}</span>
            </h2>
            <p className="mt-6 max-w-md font-[family-name:var(--editorial-serif)] text-[19px] italic leading-[1.45] text-foreground/70 sm:text-[22px]">
              {tV("horizonSubtitle")}
            </p>
          </div>

          <div className="sm:col-span-7">
            <div className="mb-8 overflow-hidden rounded-md border border-border/60 bg-muted/30">
              <Image
                src={hotelPhoto}
                alt="Paphos Cyprus boutique hotel at sunrise"
                width={1600}
                height={1008}
                loading="lazy"
                className="h-auto w-full object-cover"
              />
            </div>

            <NumberedList
              items={[
                { n: "01", title: tV("q1Title"), body: tV("q1Desc") },
                { n: "02", title: tV("q2Title"), body: tV("q2Desc") },
                { n: "03", title: tV("q3Title"), body: tV("q3Desc") },
                { n: "04", title: tV("q4Title"), body: tV("q4Desc") },
              ]}
            />

            <div className="mt-8 rounded-lg border border-border/60 bg-muted/20 p-6 sm:p-8">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                3-Year Horizon
              </span>
              <h3 className="font-[family-name:var(--editorial-serif)] text-2xl sm:text-3xl mt-2 mb-2">
                {tV("horizon3YrTitle")}
              </h3>
              <p className="font-[family-name:var(--editorial-serif)] text-lg italic text-foreground/75 leading-relaxed">
                {tV("horizon3YrDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* SECTION 02 — The 20 Agentic Fusion Plays */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-10 sm:grid-cols-12 sm:gap-12">
          <div className="sm:col-span-5">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">02 / Agentic Architecture</span>
            <h2 className="mt-3 font-[family-name:var(--editorial-serif)] text-[2.4rem] leading-[1.02] tracking-[-0.025em] sm:text-[3.5rem]">
              {tV("fusionsTitleA")}
              <br />
              <span className="italic text-muted-foreground">{tV("fusionsTitleB")}</span>
            </h2>
            <p className="mt-6 max-w-md font-[family-name:var(--editorial-serif)] text-[19px] italic leading-[1.45] text-foreground/70 sm:text-[22px]">
              {tV("fusionsSubtitle")}
            </p>
          </div>

          <div className="sm:col-span-7">
            <div className="mb-8 overflow-hidden rounded-md border border-border/60 bg-muted/30">
              <Image
                src={portPhoto}
                alt="Limassol Cyprus port container terminal at blue hour"
                width={1600}
                height={1008}
                loading="lazy"
                className="h-auto w-full object-cover"
              />
            </div>

            <NumberedList
              items={[
                { n: "01", title: tV("fusion1Title"), body: tV("fusion1Desc") },
                { n: "02", title: tV("fusion2Title"), body: tV("fusion2Desc") },
                { n: "03", title: tV("fusion3Title"), body: tV("fusion3Desc") },
                { n: "04", title: tV("fusion4Title"), body: tV("fusion4Desc") },
                { n: "05", title: tV("fusion5Title"), body: tV("fusion5Desc") },
                { n: "06", title: tV("fusion6Title"), body: tV("fusion6Desc") },
              ]}
            />
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* SECTION 03 — Operational Transparency & Capabilities Matrix */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-10 sm:grid-cols-12 sm:gap-12">
          <div className="sm:col-span-5">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">03 / Capabilities Matrix</span>
            <h2 className="mt-3 font-[family-name:var(--editorial-serif)] text-[2.4rem] leading-[1.02] tracking-[-0.025em] sm:text-[3.5rem]">
              {tV("matrixTitleA")}
              <br />
              <span className="italic text-muted-foreground">{tV("matrixTitleB")}</span>
            </h2>
            <p className="mt-6 max-w-md font-[family-name:var(--editorial-serif)] text-[19px] italic leading-[1.45] text-foreground/70 sm:text-[22px]">
              {tV("matrixSubtitle")}
            </p>
          </div>

          <div className="sm:col-span-7">
            <div className="mb-8 overflow-hidden rounded-md border border-border/60 bg-muted/30">
              <Image
                src={officePhoto}
                alt="Modern glass commercial office building in Nicosia Cyprus"
                width={1600}
                height={1008}
                loading="lazy"
                className="h-auto w-full object-cover"
              />
            </div>

            <div className="divide-y divide-border/60 border-y border-border/60 font-[family-name:var(--editorial-sans)]">
              <div className="py-3 flex items-center justify-between text-xs font-mono uppercase text-muted-foreground tracking-wider">
                <span>Module / Capability</span>
                <span>Status</span>
              </div>

              <MatrixRow name="Scope 1, 2, 3 GHG Emissions Calculator" pillar="Measure" tag={tV("tagShipped")} active />
              <MatrixRow name="Cyprus EAC Grid Factor (~610 gCO₂/kWh) Calibration" pillar="Measure" tag={tV("tagShipped")} active />
              <MatrixRow name="EAC PDF Bill Ingestion (OCR & Vision AI)" pillar="Measure" tag={tV("tagShipped")} active />
              <MatrixRow name="VSME Report Builder & EFRAG Modules" pillar="Report" tag={tV("tagShipped")} active />
              <MatrixRow name="EU Taxonomy & Double Materiality Matrix" pillar="Report" tag={tV("tagShipped")} active />
              <MatrixRow name="AI Automated Learning Platform & Signed Certificates (/learn)" pillar="Learn" tag={tV("tagShipped")} active />
              <MatrixRow name="CBAM Customs Ingest & XML Generator (CBAM Autopilot)" pillar="Compliance" tag={tV("tagBeta")} highlight />
              <MatrixRow name="EAC Tariff Switching & CERA Mis-Classification Advisor" pillar="Reduce" tag={tV("tagBeta")} highlight />
              <MatrixRow name="SoftOne & Epsilon Net Direct Read Connectors" pillar="Integrations" tag={tV("tagRoadmap")} />
              <MatrixRow name="Bank of Cyprus & Hellenic PSD2 Account Feeds" pillar="Integrations" tag={tV("tagRoadmap")} />
              <MatrixRow name="WhatsApp Cyprus Supplier Data Collection Swarm" pillar="Scope 3" tag={tV("tagRoadmap")} />
              <MatrixRow name="Cyprus SME Sustainability Index & Benchmarking Portal" pillar="Analytics" tag={tV("tagFuture")} />
              <MatrixRow name="Regulatory Horizon Scanner & Auto Impact Translator" pillar="Comply" tag={tV("tagFuture")} />
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* SECTION 04 — Early Access Beta Registration CTA */}
      <section id="beta-signup" className="relative overflow-hidden">
        {/* Backdrop */}
        <div className="pointer-events-none absolute inset-0">
          <Image
            src={ctaDawnPhoto}
            alt="Cyprus landscape dawn"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40 dark:from-background dark:via-background/95 dark:to-background/50" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-24 sm:px-6 sm:py-36">
          <h2 className="font-[family-name:var(--editorial-serif)] text-[2.6rem] leading-[1.02] tracking-[-0.025em] sm:text-[4.2rem]">
            {tV("waitlistTitleA")} <span className="italic text-muted-foreground">{tV("waitlistTitleB")}</span>
          </h2>
          <p className="mt-6 max-w-xl font-[family-name:var(--editorial-serif)] text-[20px] italic leading-[1.45] text-foreground/80 sm:text-[24px]">
            {tV("waitlistSubtitle")}
          </p>

          <div className="mt-10 max-w-xl">
            {submitted ? (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <p className="text-sm font-[family-name:var(--editorial-sans)]">{tV("waitlistSuccess")}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder={tV("waitlistNamePh")}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-md border border-border/80 bg-background/80 px-4 py-3 text-sm outline-none focus:border-foreground transition-colors backdrop-blur-md"
                  />
                  <input
                    type="email"
                    required
                    placeholder={tV("waitlistEmailPh")}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-md border border-border/80 bg-background/80 px-4 py-3 text-sm outline-none focus:border-foreground transition-colors backdrop-blur-md"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder={tV("waitlistOrgPh")}
                    value={formData.org}
                    onChange={(e) => setFormData({ ...formData, org: e.target.value })}
                    className="w-full rounded-md border border-border/80 bg-background/80 px-4 py-3 text-sm outline-none focus:border-foreground transition-colors backdrop-blur-md"
                  />
                  <select
                    value={formData.segment}
                    onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                    className="w-full rounded-md border border-border/80 bg-background/80 px-4 py-3 text-sm outline-none focus:border-foreground transition-colors backdrop-blur-md"
                  >
                    <option value="importer">CBAM Importer / Exporter</option>
                    <option value="hotel">Hospitality & Tourism</option>
                    <option value="shipping">Limassol Shipping Operator</option>
                    <option value="accountant">Accountant / Audit Practice</option>
                    <option value="other">Other SME</option>
                  </select>
                </div>

                <div className="pt-2">
                  <PremiumButton type="submit" size="lg" className="w-full sm:w-auto text-[14px]">
                    {tV("waitlistSubmit")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </PremiumButton>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* LEARN LINKS */}
      <LearnLinksSection />
    </div>
  );
}

/* ---------- Editorial primitives ---------- */

function SectionDivider() {
  return <div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="h-px w-full bg-border/60" /></div>;
}

function NumberedList({ items }: { items: { n: string; title: string; body: string }[] }) {
  return (
    <ul className="divide-y divide-border/60 border-y border-border/60 font-[family-name:var(--editorial-sans)]">
      {items.map((it) => (
        <li key={it.n} className="group py-6 transition-colors hover:bg-muted/10">
          <div className="flex items-baseline gap-4 sm:gap-6">
            <span className="text-[13px] font-mono font-medium text-foreground/50 tracking-wider">
              {it.n} <span className="text-border">/</span>
            </span>
            <div className="flex-1">
              <h3 className="text-[19px] font-semibold tracking-[-0.01em] text-foreground sm:text-[21px]">
                {it.title}
              </h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-foreground/70 sm:text-[15.5px]">
                {it.body}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function MatrixRow({ name, pillar, tag, active, highlight }: { name: string; pillar: string; tag: string; active?: boolean; highlight?: boolean }) {
  return (
    <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <span className="text-[15px] font-medium text-foreground">{name}</span>
        <span className="ml-3 text-xs font-mono text-muted-foreground font-normal">[{pillar}]</span>
      </div>
      <div className="shrink-0">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-tight ${
          active 
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
            : highlight 
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            : "bg-muted text-muted-foreground border border-border/60"
        }`}>
          {active && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
          {highlight && <Sparkles className="h-3 w-3 text-amber-500" />}
          {tag}
        </span>
      </div>
    </div>
  );
}
