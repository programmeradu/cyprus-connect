"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { CheckCircle2, Sparkles, ArrowRight, ShieldCheck, Cpu, Zap, Database, Building2, FileCheck } from "lucide-react";

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

  const horizonItems = [
    { key: "q1", quarter: "Q1 2026", title: tV("q1Title"), body: tV("q1Desc"), icon: FileCheck },
    { key: "q2", quarter: "Q2 2026", title: tV("q2Title"), body: tV("q2Desc"), icon: Zap },
    { key: "q3", quarter: "Q3 2026", title: tV("q3Title"), body: tV("q3Desc"), icon: Building2 },
    { key: "q4", quarter: "Q4 2026", title: tV("q4Title"), body: tV("q4Desc"), icon: Cpu },
  ];

  const fusionPlays = [
    { n: "01", title: tV("fusion1Title"), body: tV("fusion1Desc"), badge: "P0 Flagship", icon: Cpu },
    { n: "02", title: tV("fusion2Title"), body: tV("fusion2Desc"), badge: "Cyprus Energy", icon: Zap },
    { n: "03", title: tV("fusion3Title"), body: tV("fusion3Desc"), badge: "Open Banking", icon: Database },
    { n: "04", title: tV("fusion4Title"), body: tV("fusion4Desc"), badge: "Scope 3 Swarm", icon: Sparkles },
    { n: "05", title: tV("fusion5Title"), body: tV("fusion5Desc"), badge: "Fusion 21 LMS", icon: ShieldCheck },
    { n: "06", title: tV("fusion6Title"), body: tV("fusion6Desc"), badge: "RIF Grants", icon: Building2 },
  ];

  const matrixItems = [
    { feature: "Scope 1, 2, 3 GHG Emissions Calculator", category: "Measure", status: "tagShipped" },
    { feature: "Cyprus EAC Grid Factor (~610 gCO₂/kWh) Calibration", category: "Measure", status: "tagShipped" },
    { feature: "EAC PDF Bill Ingestion (OCR & Vision AI)", category: "Measure", status: "tagShipped" },
    { feature: "VSME (Voluntary SME Standard) Report Builder", category: "Report", status: "tagShipped" },
    { feature: "EU Taxonomy & Double Materiality Matrix", category: "Report", status: "tagShipped" },
    { feature: "AI Automated Learning Platform & Signed Certificates (/learn)", category: "Learn", status: "tagShipped" },
    { feature: "CBAM Customs Declaration & XML Generator (CBAM Autopilot)", category: "Compliance", status: "tagBeta" },
    { feature: "EAC Tariff Switching & CERA Mis-Classification Advisor", category: "Reduce", status: "tagBeta" },
    { feature: "SoftOne & Epsilon Net Direct Read Connectors", category: "Integrations", status: "tagRoadmap" },
    { feature: "Bank of Cyprus & Hellenic PSD2 Account Feeds", category: "Integrations", status: "tagRoadmap" },
    { feature: "WhatsApp Cyprus Supplier Data Collection Swarm", category: "Scope 3", status: "tagRoadmap" },
    { feature: "Cyprus SME Sustainability Index & Benchmarking Portal", category: "Analytics", status: "tagFuture" },
    { feature: "Regulatory Horizon Scanner & Auto Impact Translator", category: "Comply", status: "tagFuture" },
  ];

  const getStatusBadge = (statusKey: string) => {
    switch (statusKey) {
      case "tagShipped":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="h-3 w-3" /> {tV("tagShipped")}</span>;
      case "tagBeta":
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20"><Sparkles className="h-3 w-3" /> {tV("tagBeta")}</span>;
      case "tagRoadmap":
        return <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400 border border-sky-500/20"><Cpu className="h-3 w-3" /> {tV("tagRoadmap")}</span>;
      case "tagFuture":
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20">{tV("tagFuture")}</span>;
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-[var(--accent-lime)] selection:text-black">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-44 sm:pb-28 border-b border-border/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md mb-6">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent-lime-foreground)]" />
              <span>{tV("badge")}</span>
            </div>

            <h1 
              className="text-4xl font-semibold tracking-[-0.03em] sm:text-6xl lg:text-7xl leading-[1.08] mb-6 text-foreground"
              style={{ fontFamily: "var(--editorial-display)" }}
            >
              {tV("heroTitleA")} <br className="hidden sm:inline" />
              <span className="italic font-normal text-muted-foreground">{tV("heroTitleB")}</span>
            </h1>

            <p 
              className="text-lg text-muted-foreground sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
              style={{ fontFamily: "var(--editorial-sans)" }}
            >
              {tV("heroSubtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#beta-signup">
                <PremiumButton size="lg" className="w-full sm:w-auto">
                  {tV("ctaBeta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </PremiumButton>
              </a>
              <a href="#horizon">
                <button 
                  className="w-full sm:w-auto h-11 px-6 rounded-full border border-border/80 bg-background/50 hover:bg-muted text-sm font-medium transition-colors"
                  style={{ fontFamily: "var(--editorial-sans)" }}
                >
                  {tV("ctaExplore")}
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 12-Month & 3-Year Horizons */}
      <section id="horizon" className="py-24 border-b border-border/40 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">01 / Roadmap</span>
            <h2 
              className="text-3xl sm:text-5xl font-semibold tracking-tight mt-2 mb-4"
              style={{ fontFamily: "var(--editorial-display)" }}
            >
              {tV("horizonTitleA")} <span className="italic font-normal">{tV("horizonTitleB")}</span>
            </h2>
            <p className="text-muted-foreground text-lg">{tV("horizonSubtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {horizonItems.map((item) => {
              const IconComp = item.icon;
              return (
                <div 
                  key={item.key} 
                  className="group relative rounded-2xl border border-border/60 bg-background p-6 transition-all hover:border-foreground/30 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-muted text-foreground">
                      {item.quarter}
                    </span>
                    <IconComp className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 leading-snug" style={{ fontFamily: "var(--editorial-display)" }}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>

          {/* 3-Year Vision Card */}
          <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-background via-muted/40 to-muted/20 p-8 sm:p-10 relative overflow-hidden">
            <div className="max-w-3xl">
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[var(--accent-lime-foreground)] bg-[var(--accent-lime)]/20 px-3 py-1 rounded-full">
                Long-Term Horizon
              </span>
              <h3 className="text-2xl sm:text-3xl font-semibold mt-4 mb-3" style={{ fontFamily: "var(--editorial-display)" }}>
                {tV("horizon3YrTitle")}
              </h3>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                {tV("horizon3YrDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 20 Agentic Fusion Plays */}
      <section className="py-24 border-b border-border/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">02 / Agentic Architecture</span>
            <h2 
              className="text-3xl sm:text-5xl font-semibold tracking-tight mt-2 mb-4"
              style={{ fontFamily: "var(--editorial-display)" }}
            >
              {tV("fusionsTitleA")} <span className="italic font-normal">{tV("fusionsTitleB")}</span>
            </h2>
            <p className="text-muted-foreground text-lg">{tV("fusionsSubtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {fusionPlays.map((play) => {
              const IconComp = play.icon;
              return (
                <div 
                  key={play.n}
                  className="rounded-2xl border border-border/60 bg-background p-6 flex flex-col justify-between hover:border-foreground/30 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-bold text-muted-foreground">{play.n}</span>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border border-border bg-muted/50 text-foreground">
                        {play.badge}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "var(--editorial-display)" }}>
                      {play.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {play.body}
                    </p>
                  </div>
                  <div className="pt-6 mt-6 border-t border-border/40 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <IconComp className="h-4 w-4" />
                    <span>Autonomous Digital FTE</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Status & Capabilities Matrix */}
      <section className="py-24 border-b border-border/40 bg-muted/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">03 / Transparency</span>
            <h2 
              className="text-3xl sm:text-5xl font-semibold tracking-tight mt-2 mb-4"
              style={{ fontFamily: "var(--editorial-display)" }}
            >
              {tV("matrixTitleA")} <span className="italic font-normal">{tV("matrixTitleB")}</span>
            </h2>
            <p className="text-muted-foreground text-lg">{tV("matrixSubtitle")}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-xs font-mono uppercase text-muted-foreground">
                    <th className="px-6 py-4 font-semibold">Capability / Module</th>
                    <th className="px-6 py-4 font-semibold">Pillar</th>
                    <th className="px-6 py-4 font-semibold">Development Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {matrixItems.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{row.feature}</td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{row.category}</td>
                      <td className="px-6 py-4">{getStatusBadge(row.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Early Access Beta Signup */}
      <section id="beta-signup" className="py-24 relative">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-3xl border border-border/80 bg-card p-8 sm:p-12 shadow-xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto text-center">
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Early Access</span>
              <h2 
                className="text-3xl sm:text-4xl font-semibold mt-2 mb-4 text-foreground"
                style={{ fontFamily: "var(--editorial-display)" }}
              >
                {tV("waitlistTitleA")} <span className="italic font-normal">{tV("waitlistTitleB")}</span>
              </h2>
              <p className="text-muted-foreground text-base mb-8">
                {tV("waitlistSubtitle")}
              </p>

              {submitted ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                  <p>{tV("waitlistSuccess")}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder={tV("waitlistNamePh")}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Work Email</label>
                      <input 
                        type="email" 
                        required
                        placeholder={tV("waitlistEmailPh")}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Organization</label>
                      <input 
                        type="text" 
                        required
                        placeholder={tV("waitlistOrgPh")}
                        value={formData.org}
                        onChange={(e) => setFormData({ ...formData, org: e.target.value })}
                        className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Business Segment</label>
                      <select 
                        value={formData.segment}
                        onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                        className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm outline-none focus:border-foreground transition-colors"
                      >
                        <option value="importer">CBAM Importer / Exporter</option>
                        <option value="hotel">Hospitality & Tourism</option>
                        <option value="shipping">Limassol Shipping Operator</option>
                        <option value="accountant">Accountant / Audit Practice</option>
                        <option value="other">Other SME</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <PremiumButton type="submit" className="w-full justify-center">
                      {tV("waitlistSubmit")}
                    </PremiumButton>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer link */}
      <footer className="py-12 border-t border-border/40 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Vuneli. Cyprus-native sustainability operating system.</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/pricing" className="hover:underline">{tNav("pricing")}</Link>
            <Link href="/learn" className="hover:underline">{tNav("learn")}</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
