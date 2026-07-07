"use client";

import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { CurrencySwitcher } from "@/components/ui/CurrencySwitcher";
import { BillingDashboard } from "@/components/billing/BillingDashboard";
import AutumnPricingTable from "@/components/autumn/pricing-table";
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
      toast.error("User not found");
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
        toast.error(error.error || "Failed to save changes");
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
        toast.error(error.error || "Failed to save preferences");
        return;
      }

      await refetchUser();
      await refreshCurrency();
      toast.success("Settings saved successfully! ✅");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save changes");
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
        toast.error("Failed to update notification preferences");
      } else {
        toast.success("Notification preferences updated");
      }
    } catch (error) {
      // Revert on error
      setNotificationPrefs((prev) => ({
        ...prev,
        [key]: !newValue,
      }));
      console.error("Failed to update notification preferences:", error);
      toast.error("Failed to update notification preferences");
    }
  };

  if (isUserLoading || isSessionLoading) {
    return (
      <>
        <AppHeader
          title="Settings"
          subtitle="Manage your account and preferences"
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
        title="Settings"
        subtitle="Manage your account and preferences"
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
          Profile
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
          Billing & Plans
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'notifications'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          Notifications
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <>
          {/* Profile Section */}
          <motion.div
            className="glass-strong rounded-xl p-4 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg border border-border/50 bg-muted/30">
                <ProfileIcon className="w-4 h-4 text-foreground/60" />
              </div>
              <h2 className="text-base font-bold">Profile Information</h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-1.5 bg-muted/50 border border-border rounded-lg text-xs cursor-not-allowed opacity-60"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Email cannot be changed
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your Company"
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5">Industry</label>
                  <select 
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select industry</option>
                    <option value="technology">Technology</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="retail">Retail</option>
                    <option value="hospitality">Hospitality</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Company Size</label>
                  <select 
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
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
          </motion.div>

          {/* Regional & Currency Preferences */}
          <motion.div
            className="glass-strong rounded-xl p-4 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg border border-border/50 bg-muted/30">
                <RegionalIcon className="w-4 h-4 text-foreground/60" />
              </div>
              <h2 className="text-base font-bold">Regional Preferences</h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5">Country/Location</label>
                <select 
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select your country</option>
                  <optgroup label="Africa">
                    <option value="DZ">Algeria</option>
                    <option value="AO">Angola</option>
                    <option value="EG">Egypt</option>
                    <option value="ET">Ethiopia</option>
                    <option value="GH">Ghana</option>
                    <option value="KE">Kenya</option>
                    <option value="MA">Morocco</option>
                    <option value="MZ">Mozambique</option>
                    <option value="NG">Nigeria</option>
                    <option value="ZA">South Africa</option>
                    <option value="TZ">Tanzania</option>
                    <option value="TN">Tunisia</option>
                    <option value="UG">Uganda</option>
                    <option value="ZM">Zambia</option>
                    <option value="ZW">Zimbabwe</option>
                  </optgroup>
                  <optgroup label="Asia">
                    <option value="AE">United Arab Emirates</option>
                    <option value="BD">Bangladesh</option>
                    <option value="CN">China</option>
                    <option value="ID">Indonesia</option>
                    <option value="IL">Israel</option>
                    <option value="IN">India</option>
                    <option value="IQ">Iraq</option>
                    <option value="IR">Iran</option>
                    <option value="JP">Japan</option>
                    <option value="KR">South Korea</option>
                    <option value="KZ">Kazakhstan</option>
                    <option value="MY">Malaysia</option>
                    <option value="PH">Philippines</option>
                    <option value="PK">Pakistan</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="SG">Singapore</option>
                    <option value="TH">Thailand</option>
                    <option value="TR">Turkey</option>
                    <option value="TW">Taiwan</option>
                    <option value="UZ">Uzbekistan</option>
                    <option value="VN">Vietnam</option>
                  </optgroup>
                  <optgroup label="Europe">
                    <option value="AT">Austria</option>
                    <option value="BE">Belgium</option>
                    <option value="CH">Switzerland</option>
                    <option value="CZ">Czech Republic</option>
                    <option value="DE">Germany</option>
                    <option value="DK">Denmark</option>
                    <option value="ES">Spain</option>
                    <option value="FI">Finland</option>
                    <option value="FR">France</option>
                    <option value="GB">United Kingdom</option>
                    <option value="GR">Greece</option>
                    <option value="HU">Hungary</option>
                    <option value="IE">Ireland</option>
                    <option value="IT">Italy</option>
                    <option value="LU">Luxembourg</option>
                    <option value="NL">Netherlands</option>
                    <option value="NO">Norway</option>
                    <option value="PL">Poland</option>
                    <option value="PT">Portugal</option>
                    <option value="RO">Romania</option>
                    <option value="SE">Sweden</option>
                  </optgroup>
                  <optgroup label="North America">
                    <option value="CA">Canada</option>
                    <option value="MX">Mexico</option>
                    <option value="US">United States</option>
                  </optgroup>
                  <optgroup label="Oceania">
                    <option value="AU">Australia</option>
                    <option value="NZ">New Zealand</option>
                  </optgroup>
                  <optgroup label="South America">
                    <option value="AR">Argentina</option>
                    <option value="BO">Bolivia</option>
                    <option value="BR">Brazil</option>
                    <option value="CL">Chile</option>
                    <option value="CO">Colombia</option>
                    <option value="EC">Ecuador</option>
                    <option value="PE">Peru</option>
                    <option value="PY">Paraguay</option>
                    <option value="UY">Uruguay</option>
                    <option value="VE">Venezuela</option>
                  </optgroup>
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Used for energy pricing, compliance requirements, and regional data
                </p>
              </div>

              <div>
                <CurrencySwitcher variant="full" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  All prices and costs will be displayed in this currency. Changes take effect immediately across all pages.
                </p>
              </div>
            </div>

            <PremiumButton 
              size="sm" 
              className="mt-3 text-[10px] h-7"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </PremiumButton>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            className="glass-strong rounded-xl p-4 border-2 border-destructive/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg border border-destructive/30 bg-destructive/10">
                <AlertIcon className="w-4 h-4 text-destructive" />
              </div>
              <h2 className="text-base font-bold text-destructive">Danger Zone</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <PremiumButton variant="outline" size="sm" className="text-[10px] h-7 border-destructive text-destructive hover:bg-destructive hover:text-white">
              Delete Account
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
                Upgrade Your <span className="gradient-text">Plan</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Unlock more features and scale your sustainability impact
              </p>
            </div>
            <AutumnPricingTable />
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'notifications' && (
        <motion.div
          id="notifications"
          className="glass-strong rounded-xl p-4 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg border border-border/50 bg-muted/30">
              <NotificationIcon className="w-4 h-4 text-foreground/60" />
            </div>
            <h2 className="text-base font-bold">Notifications</h2>
          </div>
          
          {prefsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { key: "emissionAlerts" as const, label: "Emission entry notifications", description: "Get notified when emissions data is recorded" },
                { key: "goalAlerts" as const, label: "Goal achievement alerts", description: "Celebrate when you reach sustainability milestones" },
                { key: "leaderboardAlerts" as const, label: "Leaderboard position changes", description: "Track your ranking on the leaderboard" },
                { key: "actionAlerts" as const, label: "Green action completions", description: "Get alerts when you complete green actions" },
                { key: "insightAlerts" as const, label: "AI insights available", description: "Be notified when new AI insights are ready" },
                { key: "complianceAlerts" as const, label: "Compliance requirement alerts", description: "Stay informed about compliance deadlines" },
                { key: "systemAlerts" as const, label: "System alerts", description: "Important system updates and announcements" }
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
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
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
    <Suspense fallback={
      <>
        <AppHeader
          title="Settings"
          subtitle="Manage your account and preferences"
        />
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      </>
    }>
      <SettingsContent />
    </Suspense>
  );
}