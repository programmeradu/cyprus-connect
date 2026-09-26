"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { useWorkspaceAction, useWorkspaceResource, workspaceRequest } from "@/components/app/console/workspace-store";
import { Check, Loader2, ExternalLink } from "lucide-react";
import { DocumentUpload } from "@/components/app/DocumentUpload";
import { UtilityBillData } from "@/lib/ocr/types";
import { useTranslations } from "next-intl";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import { ConsoleHeader, DeckSkeleton } from "@/components/app/console/kit";
import step3Plant from "@/assets/onboarding-step3-plant.png";
import step1Welcome from "@/assets/onboarding-step1-welcome.png";
import step2Company from "@/assets/onboarding-step2-company.png";
import step2Utility from "@/assets/onboarding-step2-utility.png";
import step2Accounting from "@/assets/onboarding-step2-accounting.png";
import step2Manual from "@/assets/onboarding-step2-manual.png";
import step4Console from "@/assets/onboarding-step4-console.png";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const { refetchUser, updatePreferences } = useUser();
  const { data: session, isPending: isSessionLoading } = useSession();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState<'utility' | 'manual' | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [qbConnecting, setQbConnecting] = useState(false);

  // Where the visitor is, from the shared record (used to preset currency and timezone).
  const geo = useWorkspaceResource<{ countryCode?: string; currency?: string; timezone?: string }>("/api/geolocation");
  const detectedLocation =
    geo.data?.countryCode && geo.data.currency && geo.data.timezone
      ? { countryCode: geo.data.countryCode, currency: geo.data.currency, timezone: geo.data.timezone }
      : null;
  const writer = useWorkspaceAction();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isSessionLoading && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth");
    }
  }, [session, isSessionLoading, router]);

  // Fetch and populate name and email from authenticated session
  useEffect(() => {
    if (!isSessionLoading && session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      setIsLoadingUserData(false);
    } else if (!isSessionLoading) {
      setIsLoadingUserData(false);
    }
  }, [session, isSessionLoading]);

  const handleQbConnect = async () => {
    if (!session?.user?.id) {
      toast.error(t('toasts.completeProfile'));
      return;
    }
    
    setQbConnecting(true);
    try {
      const data = await workspaceRequest<{ authUrl?: string }>("/api/oauth/quickbooks/authorize");
      if (!data.authUrl) throw new Error("no url");
      toast.success(t('toasts.qbRedirect'));
      window.location.href = data.authUrl;
    } catch {
      toast.error(t('toasts.qbFail'));
      setQbConnecting(false);
    }
  };

  const handleComplete = async () => {
    if (!session?.user?.id) {
      toast.error(t("toasts.noSession"));
      if (!APP_OPEN_ACCESS) router.push("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      // The signed-in account already exists; onboarding fills in its company facts once.
      const saved = await writer.run(`/api/users?id=${encodeURIComponent(session.user.id)}`, {
        method: "PUT",
        body: {
          name,
          companyName,
          companyIndustry: industry,
          teamSize,
          sustainabilityGoals: ["reduce-carbon", "energy-efficiency"],
          onboardingCompleted: true
        },
        invalidates: ["/api/users", "/api/analytics", "/api/leaderboard", "/api/actions"]
      });
      if (!saved) {
        toast.error(t("toasts.updateFail"));
        setIsSubmitting(false);
        return;
      }

      // Save detected location preferences
      if (detectedLocation && session?.user?.id) {
        await updatePreferences({
          preferredCurrency: detectedLocation.currency,
          countryCode: detectedLocation.countryCode,
          timezone: detectedLocation.timezone,
        });
      }
      
      await refetchUser();
      
      localStorage.setItem("onboarding_completed", "true");
      
      toast.success(t("toasts.welcome"));
      
      router.push("/app");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error(t("toasts.genericError"));
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 2) {
      return name && email && companyName && industry && teamSize;
    }
    return true;
  };

  const handleUploadClick = (type: 'utility' | 'accounting' | 'manual') => {
    if (type === 'utility' || type === 'manual') {
      setUploadType(type);
      setShowUploadDialog(true);
    } else if (type === 'accounting') {
      handleQbConnect();
    }
  };

  const handleUploadComplete = (data: UtilityBillData) => {
    toast.success(t("toasts.extracted", { type: data.usageType ?? "" }));
    setShowUploadDialog(false);
  };

  // Show loading state while fetching session data
  if (isLoadingUserData || isSessionLoading) {
    return (
      <div className="vck-page" aria-busy="true" aria-label={t("loading")}>
        <DeckSkeleton />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const inputCls =
    "vco-input w-full h-10 px-3 rounded-[0.375rem] border border-[var(--vc-rule)] bg-[var(--vc-well)] text-[14px] text-[var(--vc-ink)] focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70";
  const stepMotion = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.22, ease: "easeOut" as const },
  };
  const sources = [
    { key: "utility" as const, img: step2Utility.src, primary: true },
    { key: "accounting" as const, img: step2Accounting.src, primary: false },
    { key: "manual" as const, img: step2Manual.src, primary: false },
  ];

  return (
    <div className="vck-page vco">
      <ConsoleHeader title={t("frame.title")} purpose={t("frame.purpose")} />
      <ol className="vco-rail" aria-label={t("frame.stepOf", { n: step })}>
        {(t.raw("frame.rail") as string[]).map((label, i) => {
          const n = i + 1;
          const state = n < step ? "done" : n === step ? "current" : "next";
          return (
            <li key={label} data-state={state} aria-current={state === "current" ? "step" : undefined}>
              <span className="vco-rail-n vck-num">{state === "done" ? <Check className="h-3.5 w-3.5" aria-hidden /> : n}</span>
              <span className="vco-rail-label">{label}</span>
            </li>
          );
        })}
      </ol>
      <div className="vco-body">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.section key="step1" {...stepMotion} className="vco-plate">
              <div className="vco-split">
                <div className="vco-art">
                  <div aria-hidden className="vco-art-shadow" />
                  <img src={step1Welcome.src} alt={t("step1.imageAlt")} width={1024} height={1024} />
                </div>
                <div className="vco-copy">
                  <h2 className="vco-title">{t("step1.title")}</h2>
                  <p className="vco-lead">{t("step1.heading")}</p>
                  <ul className="vco-checks">
                    {(t.raw("step1.features") as string[]).map((feature) => (
                      <li key={feature}>
                        <span className="vco-check" aria-hidden><Check className="h-3 w-3" /></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <p className="vco-note">{t("step1.description")}</p>
                  <div className="vco-actions">
                    <button className="vck-btn vck-btn-primary px-6" onClick={() => setStep(2)}>
                      {t("step1.getStarted")}
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {step === 2 && (
            <motion.section key="step2" {...stepMotion} className="vco-plate">
              <div className="vco-plate-head">
                <div className="min-w-0">
                  <h2 className="vco-title">{t("step2.title")}</h2>
                  <p className="vco-sub">{t("step2.subtitle")}</p>
                </div>
              </div>

              <div className="vco-two">
                <div className="vco-form vck-inset">
                  <div className="vco-form-head">
                    <h3>{t("step2.companyHeader")}</h3>
                    <img src={step2Company.src} alt="" aria-hidden width={1024} height={1024} />
                  </div>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="block vck-label mb-1.5">{t("step2.yourName")}</span>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("step2.yourNamePlaceholder")} className={inputCls} autoComplete="name" />
                    </label>
                    <label className="block">
                      <span className="block vck-label mb-1.5">{t("step2.email")}</span>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("step2.emailPlaceholder")} className={inputCls} disabled />
                    </label>
                    <label className="block">
                      <span className="block vck-label mb-1.5">{t("step2.companyName")}</span>
                      <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={t("step2.companyNamePlaceholder")} className={inputCls} autoComplete="organization" />
                    </label>
                    <label className="block">
                      <span className="block vck-label mb-1.5">{t("step2.industry")}</span>
                      <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputCls}>
                        <option value="">{t("step2.selectIndustry")}</option>
                        {["technology", "retail", "manufacturing", "hospitality", "healthcare", "finance"].map((k) => (
                          <option key={k} value={k}>{t(`step2.industries.${k}`)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="block vck-label mb-1.5">{t("step2.teamSize")}</span>
                      <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className={inputCls}>
                        <option value="">{t("step2.selectTeamSize")}</option>
                        {["1-10", "11-50", "51-200", "201-500", "500+"].map((k) => (
                          <option key={k} value={k}>{t(`step2.teamSizes.${k}`)}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <ul className="vco-sources">
                  {sources.map((s) => (
                    <li key={s.key} className="vco-source">
                      <img src={s.img} alt="" aria-hidden width={1024} height={1024} loading="lazy" />
                      <div className="min-w-0">
                        <h3>{t(`step2.${s.key}.title`)}</h3>
                        <p>{t(`step2.${s.key}.desc`)}</p>
                      </div>
                      <button
                        className={`vck-btn ${s.primary ? "vck-btn-primary" : ""} vco-source-btn`}
                        onClick={() => handleUploadClick(s.key)}
                        disabled={s.key === "accounting" && qbConnecting}
                      >
                        {s.key === "accounting" && qbConnecting ? (
                          <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden />{t("step2.accounting.connecting")}</>
                        ) : (
                          <>{t(`step2.${s.key}.cta`)}{s.key === "accounting" && <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden />}</>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="vco-foot">
                <button onClick={() => setStep(1)} className="vco-back">{t("step2.back")}</button>
                <p className="vco-foot-note">{t("step2.security")}</p>
                <button className="vck-btn vck-btn-primary px-6" onClick={() => setStep(3)} disabled={!canProceed()}>
                  {t("step2.next")}
                </button>
              </div>
            </motion.section>
          )}

          {step === 3 && (
            <motion.section key="step3" {...stepMotion} className="vco-plate">
              <div className="vco-split">
                <div className="vco-art">
                  <div aria-hidden className="vco-art-shadow" />
                  <img src={step3Plant.src} alt="A smiling young plant in a pot, with green credit coins and a check mark around it" width={1024} height={1024} />
                </div>
                <div className="vco-copy">
                  <h2 className="vco-title">{t("step3.title")}</h2>
                  <p className="vco-lead">{t("step3.heading")}</p>
                  <p className="vco-note">{t("step3.description")}</p>
                  <dl className="vco-facts">
                    <div><dt>{t("step3.greenCredits")}</dt><dd>{t("step3.creditsEarned")}</dd></div>
                    <div><dt>{t("step3.leaderboard")}</dt><dd>{t("step3.yourRank")}</dd></div>
                  </dl>
                  <div className="vco-actions">
                    <button className="vck-btn vck-btn-primary px-6" onClick={() => setStep(4)}>{t("step3.explore")}</button>
                    <button onClick={() => setStep(2)} className="vco-back">{t("step3.back")}</button>
                    <button onClick={() => setStep(4)} className="vco-back underline underline-offset-4">{t("step3.skip")}</button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {step === 4 && (
            <motion.section key="step4" {...stepMotion} className="vco-plate">
              <div className="vco-split">
                <div className="vco-art">
                  <div aria-hidden className="vco-art-shadow" />
                  <img src={step4Console.src} alt="A console tablet with a rising chart and gauge, a leaf coin, a check mark and a flag" width={1024} height={1024} />
                </div>
                <div className="vco-copy">
                  <h2 className="vco-title">{t("step4.title")}</h2>
                  <p className="vco-sub">{t("step4.subtitle")}</p>
                  <ul className="vco-features">
                    {(t.raw("step4.features") as Array<{ title: string; desc: string }>).map((feature) => (
                      <li key={feature.title}>
                        <h3>{feature.title}</h3>
                        <p>{feature.desc}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="vco-actions">
                    <button className="vck-btn vck-btn-primary px-8" onClick={handleComplete} disabled={isSubmitting}>
                      {isSubmitting ? t("step4.settingUp") : t("step4.cta")}
                    </button>
                    <button onClick={() => setStep(3)} className="vco-back">{t("step4.back")}</button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Upload Dialog */}
        {showUploadDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowUploadDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="vck-overlay p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  {uploadType === 'utility' ? t("upload.utilityTitle") : t("upload.documentTitle")}
                </h3>
                <button
                  onClick={() => setShowUploadDialog(false)}
                  className="w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {uploadType === 'utility' ? t("upload.descUtility") : t("upload.descDocument")}
              </p>
              <DocumentUpload onUploadComplete={handleUploadComplete} />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}