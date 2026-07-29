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
import bentoSolar from "@/assets/vision-bento-solar.png";
import bentoShipping from "@/assets/vision-bento-shipping.png";
import bentoAudit from "@/assets/vision-bento-audit.png";
import bentoGrid from "@/assets/vision-bento-grid.png";
import ctaDawnPhoto from "@/assets/section-cta-dawn.jpg";

import { 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Search, 
  SlidersHorizontal,
  Zap, 
  Database, 
  Building2, 
  FileCheck, 
  Globe2, 
  Cpu, 
  TrendingDown, 
  ShieldCheck,
  Bot,
  Layers,
  Clock
} from "lucide-react";

export default function VisionPage() {
  const tV = useTranslations("vision");
  const tNav = useTranslations("nav");

  // State management for interactive features
  const [activeTab, setActiveTab] = useState<"roadmap" | "fusions" | "matrix">("roadmap");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
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

  // Matrix items for the interactive audit table
  const matrixItems = [
    { feature: "Scope 1, 2, 3 GHG Emissions Calculator", category: "Measure", status: "tagShipped", metric: "Cyprus Baseline" },
    { feature: "Cyprus EAC Grid Factor (~610 gCO₂/kWh) Calibration", category: "Measure", status: "tagShipped", metric: "CERA Regulated" },
    { feature: "EAC PDF Bill Ingestion (OCR & Vision AI)", category: "Measure", status: "tagShipped", metric: "6s Ingestion" },
    { feature: "VSME (Voluntary SME Standard) Report Builder", category: "Report", status: "tagShipped", metric: "EFRAG Standard" },
    { feature: "EU Taxonomy & Double Materiality Matrix", category: "Report", status: "tagShipped", metric: "Audit Ready" },
    { feature: "AI Automated Learning Platform & Signed Certificates (/learn)", category: "Learn", status: "tagShipped", metric: "Fusion 21 LMS" },
    { feature: "CBAM Customs Declaration & XML Generator (CBAM Autopilot)", category: "Comply", status: "tagBeta", metric: "EU Registry XML" },
    { feature: "EAC Tariff Switching & CERA Mis-Classification Advisor", category: "Reduce", status: "tagBeta", metric: "€200-€1,200 Saved" },
    { feature: "SoftOne & Epsilon Net Direct Read Connectors", category: "Integrations", status: "tagRoadmap", metric: "SOAP / REST" },
    { feature: "Bank of Cyprus & Hellenic PSD2 Account Feeds", category: "Integrations", status: "tagRoadmap", metric: "PSD2 XS2A" },
    { feature: "WhatsApp Cyprus Supplier Data Collection Swarm", category: "Integrations", status: "tagRoadmap", metric: "Greek & English" },
    { feature: "Cyprus SME Sustainability Index & Benchmarking Portal", category: "Analytics", status: "tagFuture", metric: "Quarterly Index" },
    { feature: "Regulatory Horizon Scanner & Auto Impact Translator", category: "Comply", status: "tagFuture", metric: "Official Journal Sync" },
  ];

  const categories = ["All", "Measure", "Report", "Reduce", "Learn", "Comply", "Integrations", "Analytics"];

  const filteredMatrix = matrixItems.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.feature.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusBadge = (statusKey: string) => {
    switch (statusKey) {
      case "tagShipped":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {tV("tagShipped")}</span>;
      case "tagBeta":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20"><Sparkles className="h-3.5 w-3.5 text-amber-500" /> {tV("tagBeta")}</span>;
      case "tagRoadmap":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400 border border-sky-500/20"><Cpu className="h-3.5 w-3.5 text-sky-500" /> {tV("tagRoadmap")}</span>;
      case "tagFuture":
      default:
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20"><Clock className="h-3.5 w-3.5 text-purple-500" /> {tV("tagFuture")}</span>;
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-[var(--accent-lime)] selection:text-black">
      {/* Topographic ambient pattern */}
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

      {/* Hero Cinematic Section */}
      <section className="relative isolate flex min-h-[92svh] w-full flex-col overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src={heroPhoto}
            alt="Oreites Cyprus wind turbines golden hour"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/60 to-transparent" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-black/80 via-black/40 to-transparent md:block" />
          <div className="absolute inset-0 bg-black/60 md:hidden" />
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
              className="font-[family-name:var(--editorial-sans)] font-semibold text-[2.6rem] leading-[0.98] tracking-[-0.03em] sm:text-[4.8rem] text-white"
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
              <a href="#view-selector">
                <button
                  className="h-12 px-7 rounded-full border border-white/25 bg-black/30 hover:bg-white/10 text-white text-sm font-medium transition-colors backdrop-blur-md"
                  style={{ fontFamily: "var(--editorial-sans)" }}
                >
                  {tV("ctaExplore")}
                </button>
              </a>
            </div>
          </div>

          {/* Live Metric Highlights Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/20 pt-6 font-[family-name:var(--editorial-sans)] text-white">
            <div>
              <span className="text-xs uppercase font-mono text-white/60 tracking-wider">Cyprus Grid Intensity</span>
              <p className="text-xl font-semibold text-[var(--accent-lime)]">~610 gCO₂/kWh</p>
            </div>
            <div>
              <span className="text-xs uppercase font-mono text-white/60 tracking-wider">CBAM Definitive Regime</span>
              <p className="text-xl font-semibold text-white">January 2026</p>
            </div>
            <div>
              <span className="text-xs uppercase font-mono text-white/60 tracking-wider">EU Regulatory Mandate</span>
              <p className="text-xl font-semibold text-white">CSRD Wave 2 / 3</p>
            </div>
            <div>
              <span className="text-xs uppercase font-mono text-white/60 tracking-wider">Bilingual Operating Language</span>
              <p className="text-xl font-semibold text-white">English + Ελληνικά</p>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Interactive Selector Bar (Inspired by Framer Templates) */}
      <section id="view-selector" className="mx-auto max-w-6xl px-4 pt-16 pb-6 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-border/60 pb-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Strategic Vision & Architecture</span>
            <h2 className="text-2xl sm:text-3xl font-semibold font-[family-name:var(--editorial-display)] mt-1">
              Explore the Vuneli Roadmap
            </h2>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 rounded-full border border-border/80 bg-muted/40 p-1.5 font-[family-name:var(--editorial-sans)]">
            <button
              onClick={() => setActiveTab("roadmap")}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                activeTab === "roadmap"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              01 / Roadmap
            </button>
            <button
              onClick={() => setActiveTab("fusions")}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                activeTab === "fusions"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              02 / Agent Swarm
            </button>
            <button
              onClick={() => setActiveTab("matrix")}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
                activeTab === "matrix"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              03 / Capabilities Matrix
            </button>
          </div>
        </div>
      </section>

      {/* TAB 01: 12-Month & 3-Year Strategic Roadmap */}
      {activeTab === "roadmap" && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-12 sm:gap-12">
            <div className="sm:col-span-5">
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">01 / Strategic Timeline</span>
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
      )}

      {/* TAB 02: Bento Grid Showcase of the 20 Agentic Fusion Plays */}
      {activeTab === "fusions" && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">02 / Agentic Architecture</span>
            <h2 className="mt-3 font-[family-name:var(--editorial-serif)] text-[2.4rem] leading-[1.02] tracking-[-0.025em] sm:text-[3.5rem]">
              {tV("fusionsTitleA")} <span className="italic text-muted-foreground">{tV("fusionsTitleB")}</span>
            </h2>
            <p className="mt-4 max-w-md font-[family-name:var(--editorial-serif)] text-[19px] italic leading-[1.45] text-foreground/70 sm:text-[22px]">
              {tV("fusionsSubtitle")}
            </p>
          </div>

          {/* Bento Grid Layout (Inspired by Emitra & GreenX templates) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: CBAM Autopilot (Large 2-col card) */}
            <div className="md:col-span-2 rounded-2xl border border-border/60 bg-background overflow-hidden flex flex-col justify-between group hover:border-foreground/30 transition-all">
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-muted-foreground">FUSION 01</span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--accent-lime)] text-[var(--accent-lime-foreground)]">
                    P0 Flagship
                  </span>
                </div>
                <h3 className="text-2xl font-semibold font-[family-name:var(--editorial-display)] mb-3">
                  {tV("fusion1Title")}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                  {tV("fusion1Desc")}
                </p>
              </div>
              <div className="relative h-64 w-full mt-4 border-t border-border/60">
                <Image
                  src={bentoShipping}
                  alt="Limassol port container terminal"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Bento Card 2: EAC Bill Whisperer */}
            <div className="rounded-2xl border border-border/60 bg-background p-8 flex flex-col justify-between group hover:border-foreground/30 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-muted-foreground">FUSION 02</span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Cyprus Energy
                  </span>
                </div>
                <h3 className="text-xl font-semibold font-[family-name:var(--editorial-display)] mb-3">
                  {tV("fusion2Title")}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {tV("fusion2Desc")}
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-border/60 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <TrendingDown className="h-4 w-4" />
                <span>Save €200–€1,200/yr per site</span>
              </div>
            </div>

            {/* Bento Card 3: Open Banking PSD2 Feeds */}
            <div className="rounded-2xl border border-border/60 bg-background p-8 flex flex-col justify-between group hover:border-foreground/30 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-muted-foreground">FUSION 03</span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    Open Banking
                  </span>
                </div>
                <h3 className="text-xl font-semibold font-[family-name:var(--editorial-display)] mb-3">
                  {tV("fusion3Title")}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {tV("fusion3Desc")}
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-border/60 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Database className="h-4 w-4" />
                <span>Bank of Cyprus & Hellenic PSD2</span>
              </div>
            </div>

            {/* Bento Card 4: WhatsApp Supplier Chaser */}
            <div className="rounded-2xl border border-border/60 bg-background p-8 flex flex-col justify-between group hover:border-foreground/30 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-muted-foreground">FUSION 04</span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Scope 3 Swarm
                  </span>
                </div>
                <h3 className="text-xl font-semibold font-[family-name:var(--editorial-display)] mb-3">
                  {tV("fusion4Title")}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {tV("fusion4Desc")}
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-border/60 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Globe2 className="h-4 w-4" />
                <span>Cypriot Greek WhatsApp Agent</span>
              </div>
            </div>

            {/* Bento Card 5: Automated Learning Academy (Fusion 21) */}
            <div className="rounded-2xl border border-border/60 bg-background p-8 flex flex-col justify-between group hover:border-foreground/30 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-muted-foreground">FUSION 05</span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Fusion 21 LMS
                  </span>
                </div>
                <h3 className="text-xl font-semibold font-[family-name:var(--editorial-display)] mb-3">
                  {tV("fusion5Title")}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {tV("fusion5Desc")}
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-border/60 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                <span>Signed Auditor Certificates</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 03: Capabilities & Status Matrix Table */}
      {activeTab === "matrix" && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">03 / Audit Transparency</span>
            <h2 className="mt-3 font-[family-name:var(--editorial-serif)] text-[2.4rem] leading-[1.02] tracking-[-0.025em] sm:text-[3.5rem]">
              {tV("matrixTitleA")} <span className="italic text-muted-foreground">{tV("matrixTitleB")}</span>
            </h2>
            <p className="mt-4 max-w-md font-[family-name:var(--editorial-serif)] text-[19px] italic leading-[1.45] text-foreground/70 sm:text-[22px]">
              {tV("matrixSubtitle")}
            </p>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search capabilities or regulations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-border/80 bg-background pl-11 pr-4 py-2 text-xs outline-none focus:border-foreground transition-colors"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 font-[family-name:var(--editorial-sans)]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-foreground text-background"
                      : "border border-border/60 bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Matrix Table */}
          <div className="divide-y divide-border/60 border-y border-border/60 font-[family-name:var(--editorial-sans)]">
            <div className="py-3 flex items-center justify-between text-xs font-mono uppercase text-muted-foreground tracking-wider">
              <span>Capability / Module</span>
              <div className="hidden sm:flex items-center gap-16">
                <span>Pillar Metric</span>
                <span>Development Status</span>
              </div>
            </div>

            {filteredMatrix.map((row, idx) => (
              <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/10 transition-colors">
                <div>
                  <span className="text-[15px] font-semibold text-foreground">{row.feature}</span>
                  <span className="ml-3 text-xs font-mono text-muted-foreground font-normal">[{row.category}]</span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <span className="text-xs font-mono text-muted-foreground hidden sm:inline">{row.metric}</span>
                  {getStatusBadge(row.status)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <SectionDivider />

      {/* SECTION 04 — Early Access Beta Registration CTA */}
      <section id="beta-signup" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src={ctaDawnPhoto}
            alt="Cyprus dawn horizon"
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
