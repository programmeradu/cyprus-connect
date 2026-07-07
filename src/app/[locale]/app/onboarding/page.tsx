"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  LeafIcon,
  BoltIcon,
  FireIcon
} from "@/components/icons/CustomIcons";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { Check, Cloud, Settings, FolderUp, Trophy, BarChart3, Loader2, ExternalLink } from "lucide-react";
import { DocumentUpload } from "@/components/app/DocumentUpload";
import { UtilityBillData } from "@/lib/ocr/types";
import { useTranslations } from "next-intl";

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
      router.push("/auth");
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
      router.push("/auth");
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <div className="glass-strong rounded-3xl p-8 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <AnimatePresence mode="wait">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-strong rounded-3xl p-8 md:p-12"
            >
              {/* Title at Top - Spans Full Width */}
              <div className="mb-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <LeafIcon className="w-5 h-5 text-primary" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-center">
                    Welcome to Your Sustainability Journey
                  </h1>
                </div>
                <div className="text-[10px] text-center text-muted-foreground">
                  STEP 1/4
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Left Side - Illustration */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden">
                    <img 
                      src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/452e6a6c-dfb5-4b2f-890f-4242ef400721/generated_images/premium-isometric-illustration-of-a-sust-f36bea66-20251116234646.jpg"
                      alt="Sustainable city with green buildings and nature"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Right Side - Content */}
                <div className="flex-1 text-left">
                  <h2 className="text-xl md:text-2xl font-semibold mb-6">
                    Unlock Instant Impact & Smarter Growth
                  </h2>

                  <div className="space-y-3 mb-8">
                    {[
                      "Effortless Data Integration",
                      "Real-time Carbon Footprint Tracking",
                      "AI-Driven Reduction Recommendations",
                      "Compliance & Reporting Simplified",
                      "Cost Savings Through Efficiency"
                    ].map((feature, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm text-foreground">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                    Our AI-Powered Dashboard transforms complex data into actionable insights, 
                    helping your business thrive while protecting our planet.
                  </p>

                  <div className="flex items-center gap-4">
                    <PremiumButton onClick={() => setStep(2)} size="sm">
                      Get Started
                    </PremiumButton>
                    <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Learn More
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
              className="glass-strong rounded-3xl p-8 md:p-12"
            >
              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-1.5 rounded-full bg-primary" />
                  <div className="flex-1 h-1.5 rounded-full bg-primary" />
                  <div className="flex-1 h-1.5 rounded-full bg-muted/30" />
                  <div className="flex-1 h-1.5 rounded-full bg-muted/30" />
                </div>
                <p className="text-center text-sm font-semibold text-foreground">2/4</p>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Step 2: Connect Your Data Sources
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Seamless Integration for Smarter Insights
              </p>

              {/* Company Details Form */}
              <div className="mb-8 p-6 rounded-xl bg-muted/20 border border-border/50">
                <h3 className="text-sm font-semibold mb-4">First, tell us about your company</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-2">Your Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@company.com"
                      className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2">Company Name *</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2">Industry *</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select industry</option>
                      <option value="technology">Technology</option>
                      <option value="retail">Retail</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="hospitality">Hospitality</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="finance">Finance</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium mb-2">Team Size *</label>
                    <select
                      value={teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select team size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Source Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Utility Bills */}
                <div className="p-5 rounded-xl bg-background border border-primary">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 mx-auto">
                    <Cloud className="w-5 h-5 text-primary" />
                    <BoltIcon className="w-3 h-3 text-primary -ml-1.5 -mt-1.5" />
                  </div>
                  <h3 className="text-xs font-bold mb-2 text-center">Utility Bills</h3>
                  <p className="text-[10px] text-muted-foreground mb-3 text-center min-h-[2.5rem]">
                    Upload utility bills (PDF/Image) for automatic data extraction
                  </p>
                  <PremiumButton 
                    variant="primary" 
                    size="sm" 
                    className="w-full text-[10px] h-7"
                    onClick={() => handleUploadClick('utility')}
                  >
                    Upload Utility Bill
                  </PremiumButton>
                </div>

                {/* Accounting Software */}
                <div className="p-5 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-muted/40 flex items-center justify-center mb-3 mx-auto">
                    <Settings className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-xs font-bold mb-2 text-center">Expense & Accounting Software</h3>
                  <p className="text-[10px] text-muted-foreground mb-3 text-center min-h-[2.5rem]">
                    Connect QuickBooks or Xero for automated data import
                  </p>
                  <PremiumButton 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-[10px] h-7"
                    onClick={() => handleUploadClick('accounting')}
                    disabled={qbConnecting}
                  >
                    {qbConnecting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect Accounting
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </>
                    )}
                  </PremiumButton>
                </div>

                {/* Manual Upload */}
                <div className="p-5 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-muted/40 flex items-center justify-center mb-3 mx-auto">
                    <FolderUp className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-xs font-bold mb-2 text-center">Manual Upload</h3>
                  <p className="text-[10px] text-muted-foreground mb-3 text-center min-h-[2.5rem]">
                    Upload any documents for OCR processing
                  </p>
                  <PremiumButton 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-[10px] h-7"
                    onClick={() => handleUploadClick('manual')}
                  >
                    Upload Files
                  </PremiumButton>
                </div>
              </div>

              {/* Security Notice */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/50 mb-6">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-foreground">
                    Your data is encrypted and secure. We comply with all privacy regulations
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back
                </button>
                <PremiumButton
                  onClick={() => setStep(3)}
                  disabled={!canProceed()}
                  size="sm"
                >
                  Next Step
                </PremiumButton>
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
              className="glass-strong rounded-3xl p-8 md:p-12"
            >
              <div className="text-center mb-8">
                <div className="inline-flex gap-1 mb-3">
                  <div className="w-20 h-1.5 rounded-full bg-primary" />
                  <div className="w-20 h-1.5 rounded-full bg-primary" />
                  <div className="w-20 h-1.5 rounded-full bg-primary" />
                  <div className="w-20 h-1.5 rounded-full bg-muted/30" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-6">
                  Step 3 of 4: Gamify Your Green Journey
                </h2>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                {/* Left - Illustration */}
                <div className="flex-1 flex justify-center">
                  <div className="relative w-64 h-64">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <path d="M60 160 L70 180 L130 180 L140 160 Z" fill="var(--color-muted)" opacity="0.6" />
                      <rect x="95" y="80" width="10" height="80" fill="var(--color-chart-2)" rx="2" />
                      <ellipse cx="80" cy="120" rx="25" ry="15" fill="var(--color-primary)" opacity="0.8" />
                      <ellipse cx="120" cy="110" rx="25" ry="15" fill="var(--color-primary)" opacity="0.8" />
                      <ellipse cx="85" cy="140" rx="20" ry="12" fill="var(--color-chart-2)" opacity="0.7" />
                      <ellipse cx="115" cy="135" rx="20" ry="12" fill="var(--color-chart-2)" opacity="0.7" />
                      <circle cx="100" cy="90" r="30" fill="var(--color-primary)" />
                      <circle cx="90" cy="85" r="3" fill="var(--color-background)" />
                      <circle cx="110" cy="85" r="3" fill="var(--color-background)" />
                      <circle cx="92" cy="90" r="4" fill="#ff6b9d" opacity="0.6" />
                      <circle cx="108" cy="90" r="4" fill="#ff6b9d" opacity="0.6" />
                      <path d="M 90 100 Q 100 105 110 100" stroke="var(--color-background)" strokeWidth="2" fill="none" strokeLinecap="round" />
                      <circle cx="40" cy="80" r="12" fill="var(--color-chart-3)" opacity="0.3" />
                      <text x="40" y="85" textAnchor="middle" fontSize="12" fill="var(--color-foreground)">$</text>
                      <circle cx="160" cy="70" r="12" fill="var(--color-chart-1)" opacity="0.3" />
                      <path d="M155 70 L160 75 L170 62" stroke="var(--color-foreground)" strokeWidth="2" fill="none" />
                      <circle cx="50" cy="140" r="10" fill="var(--color-chart-4)" opacity="0.3" />
                      <circle cx="150" cy="145" r="8" fill="var(--color-chart-5)" opacity="0.3" />
                    </svg>
                  </div>
                </div>

                {/* Right - Content */}
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-bold mb-4">
                    Earn Green Credits & Climb the Leaderboard!
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    Our unique Green Credit system rewards your sustainable actions. The more you reduce your 
                    carbon footprint, recycle, and conserve resources, the more credits you earn. Compete with other 
                    local businesses on the leaderboard to see your impact grow and inspire others. It's fun, rewarding, 
                    and great for your brand!
                  </p>

                  {/* Preview Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Green Credits */}
                    <div className="p-3 rounded-lg bg-background border border-border">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                          <LeafIcon className="w-3 h-3 text-primary" />
                        </div>
                        <h4 className="text-[10px] font-bold">Green Credits</h4>
                      </div>
                      <p className="text-xl font-bold mb-0.5">
                        1,250
                        <span className="text-xs font-normal text-green-500 ml-1.5">+50</span>
                      </p>
                      <p className="text-[9px] text-muted-foreground">Credits earned this month</p>
                    </div>

                    {/* Leaderboard */}
                    <div className="p-3 rounded-lg bg-background border border-border">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                          <Trophy className="w-3 h-3 text-primary" />
                        </div>
                        <div className="flex gap-0.5">
                          <div className="w-1 h-3 bg-chart-2 rounded" />
                          <div className="w-1 h-4 bg-destructive rounded" />
                          <div className="w-1 h-2.5 bg-chart-3 rounded" />
                          <div className="w-1 h-3 bg-muted rounded" />
                        </div>
                      </div>
                      <p className="text-[10px] font-medium mb-0.5">Leaderboard</p>
                      <p className="text-[9px] text-muted-foreground">Your Rank: #7 out of 45 SMEs</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <PremiumButton onClick={() => setStep(4)} size="sm" className="w-full md:w-auto px-6">
                  Explore Initial Recommendations
                </PremiumButton>
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                  >
                    Skip for now
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
              className="glass-strong rounded-3xl p-8 md:p-12"
            >
              <div className="text-center mb-8">
                <div className="inline-flex gap-1 mb-3">
                  <div className="w-16 h-1.5 rounded-full bg-primary" />
                  <div className="w-16 h-1.5 rounded-full bg-primary" />
                  <div className="w-16 h-1.5 rounded-full bg-primary" />
                  <div className="w-16 h-1.5 rounded-full bg-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Step 4 of 4: Your Dashboard Awaits
                </h2>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                  You're all set! Here's a quick overview of what you'll find on your dashboard
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {[
                  {
                    icon: <BarChart3 className="w-4 h-4" />,
                    title: "Carbon Footprint Tracking",
                    desc: "View your real-time emissions data with detailed breakdowns by category"
                  },
                  {
                    icon: <BoltIcon className="w-4 h-4" />,
                    title: "AI Recommendations",
                    desc: "Get personalized suggestions to reduce your environmental impact"
                  },
                  {
                    icon: <Trophy className="w-4 h-4" />,
                    title: "Leaderboard & Credits",
                    desc: "Track your progress and compete with other businesses in your area"
                  },
                  {
                    icon: <FireIcon className="w-4 h-4" />,
                    title: "Detailed Reports",
                    desc: "Generate compliance reports and export data for stakeholders"
                  }
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="p-4 rounded-lg bg-background border border-border"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                      {feature.icon}
                    </div>
                    <h3 className="text-xs font-bold mb-1.5">{feature.title}</h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-3">
                <PremiumButton
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  size="sm"
                  className="w-full md:w-auto px-8"
                >
                  {isSubmitting ? "Setting up..." : "Go to Dashboard"}
                </PremiumButton>
                <button
                  onClick={() => setStep(3)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowUploadDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-strong rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  {uploadType === 'utility' ? 'Upload Utility Bill' : 'Upload Document'}
                </h3>
                <button
                  onClick={() => setShowUploadDialog(false)}
                  className="w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Upload your {uploadType === 'utility' ? 'utility bill' : 'document'} and we'll automatically extract the data using OCR technology.
              </p>
              <DocumentUpload onUploadComplete={handleUploadComplete} />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}