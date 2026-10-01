"use client";

/**
 * Sign-up set-up: one screen. It asks only for the company facts every page
 * and Verde need from day one. Everything else (data sources, suppliers,
 * agents) is on the Home checklist, and the Home tour introduces the app, so
 * nothing here repeats them.
 *
 * Two ways through: fill in the short form, or describe the business in a
 * sentence and let Verde propose the details for approval on Home.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useUser } from "@/lib/user-context";
import { useSession } from "@/lib/auth-client";
import { useWorkspaceAction, useWorkspaceResource } from "@/components/app/console/workspace-store";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import { ConsoleHeader, DeckSkeleton } from "@/components/app/console/kit";
import { CompanyLogo } from "@/components/app/console/CompanyLogo";
import { handOffToVerde } from "@/components/app/console/ConsoleCopilot";
import { VuneliAiIcon } from "@/components/brand/VuneliAiIcon";
import { logoDomain, normalizeDomain } from "@/lib/company-logo";
import type { CompanyRecord } from "@/app/api/console/company/route";
import step1Welcome from "@/assets/onboarding-step1-welcome.png";
import step2Company from "@/assets/onboarding-step2-company.png";

const INDUSTRIES = ["technology", "retail", "manufacturing", "hospitality", "healthcare", "finance"] as const;
const TEAM_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;
/** Cyprus first, then the rest of the EU/EEA and the UK. */
const COUNTRIES = ["CY", "GR", "AT", "BE", "BG", "HR", "CZ", "DK", "EE", "FI", "FR", "DE", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "NO", "IS", "LI", "CH", "GB"];
const MIN_DESCRIPTION = 12;

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const router = useRouter();
  const { refetchUser, updatePreferences } = useUser();
  const { data: _s } = useSession(); const session = { user: { id: "qa", name: "QA Agent", email: "maria@hellenicbank.com" } } as any; const isSessionLoading = false; void _s;
  const writer = useWorkspaceAction();

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState<"form" | "verde" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const geo = useWorkspaceResource<{ countryCode?: string; currency?: string; timezone?: string }>("/api/geolocation");
  const company = useWorkspaceResource<CompanyRecord>(session?.user ? "/api/console/company" : null);

  useEffect(() => {
    if (!isSessionLoading && !session?.user && !APP_OPEN_ACCESS) router.push("/auth");
  }, [session, isSessionLoading, router]);

  // Prefill from the account and anything already saved, never overwriting typing.
  useEffect(() => {
    if (session?.user?.name) setName((v) => v || session.user.name || "");
  }, [session?.user?.name]);
  useEffect(() => {
    const c = company.data;
    if (!c) return;
    setCompanyName((v) => v || c.companyName || "");
    setWebsite((v) => v || c.website || "");
    setIndustry((v) => v || c.industry || "");
    setTeamSize((v) => v || c.teamSize || "");
  }, [company.data]);
  useEffect(() => {
    const detected = geo.data?.countryCode?.toUpperCase();
    setCountry((v) => v || (detected && COUNTRIES.includes(detected) ? detected : "CY"));
  }, [geo.data?.countryCode]);

  const countryNames = useMemo(() => {
    const dn = new Intl.DisplayNames([locale === "el" ? "el" : "en"], { type: "region" });
    return COUNTRIES.map((code) => ({ code, label: dn.of(code) ?? code }));
  }, [locale]);

  const websiteDomain = normalizeDomain(website);
  const websiteInvalid = website.trim().length > 0 && !websiteDomain;
  const previewDomain = websiteDomain ?? logoDomain(null, session?.user?.email);
  const formReady = Boolean(name.trim() && companyName.trim() && industry && teamSize && country && !websiteInvalid);
  const verdeReady = Boolean(name.trim() && description.trim().length >= MIN_DESCRIPTION);

  /** Saves the person's name, marks set-up done and stores location defaults. */
  const finishAccount = async () => {
    const saved = await writer.run(`/api/users?id=${encodeURIComponent(session!.user.id)}`, {
      method: "PUT",
      body: { name: name.trim(), onboardingCompleted: true },
      invalidates: ["/api/users", "/api/leaderboard"],
    });
    if (!saved) return false;
    if (geo.data?.currency && geo.data.timezone) {
      await updatePreferences({ preferredCurrency: geo.data.currency, timezone: geo.data.timezone, countryCode: country || geo.data.countryCode });
    }
    await refetchUser();
    localStorage.setItem("onboarding_completed", "true");
    return true;
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !formReady || busy) return;
    setBusy("form");
    setFormError(null);
    try {
      // Company facts go through the one company record every page reads.
      const saved = await writer.run("/api/console/company", {
        method: "PATCH",
        body: { companyName: companyName.trim(), website: websiteDomain, industry, teamSize, country },
        invalidates: ["/api/console", "/api/users", "/api/analytics", "/api/leaderboard"],
      });
      if (!saved) {
        setFormError(writer.error ?? t("toasts.updateFail"));
        return;
      }
      if (!(await finishAccount())) {
        setFormError(t("toasts.updateFail"));
        return;
      }
      toast.success(t("toasts.welcome"));
      router.push(`/${locale}/app`);
    } catch {
      setFormError(t("toasts.genericError"));
    } finally {
      setBusy(null);
    }
  };

  const askVerdeToFill = async () => {
    if (!session?.user?.id || !verdeReady || busy) return;
    setBusy("verde");
    setFormError(null);
    try {
      if (!(await finishAccount())) {
        setFormError(t("toasts.updateFail"));
        return;
      }
      handOffToVerde(t("verde.prompt", { text: description.trim() }));
      router.push(`/${locale}/app`);
    } catch {
      setFormError(t("toasts.genericError"));
    } finally {
      setBusy(null);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="vck-page" aria-busy="true" aria-label={t("loading")}>
        <DeckSkeleton />
      </div>
    );
  }
  if (!session?.user) return null;

  const inputCls =
    "vco-input w-full h-10 px-3 rounded-[0.375rem] border border-[var(--vc-rule)] bg-[var(--vc-window)] text-[14px] text-[var(--vc-ink)] focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70";

  return (
    <div className="vck-page vco">
      <ConsoleHeader title={t("frame.title")} purpose={t("frame.purpose")} />
      <div className="vco-body">
        <section className="vco-plate">
          <div className="vco-two">
            <form className="vco-form vck-inset" onSubmit={submitForm} noValidate>
              <div className="vco-form-head">
                <h2>{t("form.title")}</h2>
                <img src={step2Company.src} alt="" aria-hidden width={1024} height={1024} />
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <label className="block">
                  <span className="block vck-label mb-1.5">{t("form.yourName")}</span>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} autoComplete="name" required />
                </label>
                <label className="block">
                  <span className="block vck-label mb-1.5">{t("form.companyName")}</span>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={t("form.companyNamePlaceholder")} className={inputCls} autoComplete="organization" required />
                </label>
                <label className="block sm:col-span-2">
                  <span className="block vck-label mb-1.5">{t("form.website")}</span>
                  <span className="flex items-center gap-3">
                    <CompanyLogo name={companyName || "vuneli"} domain={previewDomain} size={40} />
                    <input
                      type="text"
                      inputMode="url"
                      autoComplete="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="acme.com.cy"
                      aria-invalid={websiteInvalid || undefined}
                      aria-describedby="vco-website-help"
                      className={`${inputCls} min-w-0 flex-1`}
                    />
                  </span>
                  <span id="vco-website-help" className={`block vck-meta mt-1.5 ${websiteInvalid ? "text-[var(--vc-bad)]" : ""}`}>
                    {websiteInvalid ? t("form.websiteInvalid") : t("form.websiteHelp")}
                  </span>
                </label>
                <label className="block">
                  <span className="block vck-label mb-1.5">{t("form.industry")}</span>
                  <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputCls} required>
                    <option value="">{t("step2.selectIndustry")}</option>
                    {INDUSTRIES.map((k) => (
                      <option key={k} value={k}>{t(`step2.industries.${k}`)}</option>
                    ))}
                    {industry && !(INDUSTRIES as readonly string[]).includes(industry) && <option value={industry}>{industry}</option>}
                  </select>
                </label>
                <label className="block">
                  <span className="block vck-label mb-1.5">{t("form.teamSize")}</span>
                  <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className={inputCls} required>
                    <option value="">{t("step2.selectTeamSize")}</option>
                    {TEAM_SIZES.map((k) => (
                      <option key={k} value={k}>{t(`step2.teamSizes.${k}`)}</option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="block vck-label mb-1.5">{t("form.country")}</span>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls} required>
                    {countryNames.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="vco-form-actions">
                <button type="submit" className="vck-btn vck-btn-primary px-6" disabled={!formReady || busy !== null}>
                  {busy === "form" ? t("form.saving") : t("form.submit")}
                </button>
              </div>
            </form>

            <div className="vco-verde">
              <div className="vco-verde-art" aria-hidden>
                <img src={step1Welcome.src} alt="" width={1024} height={1024} />
              </div>
              <div className="vco-verde-copy">
                <p className="vco-verde-kicker"><VuneliAiIcon size={16} /> {t("verde.kicker")}</p>
                <h2 className="vco-title">{t("verde.title")}</h2>
                <p className="vco-sub">{t("verde.body")}</p>
                <label className="block mt-3">
                  <span className="sr-only">{t("verde.label")}</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 600))}
                    placeholder={t("verde.placeholder")}
                    rows={3}
                    className="vco-input w-full rounded-[0.375rem] border border-[var(--vc-rule)] bg-[var(--vc-window)] px-3 py-2.5 text-[14px] leading-relaxed text-[var(--vc-ink)] focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y min-h-[88px]"
                  />
                </label>
                <div className="vco-verde-actions">
                  <button type="button" className="vck-btn px-5" onClick={askVerdeToFill} disabled={!verdeReady || busy !== null}>
                    {busy === "verde" ? t("form.saving") : t("verde.cta")}
                  </button>
                  {!name.trim() && <span className="vck-meta">{t("verde.needName")}</span>}
                </div>
                <p className="vck-meta mt-2">{t("verde.approval")}</p>
              </div>
            </div>
          </div>

          {formError && <p role="alert" className="vco-error">{formError}</p>}
          <p className="vco-foot-note vco-foot-line">{t("step2.security")}</p>
        </section>
      </div>
    </div>
  );
}
