"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { Loader2, ExternalLink, CheckCircle2, XCircle, TrendingUp, Activity, MapPin, Globe } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface EnergyPricingData {
  zone: string;
  timestamp: string;
  carbonIntensity: any;
  powerBreakdown: any;
  utilityRates: any;
  costSavings: any;
  forecast: any[];
}

interface BenchmarkComparison {
  company_emissions: number;
  industry_average: number;
  global_average: number;
  regional_average: number;
  percentile_rank: number;
  global_percentile_rank: number;
  vs_average_percent: number;
  vs_global_percent: number;
  interpretation: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'ABOVE_AVERAGE' | 'NEEDS_IMPROVEMENT';
  emissions_per_employee: number;
  industry_emissions_per_employee: number;
  emissions_per_revenue: number;
  industry_emissions_per_revenue: number;
  recommendations: string[];
  location_context: {
    country: string;
    country_total_emissions: number;
    user_percentage_of_country: number;
  };
}

interface UserData {
  id: string;
  companyName: string;
  companyIndustry: string;
  teamSize: string;
  totalEmissions: number;
  employees: number;
  revenue: number;
}

function IntegrationsContent() {
  const t = useTranslations("dashboard.integrations");
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [energyData, setEnergyData] = useState<EnergyPricingData | null>(null);
  const [benchmarkComparison, setBenchmarkComparison] = useState<BenchmarkComparison | null>(null);
  const [loadingEnergy, setLoadingEnergy] = useState(false);
  const [loadingBenchmark, setLoadingBenchmark] = useState(false);
  const [location, setLocation] = useState("US-CAL-CISO");
  const [locationType, setLocationType] = useState<"zone" | "zip">("zone");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userLocation, setUserLocation] = useState<string>("USA");
  const [loadingUserData, setLoadingUserData] = useState(false);
  
  // QuickBooks integration state
  const [qbConnected, setQbConnected] = useState(false);
  const [qbLoading, setQbLoading] = useState(false);
  const [qbStatus, setQbStatus] = useState<any>(null);

  // Fetch user data and auto-detect location on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData();
      autoDetectLocation();
      checkQbConnection();
    }
  }, [session]);

  const fetchUserData = async () => {
    if (!session?.user?.id) return;
    
    setLoadingUserData(true);
    try {
      const token = localStorage.getItem('bearer_token');
      
      // Fetch user profile
      const userRes = await fetch(`/api/users/${session.user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!userRes.ok) throw new Error('Failed to fetch user data');
      const user = await userRes.json();
      
      // Fetch user emissions
      const emissionsRes = await fetch(`/api/emissions?userId=${session.user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let totalEmissions = 0;
      if (emissionsRes.ok) {
        const emissionsData = await emissionsRes.json();
        if (emissionsData.emissions && emissionsData.emissions.length > 0) {
          // Get latest emissions
          totalEmissions = emissionsData.emissions[0].totalCo2e || 0;
        }
      }
      
      // Parse team size to number
      const employees = user.teamSize ? parseInt(user.teamSize.split('-')[0]) || 50 : 50;
      
      setUserData({
        id: user.id,
        companyName: user.companyName || user.name || "My Company",
        companyIndustry: user.companyIndustry || "technology",
        teamSize: user.teamSize || "1-50",
        totalEmissions,
        employees,
        revenue: 5000000 // Default $5M, users can update in benchmark section
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast.error(t("toasts.companyLoadFail"));
    } finally {
      setLoadingUserData(false);
    }
  };

  const autoDetectLocation = async () => {
    try {
      const res = await fetch('/api/geolocation');
      if (res.ok) {
        const data = await res.json();
        setUserLocation(data.country_iso3 || "USA");
      }
    } catch (error) {
      console.error('Failed to detect location:', error);
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const qbSuccess = searchParams.get('qb_success');
    const qbError = searchParams.get('qb_error');
    
    if (qbSuccess === 'true') {
      toast.success(t("toasts.qbConnected"));
      checkQbConnection();
      router.replace('/app/integrations');
    }
    
    if (qbError) {
      const messageMap: Record<string, string> = {
        missing_parameters: t("toasts.qbErrors.missing_parameters"),
        invalid_state: t("toasts.qbErrors.invalid_state"),
        missing_user: t("toasts.qbErrors.missing_user"),
        token_exchange_failed: t("toasts.qbErrors.token_exchange_failed"),
        storage_failed: t("toasts.qbErrors.storage_failed"),
        callback_failed: t("toasts.qbErrors.callback_failed"),
      };
      toast.error(messageMap[qbError] || t("toasts.qbErrors.default"));
      router.replace('/app/integrations');
    }
  }, [searchParams]);

  const checkQbConnection = async () => {
    if (!session?.user?.id) return;
    
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/oauth/quickbooks/tokens?userId=${session.user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setQbConnected(data.connected);
        setQbStatus(data);
      }
    } catch (error) {
      console.error('Failed to check QB connection:', error);
    }
  };

  const handleQbConnect = async () => {
    if (!session?.user?.id) {
      toast.error(t("toasts.qbSignIn"));
      return;
    }
    
    setQbLoading(true);
    
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
      
      // Redirect to QuickBooks OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('QB connect error:', error);
      toast.error(t("toasts.qbConnectFail"));
      setQbLoading(false);
    }
  };

  const handleQbDisconnect = async () => {
    if (!session?.user?.id) return;
    
    setQbLoading(true);
    
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/oauth/quickbooks/tokens?userId=${session.user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setQbConnected(false);
        setQbStatus(null);
        toast.success(t("toasts.qbDisconnected"));
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('QB disconnect error:', error);
      toast.error(t("toasts.qbDisconnectFail"));
    } finally {
      setQbLoading(false);
    }
  };

  const fetchEnergyData = async () => {
    setLoadingEnergy(true);
    try {
      const params = new URLSearchParams({
        energyUsageKwh: "5000"
      });
      
      if (locationType === "zone") {
        params.append("zone", location);
      } else {
        params.append("zipCode", location);
      }
      
      const response = await fetch(`/api/energy-pricing?${params.toString()}`);
      const data = await response.json();
      setEnergyData(data);
    } catch (error) {
      console.error("Error fetching energy data:", error);
      toast.error(t("toasts.energyFail"));
    } finally {
      setLoadingEnergy(false);
    }
  };

  const fetchBenchmarkComparison = async () => {
    if (!userData) {
      toast.error(t("toasts.loadingCompany"));
      return;
    }
    
    setLoadingBenchmark(true);
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/benchmarks/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sector: userData.companyIndustry,
          annual_emissions: userData.totalEmissions,
          employees: userData.employees,
          annual_revenue: userData.revenue,
          country: userLocation,
          userId: userData.id
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch benchmark comparison');
      
      const data = await response.json();
      setBenchmarkComparison(data.comparison);
      toast.success(t("toasts.benchmarkComplete"));
    } catch (error) {
      console.error("Error fetching benchmark data:", error);
      toast.error(t("toasts.benchmarkFail"));
    } finally {
      setLoadingBenchmark(false);
    }
  };

  const getInterpretationColor = (interpretation: string) => {
    const colors = {
      'EXCELLENT': 'text-green-600',
      'GOOD': 'text-green-500',
      'AVERAGE': 'text-blue-500',
      'ABOVE_AVERAGE': 'text-orange-500',
      'NEEDS_IMPROVEMENT': 'text-red-500'
    };
    return colors[interpretation as keyof typeof colors] || 'text-foreground';
  };

  const getInterpretationBg = (interpretation: string) => {
    const colors = {
      'EXCELLENT': 'bg-green-500/10 border-green-500/20',
      'GOOD': 'bg-green-500/10 border-green-500/20',
      'AVERAGE': 'bg-blue-500/10 border-blue-500/20',
      'ABOVE_AVERAGE': 'bg-orange-500/10 border-orange-500/20',
      'NEEDS_IMPROVEMENT': 'bg-red-500/10 border-red-500/20'
    };
    return colors[interpretation as keyof typeof colors] || 'bg-accent/30 border-border/30';
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-1.5">
            <span className="gradient-text">{t("title")}</span>
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Two Column Grid - Primary Integrations */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* QuickBooks Integration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass rounded-2xl p-5 border border-border/50 hover:border-primary/20 transition-all-smooth"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* QuickBooks Custom Icon */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="16" cy="16" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 10v6M10 8h6M16 10v6M10 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-0.5">{t("quickbooks.name")}</h3>
                  <p className="text-[11px] text-muted-foreground">{t("quickbooks.desc")}</p>
                </div>
              </div>
              {qbConnected ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  <span className="text-[10px] font-medium text-green-600">{t("quickbooks.connected")}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted">
                  <XCircle className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground">{t("quickbooks.inactive")}</span>
                </div>
              )}
            </div>

            {qbConnected && qbStatus && (
              <div className="mb-4 p-3 rounded-xl bg-accent/30 border border-border/30 space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">{t("quickbooks.environment")}</span>
                  <span className="font-medium capitalize">{qbStatus.environment}</span>
                </div>
                {qbStatus.lastSyncedAt && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{t("quickbooks.lastSync")}</span>
                    <span className="font-medium">
                      {new Date(qbStatus.lastSyncedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {qbStatus.isExpired && (
                  <div className="mt-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-[10px] text-orange-600">{t("quickbooks.tokenExpired")}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 mb-4">
              {qbConnected ? (
                <PremiumButton
                  onClick={handleQbDisconnect}
                  disabled={qbLoading}
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-8 px-3"
                >
                  {qbLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                      {t("quickbooks.disconnecting")}
                    </>
                  ) : (
                    t("quickbooks.disconnect")
                  )}
                </PremiumButton>
              ) : (
                <PremiumButton
                  onClick={handleQbConnect}
                  disabled={qbLoading}
                  size="sm"
                  className="text-[11px] h-8 px-3"
                >
                  {qbLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                      {t("quickbooks.connecting")}
                    </>
                  ) : (
                    <>
                      {t("quickbooks.connect")}
                      <ExternalLink className="w-3 h-3 ml-1.5" />
                    </>
                  )}
                </PremiumButton>
              )}
            </div>

            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 text-xs">•</span>
                  <span>{t("quickbooks.feature1")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 text-xs">•</span>
                  <span>{t("quickbooks.feature2")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 text-xs">•</span>
                  <span>{t("quickbooks.feature3")}</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Live API Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-5 border border-border/50"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold mb-0.5">{t("apiStatus.title")}</h3>
                <p className="text-[11px] text-muted-foreground">{t("apiStatus.subtitle")}</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { name: "OpenEI", desc: t("apiStatus.openEIDesc"), status: "active" },
                { name: "WikiRate", desc: t("apiStatus.wikiRateDesc"), status: "active" },
                { name: "Climate TRACE", desc: t("apiStatus.climateTraceDesc"), status: "active" },
                { name: "Electricity Maps", desc: t("apiStatus.electricityMapsDesc"), status: "active" }
              ].map((api, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <div>
                      <p className="font-medium text-[11px]">{api.name}</p>
                      <p className="text-[10px] text-muted-foreground">{api.desc}</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-green-600 font-medium uppercase tracking-wide">{t("apiStatus.live")}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Energy Pricing Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-5 border border-border/50"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold mb-0.5">{t("energy.title")}</h3>
                <Globe className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-[11px] text-muted-foreground">{t("energy.subtitle")}</p>
            </div>
          </div>

          <div className="grid gap-3 mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setLocationType("zone")}
                className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                  locationType === "zone"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent/30 text-muted-foreground hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Globe className="w-3 h-3" />
                  {t("energy.globalZone")}
                </div>
              </button>
              <button
                onClick={() => {
                  setLocationType("zip");
                  setLocation("94105");
                }}
                className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                  locationType === "zip"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent/30 text-muted-foreground hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  {t("energy.usZip")}
                </div>
              </button>
            </div>

            <div className="grid md:grid-cols-[1fr_auto] gap-3">
              {locationType === "zone" ? (
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-input bg-background/50 text-[12px] h-9 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <optgroup label="🌍 Africa">
                    <option value="GH">Ghana</option>
                    <option value="NG">Nigeria</option>
                    <option value="ZA">South Africa</option>
                  </optgroup>
                  <optgroup label="🌎 Americas">
                    <option value="US-CAL-CISO">California (US)</option>
                    <option value="US-TEX-ERCO">Texas (US)</option>
                    <option value="US-NY-NYIS">New York (US)</option>
                    <option value="BR-CS">Brazil (Central-South)</option>
                    <option value="CA-ON">Ontario (Canada)</option>
                    <option value="CA-QC">Quebec (Canada)</option>
                  </optgroup>
                  <optgroup label="🌏 Asia & Pacific">
                    <option value="IN-DL">Delhi (India)</option>
                    <option value="IN-KA">Karnataka (India)</option>
                    <option value="CN-NM">Inner Mongolia (China)</option>
                    <option value="JP-TK">Tokyo (Japan)</option>
                    <option value="SG">Singapore</option>
                    <option value="AU-NSW">New South Wales (Australia)</option>
                    <option value="AU-VIC">Victoria (Australia)</option>
                  </optgroup>
                  <optgroup label="🌍 Europe">
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="ES">Spain</option>
                    <option value="IT">Italy</option>
                    <option value="NL">Netherlands</option>
                    <option value="SE">Sweden</option>
                    <option value="NO">Norway</option>
                    <option value="DK-DK1">Denmark (West)</option>
                    <option value="DK-DK2">Denmark (East)</option>
                  </optgroup>
                  <optgroup label="🌐 Continents">
                    <option value="AF">Africa (Continental)</option>
                    <option value="AS">Asia (Continental)</option>
                    <option value="EU">Europe (Continental)</option>
                    <option value="NA">North America (Continental)</option>
                    <option value="OC">Oceania (Continental)</option>
                    <option value="SA">South America (Continental)</option>
                  </optgroup>
                </select>
              ) : (
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("energy.zipPlaceholder")}
                  className="px-3 py-2 rounded-lg border border-input bg-background/50 text-[12px] h-9 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              )}
              <PremiumButton
                onClick={fetchEnergyData}
                disabled={loadingEnergy}
                size="sm"
                className="text-[11px] h-9 px-4"
              >
                {loadingEnergy ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                    {t("energy.loading")}
                  </>
                ) : (
                  t("energy.fetchData")
                )}
              </PremiumButton>
            </div>

            {locationType === "zone" && (
              <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-[10px] text-muted-foreground">
                  <span className="text-primary font-medium">{t("energy.globalCoverage")}</span> {t("energy.globalCoverageDesc")}
                </p>
              </div>
            )}
          </div>

          {energyData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {energyData.utilityRates && !energyData.utilityRates.error && (
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-accent/30 border border-border/30">
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">{t("energy.rate")}</p>
                    <p className="text-xl font-bold text-primary mb-0.5">
                      ${energyData.utilityRates.averageRatePerKwh?.toFixed(4)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{t("energy.perKwh")} • {energyData.utilityRates.utility}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-accent/30 border border-border/30">
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">{t("energy.monthlyCost")}</p>
                    <p className="text-xl font-bold text-primary mb-0.5">
                      ${energyData.utilityRates.monthlyCost?.totalCost?.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{t("energy.forUsage")}</p>
                  </div>
                </div>
              )}

              {energyData.carbonIntensity && !energyData.carbonIntensity.error && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("energy.carbonIntensity")}</p>
                    <p className="text-[10px] text-primary font-medium">
                      {t("energy.renewable", { pct: energyData.carbonIntensity.renewablePercentage?.toFixed(1) })}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-primary">
                    {energyData.carbonIntensity.current} gCO₂/kWh
                  </p>
                </div>
              )}

              {energyData.forecast && energyData.forecast.length > 0 && (
                <div className="p-3 rounded-xl bg-accent/30 border border-border/30">
                  <p className="text-[11px] font-medium mb-3">{t("energy.forecast24h")}</p>
                  <div className="flex items-end gap-0.5 h-20">
                    {energyData.forecast.slice(0, 24).map((f: any, i: number) => (
                      <div
                        key={i}
                        className="flex-1 bg-primary/20 rounded-t hover:bg-primary/40 transition-colors"
                        style={{
                          height: `${(f.carbonIntensity / Math.max(...energyData.forecast.map((d: any) => d.carbonIntensity))) * 100}%`,
                        }}
                        title={`${new Date(f.datetime).getHours()}:00 - ${f.carbonIntensity} gCO₂/kWh`}
                      />
                    ))}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-2">{t("energy.forecastHint")}</p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Industry Benchmarks Section - Now Personalized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5 border border-border/50"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold mb-0.5">{t("benchmarks.title")}</h3>
              <p className="text-[11px] text-muted-foreground">
                {t("benchmarks.subtitle")}
              </p>
            </div>
          </div>

          {/* Company Info Display */}
          {loadingUserData ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="ml-2 text-[12px] text-muted-foreground">{t("benchmarks.loadingCompany")}</span>
            </div>
          ) : userData ? (
            <div className="mb-4 p-3 rounded-xl bg-accent/30 border border-border/30 space-y-2">
              <div className="grid md:grid-cols-3 gap-3 text-[11px]">
                <div>
                  <span className="text-muted-foreground">{t("benchmarks.company")}</span>
                  <p className="font-medium">{userData.companyName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("benchmarks.industry")}</span>
                  <p className="font-medium capitalize">{userData.companyIndustry}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("benchmarks.location")}</span>
                  <p className="font-medium">{userLocation}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-3 text-[11px]">
                <div>
                  <span className="text-muted-foreground">{t("benchmarks.teamSize")}</span>
                  <p className="font-medium">{userData.teamSize}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("benchmarks.emissions")}</span>
                  <p className="font-medium">{userData.totalEmissions.toFixed(2)} tCO₂e</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("benchmarks.perEmployee")}</span>
                  <p className="font-medium">
                    {(userData.totalEmissions / userData.employees).toFixed(2)} tCO₂e
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <p className="text-[11px] text-orange-600">
                {t("benchmarks.incompleteProfile")}
              </p>
            </div>
          )}

          <div className="mb-4">
            <PremiumButton
              onClick={fetchBenchmarkComparison}
              disabled={loadingBenchmark || !userData}
              size="sm"
              className="text-[11px] h-9 px-4 w-full md:w-auto"
            >
              {loadingBenchmark ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                  {t("benchmarks.analyzing")}
                </>
              ) : (
                t("benchmarks.analyze")
              )}
            </PremiumButton>
          </div>

          {benchmarkComparison && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {/* Performance Overview */}
              <div className={`p-4 rounded-xl border ${getInterpretationBg(benchmarkComparison.interpretation)}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("benchmarks.performanceRating")}</p>
                  <p className={`text-sm font-bold ${getInterpretationColor(benchmarkComparison.interpretation)}`}>
                    {t(`benchmarks.ratings.${benchmarkComparison.interpretation}` as any)}
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">{t("benchmarks.vsRegional", { country: benchmarkComparison.location_context.country })}</p>
                    <p className={`text-lg font-bold ${
                      benchmarkComparison.vs_average_percent < 0 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {benchmarkComparison.vs_average_percent > 0 ? '+' : ''}
                      {benchmarkComparison.vs_average_percent.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">{t("benchmarks.vsGlobal")}</p>
                    <p className={`text-lg font-bold ${
                      benchmarkComparison.vs_global_percent < 0 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {benchmarkComparison.vs_global_percent > 0 ? '+' : ''}
                      {benchmarkComparison.vs_global_percent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-accent/30 border border-border/30">
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">{t("benchmarks.regionalPercentile")}</p>
                  <p className="text-xl font-bold text-primary mb-0.5">
                    {benchmarkComparison.percentile_rank}th
                  </p>
                  <p className="text-[10px] text-muted-foreground">{t("benchmarks.inCountry", { country: benchmarkComparison.location_context.country })}</p>
                </div>

                <div className="p-3 rounded-xl bg-accent/30 border border-border/30">
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">{t("benchmarks.globalPercentile")}</p>
                  <p className="text-xl font-bold text-primary mb-0.5">
                    {benchmarkComparison.global_percentile_rank}th
                  </p>
                  <p className="text-[10px] text-muted-foreground">{t("benchmarks.worldwide")}</p>
                </div>

                <div className="p-3 rounded-xl bg-accent/30 border border-border/30">
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">{t("benchmarks.countryContext")}</p>
                  <p className="text-xl font-bold text-primary mb-0.5">
                    {benchmarkComparison.location_context.user_percentage_of_country.toFixed(6)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">{t("benchmarks.ofCountryTotal", { country: benchmarkComparison.location_context.country })}</p>
                </div>
              </div>

              {/* Intensity Metrics */}
              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-accent/30 border border-border/30">
                  <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide">{t("benchmarks.perEmployeeMetric")}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-base font-bold text-foreground">
                      {benchmarkComparison.emissions_per_employee.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("benchmarks.vsIndustryAvg", { value: benchmarkComparison.industry_emissions_per_employee.toFixed(2) })}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-accent/30 border border-border/30">
                  <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide">{t("benchmarks.perRevenue")}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-base font-bold text-foreground">
                      {benchmarkComparison.emissions_per_revenue.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("benchmarks.vsIndustryAvg", { value: benchmarkComparison.industry_emissions_per_revenue.toFixed(2) })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Context */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-[11px] font-medium mb-2">{t("benchmarks.locationContext", { country: benchmarkComparison.location_context.country })}</p>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("benchmarks.totalCountryEmissions")}</span>
                    <span className="font-medium">
                      {(benchmarkComparison.location_context.country_total_emissions / 1000000).toFixed(2)} Mt CO₂e
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("benchmarks.yourContribution")}</span>
                    <span className="font-medium">
                      {benchmarkComparison.location_context.user_percentage_of_country.toFixed(6)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Personalized Recommendations */}
              {benchmarkComparison.recommendations && benchmarkComparison.recommendations.length > 0 && (
                <div className="p-3 rounded-xl bg-accent/30 border border-border/30">
                  <p className="text-[11px] font-medium mb-3">{t("benchmarks.recommendationsTitle")}</p>
                  <ul className="space-y-2">
                    {benchmarkComparison.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-[11px] text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <IntegrationsContent />
    </Suspense>
  );
}