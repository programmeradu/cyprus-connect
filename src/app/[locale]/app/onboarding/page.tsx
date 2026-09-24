"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  LeafIcon,
  BoltIcon

} from "@/components/icons/CustomIcons";
import { Check, Cloud, Settings, FolderUp, Trophy, Loader2, ExternalLink } from "lucide-react";
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
  const [detectedLocation, setDetectedLocation] = useState<{
    countryCode: string;
    currency: string;
    timezone: string;
  } | null>(null);

  // Detect location on mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('/api/geolocation');
        if (response.ok) {
          const data = await response.json();
          setDetectedLocation({
            countryCode: data.countryCode || 'US',
            currency: data.currency || 'USD',
            timezone: data.timezone || 'America/New_York',
          });
        }
      } catch (error) {
        console.error('Failed to detect location:', error);
      }
    };

    detectLocation();
  }, []);

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
      const response = await fetch('/api/oauth/quickbooks/authorize', {
        headers: {
          'x-user-id': session.user.id
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }
      
      const data = await response.json();
      
      toast.success(t('toasts.qbRedirect'));
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('QB connect error:', error);
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
      const checkResponse = await fetch(`/api/users?search=${encodeURIComponent(email)}`);
      let existingUser = null;
      
      if (checkResponse.ok) {
        const users = await checkResponse.json();
        existingUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      }

      let userData;
      const token = localStorage.getItem("bearer_token");
      
      if (existingUser) {
        const response = await fetch(`/api/users?id=${existingUser.id}`, {
          method: "PUT",
          headers: { 
 "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
          },
          body: JSON.stringify({
            name,
            companyName,
            companyIndustry: industry,
            teamSize,
            sustainabilityGoals: ["reduce-carbon", "energy-efficiency"],
            onboardingCompleted: true
          })
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.error || t("toasts.updateFail"));
          setIsSubmitting(false);
          return;
        }

        userData = await response.json();
      } else {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { 
 "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
          },
          body: JSON.stringify({
            email,
            name,
            companyName,
            companyIndustry: industry,
            teamSize,
            sustainabilityGoals: ["reduce-carbon", "energy-efficiency"]
          })
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.error || t("toasts.createFail"));
          setIsSubmitting(false);
          return;
        }

        userData = await response.json();
        
        const updateResponse = await fetch(`/api/users?id=${userData.id}`, {
          method: "PUT",
          headers: { 
 "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
          },
          body: JSON.stringify({
            onboardingCompleted: true
          })
        });

        if (updateResponse.ok) {
          userData = await updateResponse.json();
        }
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

  return (
    <div className="vck-page vco">
      <ConsoleHeader title={t("frame.title")} purpose={t("frame.purpose")} />
      <ol className="vco-rail" aria-label={t("frame.stepOf", { n: step })}>
        {(t.raw("frame.rail") as string[]).map((label, i) => {
          const n = i + 1;
          const state = n < step ? "done" : n === step ? "current" : "next";
          return (
            <li key={label} data-state={state} aria-current={state === "current" ? "step" : undefined}>
              <span className="vco-rail-n vck-num">{n}</span>
              <span className="vco-rail-label">{label}</span>
            </li>
          );
        })}
      </ol>
      <div className="vco-body">
        <AnimatePresence mode="wait">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="vco-plate"
            >
              {/* Title at Top - Spans Full Width */}
              <div className="mb-8">
                <div className="mb-2">
                  <h2 className="text-[22px] font-semibold text-[var(--vc-ink)]">
                    {t("step1.title")}
                  </h2>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Left Side - Illustration */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative w-full max-w-[20rem] sm:max-w-sm aspect-square">
                    <div aria-hidden className="absolute inset-x-12 bottom-4 h-6 rounded-[50%] bg-foreground/10 blur-xl" />
                    <img
                      src={step1Welcome.src}
                      alt={t("step1.imageAlt")}
                      width={1024}
                      height={1024}
                      className="relative h-full w-full object-contain drop-shadow-[0_18px_30px_rgba(40,60,45,0.18)]"
                    />
                  </div>
                </div>

                {/* Right Side - Content */}
                <div className="flex-1 text-left">
                  <h2 className="text-xl md:text-2xl font-semibold mb-6">
                    {t("step1.heading")}
                  </h2>

                  <div className="space-y-3 mb-8">
                    {(t.raw("step1.features") as string[]).map((feature, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-5 h-5 rounded-full border border-[var(--vc-rule)] flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm text-foreground">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  <p className="text-[13.5px] text-[var(--vc-ink-2)] mb-6 leading-relaxed">
                    {t("step1.description")}
                  </p>

                  <div className="flex items-center gap-4">
                    <button className="vck-btn vck-btn-primary" onClick={() => setStep(2)}>
                      {t("step1.getStarted")}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Connect Data Sources + Company Details */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="vco-plate"
            >

              <h2 className="text-[22px] font-semibold text-[var(--vc-ink)] mb-2">
                {t("step2.title")}
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                {t("step2.subtitle")}
              </p>

              {/* Company Details Form */}
              <div className="relative mb-8 overflow-hidden p-6 rounded-lg vck-inset">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="min-w-0 text-sm font-semibold">{t("step2.companyHeader")}</h3>
                  <img src={step2Company.src} alt="" aria-hidden width={1024} height={1024} className="-my-4 h-20 w-20 shrink-0 object-contain drop-shadow-[0_10px_16px_rgba(40,60,45,0.16)] sm:h-24 sm:w-24" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block vck-label mb-2">{t("step2.yourName")}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("step2.yourNamePlaceholder")}
                      className="w-full h-11 px-3 rounded-[0.375rem] border border-[var(--vc-rule)] bg-[var(--vc-well)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block vck-label mb-2">{t("step2.email")}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("step2.emailPlaceholder")}
                      className="w-full h-11 px-3 rounded-[0.375rem] border border-[var(--vc-rule)] bg-[var(--vc-well)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block vck-label mb-2">{t("step2.companyName")}</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={t("step2.companyNamePlaceholder")}
                      className="w-full h-11 px-3 rounded-[0.375rem] border border-[var(--vc-rule)] bg-[var(--vc-well)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block vck-label mb-2">{t("step2.industry")}</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full h-11 px-3 rounded-[0.375rem] border border-[var(--vc-rule)] bg-[var(--vc-well)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">{t("step2.selectIndustry")}</option>
                      <option value="technology">{t("step2.industries.technology")}</option>
                      <option value="retail">{t("step2.industries.retail")}</option>
                      <option value="manufacturing">{t("step2.industries.manufacturing")}</option>
                      <option value="hospitality">{t("step2.industries.hospitality")}</option>
                      <option value="healthcare">{t("step2.industries.healthcare")}</option>
                      <option value="finance">{t("step2.industries.finance")}</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block vck-label mb-2">{t("step2.teamSize")}</label>
                    <select
                      value={teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                      className="w-full h-11 px-3 rounded-[0.375rem] border border-[var(--vc-rule)] bg-[var(--vc-well)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">{t("step2.selectTeamSize")}</option>
                      <option value="1-10">{t("step2.teamSizes.1-10")}</option>
                      <option value="11-50">{t("step2.teamSizes.11-50")}</option>
                      <option value="51-200">{t("step2.teamSizes.51-200")}</option>
                      <option value="201-500">{t("step2.teamSizes.201-500")}</option>
                      <option value="500+">{t("step2.teamSizes.500+")}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Source Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Utility Bills */}
                <div className="p-5 rounded-lg bg-background border border-[var(--vc-rule)]">
                  <img src={step2Utility.src} alt="" aria-hidden width={1024} height={1024} loading="lazy" className="mx-auto mb-3 h-20 w-20 object-contain drop-shadow-[0_10px_16px_rgba(40,60,45,0.16)]" />
                  <h3 className="text-xs font-bold mb-2 text-center">{t("step2.utility.title")}</h3>
                  <p className="text-[12px] text-muted-foreground mb-3 text-center min-h-[2.5rem]">
                    {t("step2.utility.desc")}
                  </p>
                  <button className="vck-btn vck-btn-primary w-full text-[12px] h-7"
                    onClick={() => handleUploadClick('utility')}
                  >
                    {t("step2.utility.cta")}
                  </button>
                </div>

                {/* Accounting Software */}
                <div className="p-5 rounded-lg vck-card hover:bg-[var(--vc-rail-active)] transition-colors">
                  <img src={step2Accounting.src} alt="" aria-hidden width={1024} height={1024} loading="lazy" className="mx-auto mb-3 h-20 w-20 object-contain drop-shadow-[0_10px_16px_rgba(40,60,45,0.16)]" />
                  <h3 className="text-xs font-bold mb-2 text-center">{t("step2.accounting.title")}</h3>
                  <p className="text-[12px] text-muted-foreground mb-3 text-center min-h-[2.5rem]">
                    {t("step2.accounting.desc")}
                  </p>
                  <button className="vck-btn w-full text-[12px] h-7"
                    onClick={() => handleUploadClick('accounting')}
                    disabled={qbConnecting}
                  >
                    {qbConnecting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        {t("step2.accounting.connecting")}
                      </>
                    ) : (
                      <>
                        {t("step2.accounting.cta")}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </>
                    )}
                  </button>
                </div>

                {/* Manual Upload */}
                <div className="p-5 rounded-lg vck-card hover:bg-[var(--vc-rail-active)] transition-colors">
                  <img src={step2Manual.src} alt="" aria-hidden width={1024} height={1024} loading="lazy" className="mx-auto mb-3 h-20 w-20 object-contain drop-shadow-[0_10px_16px_rgba(40,60,45,0.16)]" />
                  <h3 className="text-xs font-bold mb-2 text-center">{t("step2.manual.title")}</h3>
                  <p className="text-[12px] text-muted-foreground mb-3 text-center min-h-[2.5rem]">
                    {t("step2.manual.desc")}
                  </p>
                  <button className="vck-btn w-full text-[12px] h-7"
                    onClick={() => handleUploadClick('manual')}
                  >
                    {t("step2.manual.cta")}
                  </button>
                </div>
              </div>

              {/* Security Notice */}
              <div className="flex items-start gap-3 p-3 rounded-lg vck-inset mb-6">
                <div className="w-7 h-7 rounded-lg border border-[var(--vc-rule)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[12px] font-medium text-foreground">
                    {t("step2.security")}
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("step2.back")}
                </button>
                <button className="vck-btn vck-btn-primary"
                  onClick={() => setStep(3)}
                  disabled={!canProceed()}
                >
                  {t("step2.next")}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Gamification Intro */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="vco-plate"
            >
              <div className="text-center mb-8">
                <h2 className="text-[22px] font-semibold text-[var(--vc-ink)] mb-6">
                  {t("step3.title")}
                </h2>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                {/* Left - Illustration */}
                <div className="flex-1 flex justify-center">
                  <div className="relative w-56 h-56 sm:w-72 sm:h-72">
                    <div aria-hidden className="absolute inset-x-10 bottom-3 h-6 rounded-[50%] bg-foreground/10 blur-xl" />
                    <img
                      src={step3Plant.src}
                      alt="A smiling young plant in a pot, with green credit coins and a check mark around it"
                      width={1024}
                      height={1024}
                      loading="lazy"
                      className="relative h-full w-full object-contain drop-shadow-[0_18px_30px_rgba(40,60,45,0.18)]"
                    />
                  </div>
                </div>

                {/* Right - Content */}
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-bold mb-4">
                    {t("step3.heading")}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {t("step3.description")}
                  </p>

                  {/* Preview Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Green Credits */}
                    <div className="p-3 rounded-lg vck-card">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-6 h-6 rounded-md border border-[var(--vc-rule)] flex items-center justify-center">
                          <LeafIcon className="w-3 h-3 text-primary" />
                        </div>
                        <h4 className="text-[12px] font-bold">{t("step3.greenCredits")}</h4>
                      </div>
                      <p className="text-xl font-bold mb-0.5">
                        1,250
                        <span className="text-xs font-normal text-green-500 ml-1.5">+50</span>
                      </p>
                      <p className="text-[12px] text-muted-foreground">{t("step3.creditsEarned")}</p>
                    </div>

                    {/* Leaderboard */}
                    <div className="p-3 rounded-lg vck-card">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-6 h-6 rounded-md border border-[var(--vc-rule)] flex items-center justify-center">
                          <Trophy className="w-3 h-3 text-primary" />
                        </div>
                        <div className="flex gap-0.5">
                          <div className="w-1 h-3 bg-chart-2 rounded" />
                          <div className="w-1 h-4 bg-destructive rounded" />
                          <div className="w-1 h-2.5 bg-chart-3 rounded" />
                          <div className="w-1 h-3 bg-muted rounded" />
                        </div>
                      </div>
                      <p className="text-[12px] font-medium mb-0.5">{t("step3.leaderboard")}</p>
                      <p className="text-[12px] text-muted-foreground">{t("step3.yourRank")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <button className="vck-btn vck-btn-primary w-full md:w-auto px-6" onClick={() => setStep(4)}>
                  {t("step3.explore")}
                </button>
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("step3.back")}
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                  >
                    {t("step3.skip")}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Dashboard Tour */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="vco-plate"
            >
              <div className="text-center mb-8">
                <h2 className="text-[22px] font-semibold text-[var(--vc-ink)] mb-4">
                  {t("step4.title")}
                </h2>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                  {t("step4.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {(() => {
                  const items = t.raw("step4.features") as Array<{ title: string; desc: string }>;
                  return items.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="p-4 rounded-lg vck-card"
                    >
                      <h3 className="text-[15px] font-semibold mb-1.5 text-[var(--vc-ink)]">{feature.title}</h3>
                      <p className="text-[13.5px] leading-relaxed text-[var(--vc-ink-2)]">{feature.desc}</p>
                    </motion.div>
                  ));
                })()}
              </div>

              <div className="flex flex-col items-center gap-3">
                <button className="vck-btn vck-btn-primary w-full md:w-auto px-8"
                  onClick={handleComplete}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("step4.settingUp") : t("step4.cta")}
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("step4.back")}
                </button>
              </div>
            </motion.div>
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