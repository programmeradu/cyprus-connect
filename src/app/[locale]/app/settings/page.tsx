"use client";

import { useState, useEffect, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useUser } from "@/lib/user-context";
import { useSession } from "@/lib/auth-client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { BillingDashboard } from "@/components/billing/BillingDashboard";
import { PricingTable } from "@/components/billing/PricingTable";
import {
  PageShell,
  PageHeader,
  PageToolbar,
  ToolbarTabs,
  Section,
  SkeletonMetricRow
} from "@/components/app/shell";
import {
  AVATAR_STYLES,
  ConsoleAvatar,
  useAvatarStyle,
  type AvatarStyleKey,
} from "@/components/app/console/ConsoleAvatar";

const inputClass =
  "w-full h-11 px-3 rounded-[0.375rem] border border-[var(--app-rule-strong)] bg-[var(--app-surface-1)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

function SettingsContent() {
  const t = useTranslations("dashboard.settings");
  const tc = useTranslations("common");
  const { user, isLoading: isUserLoading, refetchUser } = useUser();
  const { data: session, isPending: isSessionLoading } = useSession();
  const { refreshCurrency } = useCurrency();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"profile" | "billing" | "notifications">("profile");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [avatarStyle, setAvatarStyle] = useAvatarStyle();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "billing") setActiveTab("billing");
  }, [searchParams]);

  const [notificationPrefs, setNotificationPrefs] = useState({
    emissionAlerts: true,
    goalAlerts: true,
    leaderboardAlerts: false,
    actionAlerts: true,
    insightAlerts: true,
    complianceAlerts: true,
    systemAlerts: true
  });
  const [prefsLoading, setPrefsLoading] = useState(false);

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
            Authorization: `Bearer ${localStorage.getItem("bearer_token")}`
          }
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
          systemAlerts: data.systemAlerts ?? true
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
      const userResponse = await fetch(`/api/users?id=${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`
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

      const preferencesResponse = await fetch(`/api/users/${user.id}/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`
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

    setNotificationPrefs((prev) => ({ ...prev, [key]: newValue }));

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`
        },
        body: JSON.stringify({
          userId: session.user.id,
          [key]: newValue
        })
      });

      if (!response.ok) {
        setNotificationPrefs((prev) => ({ ...prev, [key]: !newValue }));
        toast.error(t("toast.prefsFail"));
      } else {
        toast.success(t("toast.prefsOk"));
      }
    } catch (error) {
      setNotificationPrefs((prev) => ({ ...prev, [key]: !newValue }));
      console.error("Failed to update notification preferences:", error);
      toast.error(t("toast.prefsFail"));
    }
  };

  const tabs = [
    { key: "profile" as const, label: t("tabProfile") },
    { key: "billing" as const, label: t("tabBilling") },
    { key: "notifications" as const, label: t("tabNotifications") }
  ];

  return (
    <PageShell
      loading={isUserLoading || isSessionLoading}
      header={<PageHeader title={t("title")} purpose={t("subtitle")} />}
      toolbar={
        <PageToolbar>
          <ToolbarTabs
            options={tabs.map((tb) => ({ value: tb.key, label: tb.label }))}
            value={activeTab}
            onChange={(key) => setActiveTab(key)}
          />
        </PageToolbar>
      }
    >
      {activeTab === "profile" && (
        <>
          <Section title={t("profileInformation")}>
            <div className="app-card p-4 space-y-4">
              <div>
                <label className="app-label block mb-1.5">{t("yourName")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="app-label block mb-1.5">{t("email")}</label>
                <input type="email" value={email} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
                <p className="app-meta mt-1.5">{t("emailLocked")}</p>
              </div>
              <div>
                <label className="app-label block mb-1.5">{t("companyName")}</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={t("companyNamePh")}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="app-label block mb-1.5">{t("industry")}</label>
                  <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputClass}>
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
                  <label className="app-label block mb-1.5">{t("companySize")}</label>
                  <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className={inputClass}>
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
          </Section>

          <Section
            title="Avatar character"
            description="Your avatar is drawn from your name. Pick the character family you like."
          >
            <div className="app-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <ConsoleAvatar seed={name || user?.name || "vuneli"} size={48} styleKey={avatarStyle} alt="" />
                <div className="min-w-0">
                  <p className="text-sm font-medium break-words">{name || user?.name || "Your avatar"}</p>
                  <p className="app-meta mt-0.5">{AVATAR_STYLES[avatarStyle]?.label ?? "Sketch people"}</p>
                </div>
              </div>
              <div
                className="grid gap-2.5 grid-cols-3 sm:grid-cols-5"
                role="radiogroup"
                aria-label="Avatar character family"
              >
                {Object.entries(AVATAR_STYLES).map(([key, entry]) => {
                  const selected = key === avatarStyle;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setAvatarStyle(key as AvatarStyleKey)}
                      className={`flex flex-col items-center gap-1.5 rounded-[0.625rem] border p-2.5 text-center transition-colors ${
                        selected
                          ? "border-[var(--app-rule-strong)] ring-2 ring-[var(--app-rule-strong)]"
                          : "border-[var(--app-rule)] hover:border-[var(--app-rule-strong)]"
                      }`}
                    >
                      <ConsoleAvatar
                        seed={name || user?.name || "vuneli"}
                        size={40}
                        styleKey={key as AvatarStyleKey}
                        alt=""
                      />
                      <span className="app-meta leading-tight break-words">{entry.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          <Section title={t("regional")}>
            <div className="app-card p-4 space-y-4">
              <div className="app-card-inset p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Cyprus (CY)</p>
                    <p className="app-meta mt-0.5">Asia/Nicosia · el-CY / en-CY</p>
                  </div>
                  <span className="app-tag" data-tone="positive">EUR €</span>
                </div>
                <p className="app-meta mt-2">
                  Vuneli is Cyprus-native. Jurisdiction, currency, timezone and emission factors are fixed to Cyprus.
                </p>
              </div>
              <button className="app-btn" onClick={handleSave} disabled={isSaving}>
                {isSaving ? tc("saving") : tc("save")}
              </button>
            </div>
          </Section>

          <Section title={t("dangerZone")}>
            <div className="app-card p-4 border-[var(--destructive)]">
              <p className="text-sm text-muted-foreground mb-4">{t("dangerBody")}</p>
              <button className="app-btn-ghost app-btn border-[var(--destructive)] text-[var(--destructive)]">
                {t("deleteAccount")}
              </button>
            </div>
          </Section>
        </>
      )}

      {activeTab === "billing" && (
        <>
          <Section title={t("tabBilling")}>
            <BillingDashboard />
          </Section>
          <Section title={`${t("upgradeTitleA")} ${t("upgradeTitleB")}`} description={t("upgradeSubtitle")}>
            <PricingTable />
          </Section>
        </>
      )}

      {activeTab === "notifications" && (
        <Section title={t("notifications")}>
          {prefsLoading ? (
            <SkeletonMetricRow />
          ) : (
            <div className="app-ledger">
              {[
                { key: "emissionAlerts" as const, label: t("notif.emissionAlertsLabel"), description: t("notif.emissionAlertsDesc") },
                { key: "goalAlerts" as const, label: t("notif.goalAlertsLabel"), description: t("notif.goalAlertsDesc") },
                { key: "leaderboardAlerts" as const, label: t("notif.leaderboardAlertsLabel"), description: t("notif.leaderboardAlertsDesc") },
                { key: "actionAlerts" as const, label: t("notif.actionAlertsLabel"), description: t("notif.actionAlertsDesc") },
                { key: "insightAlerts" as const, label: t("notif.insightAlertsLabel"), description: t("notif.insightAlertsDesc") },
                { key: "complianceAlerts" as const, label: t("notif.complianceAlertsLabel"), description: t("notif.complianceAlertsDesc") },
                { key: "systemAlerts" as const, label: t("notif.systemAlertsLabel"), description: t("notif.systemAlertsDesc") }
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="app-meta mt-0.5">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notificationPrefs[item.key]}
                    onClick={() => handleNotificationToggle(item.key)}
                    className={`app-btn-ghost app-btn shrink-0 !min-h-[2.25rem] !px-3 ${
                      notificationPrefs[item.key] ? "bg-[var(--app-surface-3)]" : ""
                    }`}
                  >
                    {notificationPrefs[item.key] ? "On" : "Off"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </PageShell>
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
    <PageShell loading header={<PageHeader title={t("title")} purpose={t("subtitle")} />}>
      <div />
    </PageShell>
  );
}
