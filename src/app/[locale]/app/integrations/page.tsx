"use client";

import { useState, useEffect, Suspense } from "react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageShell, PageHeader, Section, EmptyState } from "@/components/app/shell";

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

const inputClass =
  "w-full h-11 px-3 rounded-[0.375rem] border border-[var(--app-rule-strong)] bg-[var(--app-surface-1)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

function IntegrationsContent() {
  const t = useTranslations("dashboard.integrations");
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [energyData, setEnergyData] = useState<EnergyPricingData | null>(null);
  const [benchmarkComparison, setBenchmarkComparison] = useState<BenchmarkComparison | null>(null);
  const [loadingEnergy, setLoadingEnergy] = useState(false);
  const [loadingBenchmark, setLoadingBenchmark] = useState(false);
  const [location, setLocation] = useState("CY");
  const [locationType, setLocationType] = useState<"zone" | "zip">("zone");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userLocation, setUserLocation] = useState<string>("CYP");
  const [loadingUserData, setLoadingUserData] = useState(false);

  const [qbConnected, setQbConnected] = useState(false);
  const [qbLoading, setQbLoading] = useState(false);
  const [qbStatus, setQbStatus] = useState<any>(null);

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

      const userRes = await fetch(`/api/users/${session.user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!userRes.ok) throw new Error('Failed to fetch user data');
      const user = await userRes.json();

      const emissionsRes = await fetch(`/api/emissions?userId=${session.user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let totalEmissions = 0;
      if (emissionsRes.ok) {
        const emissionsData = await emissionsRes.json();
        if (emissionsData.emissions && emissionsData.emissions.length > 0) {
          totalEmissions = emissionsData.emissions[0].totalCo2e || 0;
        }
      }

      const employees = user.teamSize ? parseInt(user.teamSize.split('-')[0]) || 50 : 50;

      setUserData({
        id: user.id,
        companyName: user.companyName || user.name || "My Company",
        companyIndustry: user.companyIndustry || "technology",
        teamSize: user.teamSize || "1-50",
        totalEmissions,
        employees,
        revenue: 5000000
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
        setUserLocation(data.country_iso3 || "CYP");
      }
    } catch (error) {
      console.error('Failed to detect location:', error);
    }
  };

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
        headers: { 'Authorization': `Bearer ${token}` }
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
        headers: { 'x-user-id': session.user.id }
      });

      if (!response.ok) throw new Error('Failed to get authorization URL');

      const data = await response.json();
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
        headers: { 'Authorization': `Bearer ${token}` }
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
      const params = new URLSearchParams({ energyUsageKwh: "5000" });

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

  return (
    <PageShell
      header={
        <PageHeader title={t("title")} purpose={t("subtitle")} />
      }
    >
      <Section title={t("quickbooks.name")} description={t("quickbooks.desc")}>
        <div className="app-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="app-tag" data-tone={qbConnected ? "positive" : undefined}>
              {qbConnected ? t("quickbooks.connected") : t("quickbooks.inactive")}
            </span>
            {qbConnected ? (
              <PremiumButton onClick={handleQbDisconnect} disabled={qbLoading} variant="outline" size="sm">
                {qbLoading ? t("quickbooks.disconnecting") : t("quickbooks.disconnect")}
              </PremiumButton>
            ) : (
              <PremiumButton onClick={handleQbConnect} disabled={qbLoading} size="sm">
                {qbLoading ? t("quickbooks.connecting") : t("quickbooks.connect")}
              </PremiumButton>
            )}
          </div>

          {qbConnected && qbStatus && (
            <div className="app-card-inset p-3 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="app-meta">{t("quickbooks.environment")}</span>
                <span className="font-medium capitalize">{qbStatus.environment}</span>
              </div>
              {qbStatus.lastSyncedAt && (
                <div className="flex justify-between text-sm">
                  <span className="app-meta">{t("quickbooks.lastSync")}</span>
                  <span className="app-num font-medium">
                    {new Date(qbStatus.lastSyncedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {qbStatus.isExpired && (
                <p className="app-meta text-destructive">{t("quickbooks.tokenExpired")}</p>
              )}
            </div>
          )}

          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>{t("quickbooks.feature1")}</li>
            <li>{t("quickbooks.feature2")}</li>
            <li>{t("quickbooks.feature3")}</li>
          </ul>
        </div>
      </Section>

      <Section title={t("apiStatus.title")} description={t("apiStatus.subtitle")}>
        <div className="app-ledger">
          {[
            { name: "OpenEI", desc: t("apiStatus.openEIDesc") },
            { name: "WikiRate", desc: t("apiStatus.wikiRateDesc") },
            { name: "Climate TRACE", desc: t("apiStatus.climateTraceDesc") },
            { name: "Electricity Maps", desc: t("apiStatus.electricityMapsDesc") }
          ].map((api, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{api.name}</p>
                <p className="app-meta">{api.desc}</p>
              </div>
              <span className="app-tag" data-tone="positive">{t("apiStatus.live")}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t("energy.title")} description={t("energy.subtitle")}>
        <div className="app-card p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLocationType("zone")}
              className={`app-btn-ghost app-btn ${locationType === "zone" ? "bg-[var(--app-surface-3)]" : ""}`}
            >
              {t("energy.globalZone")}
            </button>
            <button
              onClick={() => { setLocationType("zip"); setLocation("94105"); }}
              className={`app-btn-ghost app-btn ${locationType === "zip" ? "bg-[var(--app-surface-3)]" : ""}`}
            >
              {t("energy.usZip")}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            {locationType === "zone" ? (
              <select value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass}>
                <optgroup label="Cyprus">
                  <option value="CY">Cyprus (EAC grid)</option>
                </optgroup>
                <optgroup label="EU / EEA">
                  <option value="GR">Greece</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="ES">Spain</option>
                  <option value="IT">Italy</option>
                  <option value="NL">Netherlands</option>
                  <option value="SE">Sweden</option>
                  <option value="NO">Norway</option>
                  <option value="DK-DK1">Denmark (West)</option>
                  <option value="DK-DK2">Denmark (East)</option>
                  <option value="EU">EU (continental average)</option>
                </optgroup>
              </select>
            ) : (
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("energy.zipPlaceholder")}
                className={inputClass}
              />
            )}
            <PremiumButton onClick={fetchEnergyData} disabled={loadingEnergy} size="sm">
              {loadingEnergy ? t("energy.loading") : t("energy.fetchData")}
            </PremiumButton>
          </div>

          {locationType === "zone" && (
            <p className="app-meta">{t("energy.globalCoverage")} {t("energy.globalCoverageDesc")}</p>
          )}

          {energyData && (
            <div className="space-y-3">
              {energyData.utilityRates && !energyData.utilityRates.error && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="app-card-inset p-3">
                    <p className="app-label mb-1">{t("energy.rate")}</p>
                    <p className="app-metric text-xl">${energyData.utilityRates.averageRatePerKwh?.toFixed(4)}</p>
                    <p className="app-meta">{t("energy.perKwh")} · {energyData.utilityRates.utility}</p>
                  </div>
                  <div className="app-card-inset p-3">
                    <p className="app-label mb-1">{t("energy.monthlyCost")}</p>
                    <p className="app-metric text-xl">${energyData.utilityRates.monthlyCost?.totalCost?.toFixed(2)}</p>
                    <p className="app-meta">{t("energy.forUsage")}</p>
                  </div>
                </div>
              )}

              {energyData.carbonIntensity && !energyData.carbonIntensity.error && (
                <div className="app-card-inset p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="app-label">{t("energy.carbonIntensity")}</p>
                    <p className="app-meta">
                      {t("energy.renewable", { pct: energyData.carbonIntensity.renewablePercentage?.toFixed(1) })}
                    </p>
                  </div>
                  <p className="app-metric text-xl">{energyData.carbonIntensity.current} gCO₂/kWh</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      <Section title={t("benchmarks.title")} description={t("benchmarks.subtitle")}>
        <div className="app-card p-4 space-y-4">
          {loadingUserData ? (
            <p className="app-meta">{t("benchmarks.loadingCompany")}</p>
          ) : userData ? (
            <div className="app-card-inset p-3 space-y-3">
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <div>
                  <span className="app-label block mb-0.5">{t("benchmarks.company")}</span>
                  <p className="font-medium break-words">{userData.companyName}</p>
                </div>
                <div>
                  <span className="app-label block mb-0.5">{t("benchmarks.industry")}</span>
                  <p className="font-medium capitalize">{userData.companyIndustry}</p>
                </div>
                <div>
                  <span className="app-label block mb-0.5">{t("benchmarks.location")}</span>
                  <p className="font-medium">{userLocation}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <div>
                  <span className="app-label block mb-0.5">{t("benchmarks.teamSize")}</span>
                  <p className="font-medium">{userData.teamSize}</p>
                </div>
                <div>
                  <span className="app-label block mb-0.5">{t("benchmarks.emissions")}</span>
                  <p className="app-num font-medium">{userData.totalEmissions.toFixed(2)} tCO₂e</p>
                </div>
                <div>
                  <span className="app-label block mb-0.5">{t("benchmarks.perEmployee")}</span>
                  <p className="app-num font-medium">{(userData.totalEmissions / userData.employees).toFixed(2)} tCO₂e</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="app-meta">{t("benchmarks.incompleteProfile")}</p>
          )}

          <PremiumButton onClick={fetchBenchmarkComparison} disabled={loadingBenchmark || !userData} size="sm">
            {loadingBenchmark ? t("benchmarks.analyzing") : t("benchmarks.analyze")}
          </PremiumButton>

          {benchmarkComparison && (
            <div className="space-y-3">
              <div className="app-card-inset p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="app-label">{t("benchmarks.performanceRating")}</p>
                  <span className="app-tag" data-tone={benchmarkComparison.interpretation === "NEEDS_IMPROVEMENT" ? "critical" : benchmarkComparison.interpretation === "ABOVE_AVERAGE" ? "caution" : "positive"}>
                    {t(`benchmarks.ratings.${benchmarkComparison.interpretation}` as any)}
                  </span>
                </div>
                <div className="grid gap-3 mt-3 md:grid-cols-2">
                  <div>
                    <p className="app-meta mb-1">{t("benchmarks.vsRegional", { country: benchmarkComparison.location_context.country })}</p>
                    <p className="app-metric text-lg">
                      {benchmarkComparison.vs_average_percent > 0 ? '+' : ''}
                      {benchmarkComparison.vs_average_percent.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="app-meta mb-1">{t("benchmarks.vsGlobal")}</p>
                    <p className="app-metric text-lg">
                      {benchmarkComparison.vs_global_percent > 0 ? '+' : ''}
                      {benchmarkComparison.vs_global_percent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="app-card-inset p-3">
                  <p className="app-label mb-1">{t("benchmarks.regionalPercentile")}</p>
                  <p className="app-metric text-xl">{benchmarkComparison.percentile_rank}th</p>
                  <p className="app-meta">{t("benchmarks.inCountry", { country: benchmarkComparison.location_context.country })}</p>
                </div>
                <div className="app-card-inset p-3">
                  <p className="app-label mb-1">{t("benchmarks.globalPercentile")}</p>
                  <p className="app-metric text-xl">{benchmarkComparison.global_percentile_rank}th</p>
                  <p className="app-meta">{t("benchmarks.worldwide")}</p>
                </div>
                <div className="app-card-inset p-3">
                  <p className="app-label mb-1">{t("benchmarks.countryContext")}</p>
                  <p className="app-metric text-xl">{benchmarkComparison.location_context.user_percentage_of_country.toFixed(6)}%</p>
                  <p className="app-meta">{t("benchmarks.ofCountryTotal", { country: benchmarkComparison.location_context.country })}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="app-card-inset p-3">
                  <p className="app-label mb-2">{t("benchmarks.perEmployeeMetric")}</p>
                  <p className="app-num text-base font-semibold">{benchmarkComparison.emissions_per_employee.toFixed(2)}</p>
                  <p className="app-meta">{t("benchmarks.vsIndustryAvg", { value: benchmarkComparison.industry_emissions_per_employee.toFixed(2) })}</p>
                </div>
                <div className="app-card-inset p-3">
                  <p className="app-label mb-2">{t("benchmarks.perRevenue")}</p>
                  <p className="app-num text-base font-semibold">{benchmarkComparison.emissions_per_revenue.toFixed(2)}</p>
                  <p className="app-meta">{t("benchmarks.vsIndustryAvg", { value: benchmarkComparison.industry_emissions_per_revenue.toFixed(2) })}</p>
                </div>
              </div>

              <div className="app-card-inset p-3">
                <p className="text-sm font-medium mb-2">{t("benchmarks.locationContext", { country: benchmarkComparison.location_context.country })}</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="app-meta">{t("benchmarks.totalCountryEmissions")}</span>
                    <span className="app-num font-medium">
                      {(benchmarkComparison.location_context.country_total_emissions / 1000000).toFixed(2)} Mt CO₂e
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="app-meta">{t("benchmarks.yourContribution")}</span>
                    <span className="app-num font-medium">{benchmarkComparison.location_context.user_percentage_of_country.toFixed(6)}%</span>
                  </div>
                </div>
              </div>

              {benchmarkComparison.recommendations && benchmarkComparison.recommendations.length > 0 && (
                <div className="app-card-inset p-3">
                  <p className="text-sm font-medium mb-2">{t("benchmarks.recommendationsTitle")}</p>
                  <ul className="space-y-2 text-sm">
                    {benchmarkComparison.recommendations.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Section>
    </PageShell>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <PageShell loading header={<PageHeader title="Integrations" />}>
          <div />
        </PageShell>
      }
    >
      <IntegrationsContent />
    </Suspense>
  );
}
