"use client";

import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/app/AppHeader";
import { PremiumButton } from "@/components/ui/PremiumButton";

import { BillingDashboard } from "@/components/billing/BillingDashboard";
import { PricingTable } from "@/components/billing/PricingTable";
import { useUser } from "@/lib/user-context";
import { useSession } from "@/lib/auth-client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

// Custom transparent SVG icons
const ProfileIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="8" r="4" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const RegionalIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
    <path d="M12 3c2.5 3 2.5 6 0 9s-2.5 6 0 9" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M3 12h18" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const NotificationIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="9" x2="12" y2="13" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="17" r="0.5" fill="currentColor" />
  </svg>
);

function SettingsContent() {
  const t = useTranslations("dashboard.settings");
  const tc = useTranslations("common");
  const { user, isLoading: isUserLoading, refetchUser } = useUser();
  const { data: session, isPending: isSessionLoading } = useSession();
  const { refreshCurrency } = useCurrency();
  const { subscription } = useSubscription();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'notifications'>('profile');
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Check for billing tab in URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'billing') {
      setActiveTab('billing');
    }
  }, [searchParams]);

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    emissionAlerts: true,
    goalAlerts: true,
    leaderboardAlerts: false,
    actionAlerts: true,
    insightAlerts: true,
    complianceAlerts: true,
    systemAlerts: true,
  });
  const [prefsLoading, setPrefsLoading] = useState(false);

  // Load user data when available
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setCompanyName(user.companyName || "");
      setIndustry(user.companyIndustry || "");
      setTeamSize(user.teamSize || "");
      setCountryCode(user.countryCode || "");
    } else if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [user, session]);

  // Load notification preferences
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotificationPreferences();
    }
  }, [session?.user?.id]);

  const fetchNotificationPreferences = async () => {
    if (!session?.user?.id) return;

    try {
      setPrefsLoading(true);
      const response = await fetch(
        `/api/notifications/preferences?userId=${session.user.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotificationPrefs({
          emissionAlerts: data.emissionAlerts ?? true,
          goalAlerts: data.goalAlerts ?? true,
          leaderboardAlerts: data.leaderboardAlerts ?? false,
          actionAlerts: data.actionAlerts ?? true,
          insightAlerts: data.insightAlerts ?? true,
          complianceAlerts: data.complianceAlerts ?? true,
          systemAlerts: data.systemAlerts ?? true,
        });
      }
    } catch (error) {
      console.error("Failed to fetch notification preferences:", error);
    } finally {
      setPrefsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error(t("toast.userNotFound"));
      return;
    }

    setIsSaving(true);

    try {
      // Save to user table
      const userResponse = await fetch(`/api/users?id=${user.id}`, {
        method: "PUT",
        headers: {
 "Content-Type": "application/json",
 "Authorization": `Bearer ${localStorage.getItem("bearer_token")}`
        },
        body: JSON.stringify({
          name,
          companyName,
          companyIndustry: industry,
          teamSize,
          countryCode: countryCode || null
        })
      });

      if (!userResponse.ok) {
        const error = await userResponse.json();
        toast.error(error.error || t("toast.saveFail"));
        return;
      }

      // Save preferences (country)
      const preferencesResponse = await fetch(`/api/users/${user.id}/preferences`, {
        method: "PUT",
        headers: {
 "Content-Type": "application/json",
 "Authorization": `Bearer ${localStorage.getItem("bearer_token")}`
        },
        body: JSON.stringify({
          countryCode: countryCode || null
        })
      });

      if (!preferencesResponse.ok) {
        const error = await preferencesResponse.json();
        toast.error(error.error || t("toast.saveFail"));
        return;
      }

      await refetchUser();
      await refreshCurrency();
      toast.success(t("toast.saveOk"));
    } catch (error) {
      console.error("Save error:", error);
      toast.error(t("toast.saveFail"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationToggle = async (key: keyof typeof notificationPrefs) => {
    if (!session?.user?.id) return;

    const newValue = !notificationPrefs[key];
    
    // Optimistic update
    setNotificationPrefs((prev) => ({
      ...prev,
      [key]: newValue,
    }));

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: {
 "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
        body: JSON.stringify({
          userId: session.user.id,
          [key]: newValue,
        }),
      });

      if (!response.ok) {
        // Revert on error
        setNotificationPrefs((prev) => ({
          ...prev,
          [key]: !newValue,
        }));
        toast.error(t("toast.prefsFail"));
      } else {
        toast.success(t("toast.prefsOk"));
      }
    } catch (error) {
      // Revert on error
      setNotificationPrefs((prev) => ({
        ...prev,
        [key]: !newValue,
      }));
      console.error("Failed to update notification preferences:", error);
      toast.error(t("toast.prefsFail"));
    }
  };

  if (isUserLoading || isSessionLoading) {
    return (
      <>
        <AppHeader
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 border-b border-border/50 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'profile'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          {t("tabProfile")}
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          data-tab="billing"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'billing'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          {t("tabBilling")}
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'notifications'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          {t("tabNotifications")}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <>
          {/* Profile Section */}
          <motion.div
            className="surface-card p-4 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg border border-border/50 bg-muted/30">
                <ProfileIcon className="w-4 h-4 text-foreground/60" />
              </div>
              <h2 className="text-base font-bold">{t("profileInformation")}</h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5">{t("yourName")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">{t("email")}</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-1.5 bg-muted/50 border border-border rounded-lg text-xs cursor-not-allowed opacity-60"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {t("emailLocked")}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">{t("companyName")}</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={t("companyNamePh")}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5">{t("industry")}</label>
                  <select 
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">{t("selectIndustry")}</option>
                    <option value="technology">{t("industries.technology")}</option>
                    <option value="manufacturing">{t("industries.manufacturing")}</option>
                    <option value="retail">{t("industries.retail")}</option>
                    <option value="hospitality">{t("industries.hospitality")}</option>
                    <option value="healthcare">{t("industries.healthcare")}</option>
                    <option value="finance">{t("industries.finance")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">{t("companySize")}</label>
                  <select 
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">{t("selectTeamSize")}</option>
                    <option value="1-10">{t("teamSizes.1-10")}</option>
                    <option value="11-50">{t("teamSizes.11-50")}</option>
                    <option value="51-200">{t("teamSizes.51-200")}</option>
                    <option value="201-500">{t("teamSizes.201-500")}</option>
                    <option value="500+">{t("teamSizes.500+")}</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Regional & Currency Preferences */}
          <motion.div
            className="surface-card p-4 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg border border-border/50 bg-muted/30">
                <RegionalIcon className="w-4 h-4 text-foreground/60" />
              </div>
              <h2 className="text-base font-bold">{t("regional")}</h2>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">🇨🇾 Cyprus (CY)</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Asia/Nicosia · el-CY / en-CY</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">EUR €</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Vuneli is Cyprus-native. Jurisdiction, currency, timezone and emission factors are fixed to Cyprus.
                </p>
              </div>
            </div>

            <PremiumButton 
              size="sm" 
              className="mt-3 text-[10px] h-7"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? tc("saving") : tc("save")}
            </PremiumButton>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            className="surface-card p-4 border-2 border-destructive/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg border border-destructive/30 bg-destructive/10">
                <AlertIcon className="w-4 h-4 text-destructive" />
              </div>
              <h2 className="text-base font-bold text-destructive">{t("dangerZone")}</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {t("dangerBody")}
            </p>
            <PremiumButton variant="outline" size="sm" className="text-[10px] h-7 border-destructive text-destructive hover:bg-destructive hover:text-primary-foreground">
              {t("deleteAccount")}
            </PremiumButton>
          </motion.div>
        </>
      )}

      {activeTab === 'billing' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BillingDashboard />
          
          {/* Upgrade Section */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-1">
                {t("upgradeTitleA")} <span className="text-primary">{t("upgradeTitleB")}</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("upgradeSubtitle")}
              </p>
            </div>
            <PricingTable />
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'notifications' && (
        <motion.div
          id="notifications"
          className="surface-card p-4 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg border border-border/50 bg-muted/30">
              <NotificationIcon className="w-4 h-4 text-foreground/60" />
            </div>
            <h2 className="text-base font-bold">{t("notifications")}</h2>
          </div>
          
          {prefsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { key: "emissionAlerts" as const, label: t("notif.emissionAlertsLabel"), description: t("notif.emissionAlertsDesc") },
                { key: "goalAlerts" as const, label: t("notif.goalAlertsLabel"), description: t("notif.goalAlertsDesc") },
                { key: "leaderboardAlerts" as const, label: t("notif.leaderboardAlertsLabel"), description: t("notif.leaderboardAlertsDesc") },
                { key: "actionAlerts" as const, label: t("notif.actionAlertsLabel"), description: t("notif.actionAlertsDesc") },
                { key: "insightAlerts" as const, label: t("notif.insightAlertsLabel"), description: t("notif.insightAlertsDesc") },
                { key: "complianceAlerts" as const, label: t("notif.complianceAlertsLabel"), description: t("notif.complianceAlertsDesc") },
                { key: "systemAlerts" as const, label: t("notif.systemAlertsLabel"), description: t("notif.systemAlertsDesc") }
              ].map((item, i) => (
                <div key={i} className="flex items-start justify-between p-2.5 rounded-lg bg-muted/30">
                  <div className="flex-1 pr-3">
                    <span className="text-xs font-medium block">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground">{item.description}</span>
                  </div>
                  <button
                    onClick={() => handleNotificationToggle(item.key)}
                    className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                      notificationPrefs[item.key] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform ${
                        notificationPrefs[item.key] ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsFallback() {
  const t = useTranslations("dashboard.settings");
  return (
    <>
      <AppHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    </>
  );
}