"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  ConsolePage,
  ConsoleTabs,
  Plate,
  PlateGrid,
  Reading,
  ReadingRail,
  Btn,
  Empty,
  Bar,
} from "@/components/app/console/kit";
import { ConnectorTile } from "@/components/app/integrations/ConnectorTile";
import {
  CONNECTORS,
  CATEGORY_LABEL,
  CATEGORY_NOTE,
  CATEGORY_ORDER,
  type Connector,
} from "@/components/app/integrations/catalog";

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
  interpretation: "EXCELLENT" | "GOOD" | "AVERAGE" | "ABOVE_AVERAGE" | "NEEDS_IMPROVEMENT";
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

const ZONES: { group: string; options: { value: string; label: string }[] }[] = [
  { group: "Cyprus", options: [{ value: "CY", label: "Cyprus (EAC grid)" }] },
  {
    group: "EU / EEA",
    options: [
      { value: "GR", label: "Greece" },
      { value: "DE", label: "Germany" },
      { value: "FR", label: "France" },
      { value: "ES", label: "Spain" },
      { value: "IT", label: "Italy" },
      { value: "NL", label: "Netherlands" },
      { value: "SE", label: "Sweden" },
      { value: "NO", label: "Norway" },
      { value: "DK-DK1", label: "Denmark (West)" },
      { value: "DK-DK2", label: "Denmark (East)" },
      { value: "EU", label: "EU (continental average)" },
    ],
  },
];

function IntegrationsContent() {
  const t = useTranslations("dashboard.integrations");
  const locale = (useLocale() === "el" ? "el" : "en") as "en" | "el";
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<"directory" | "energy" | "benchmarks">("directory");

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
      const token = localStorage.getItem("bearer_token");

      const userRes = await fetch(`/api/users/${session.user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userRes.ok) throw new Error("Failed to fetch user data");
      const user = await userRes.json();

      const emissionsRes = await fetch(`/api/emissions?userId=${session.user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let totalEmissions = 0;
      if (emissionsRes.ok) {
        const emissionsData = await emissionsRes.json();
        if (emissionsData.emissions && emissionsData.emissions.length > 0) {
          totalEmissions = emissionsData.emissions[0].totalCo2e || 0;
        }
      }

      const employees = user.teamSize ? parseInt(user.teamSize.split("-")[0]) || 50 : 50;

      setUserData({
        id: user.id,
        companyName: user.companyName || user.name || "My Company",
        companyIndustry: user.companyIndustry || "technology",
        teamSize: user.teamSize || "1-50",
        totalEmissions,
        employees,
        revenue: 5000000,
      });
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      toast.error(t("toasts.companyLoadFail"));
    } finally {
      setLoadingUserData(false);
    }
  };

  const autoDetectLocation = async () => {
    try {
      const res = await fetch("/api/geolocation");
      if (res.ok) {
        const data = await res.json();
        setUserLocation(data.country_iso3 || "CYP");
      }
    } catch (error) {
      console.error("Failed to detect location:", error);
    }
  };

  useEffect(() => {
    const qbSuccess = searchParams.get("qb_success");
    const qbError = searchParams.get("qb_error");

    if (qbSuccess === "true") {
      toast.success(t("toasts.qbConnected"));
      checkQbConnection();
      router.replace("/app/integrations");
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
      router.replace("/app/integrations");
    }
  }, [searchParams]);

  const checkQbConnection = async () => {
    if (!session?.user?.id) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/oauth/quickbooks/tokens?userId=${session.user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setQbConnected(data.connected);
        setQbStatus(data);
      }
    } catch (error) {
      console.error("Failed to check QB connection:", error);
    }
  };

  const handleQbConnect = async () => {
    if (!session?.user?.id) {
      toast.error(t("toasts.qbSignIn"));
      return;
    }

    setQbLoading(true);

    try {
      const response = await fetch("/api/oauth/quickbooks/authorize", {
        headers: { "x-user-id": session.user.id },
      });

      if (!response.ok) throw new Error("Failed to get authorization URL");

      const data = await response.json();
      window.location.href = data.authUrl;
    } catch (error) {
      console.error("QB connect error:", error);
      toast.error(t("toasts.qbConnectFail"));
      setQbLoading(false);
    }
  };

  const handleQbDisconnect = async () => {
    if (!session?.user?.id) return;

    setQbLoading(true);

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/oauth/quickbooks/tokens?userId=${session.user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setQbConnected(false);
        setQbStatus(null);
        toast.success(t("toasts.qbDisconnected"));
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch (error) {
      console.error("QB disconnect error:", error);
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
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/benchmarks/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sector: userData.companyIndustry,
          annual_emissions: userData.totalEmissions,
          employees: userData.employees,
          annual_revenue: userData.revenue,
          country: userLocation,
          userId: userData.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch benchmark comparison");

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

  /* ---- derived counts. Read from the catalogue and the live link. ---- */
  const liveCount = CONNECTORS.filter((c) => c.state === "live").length;
  const linkedCount = qbConnected ? 1 : 0;
  const readyCount = CONNECTORS.filter((c) => c.state === "oauth").length - linkedCount;
  const coverage = Math.round(((liveCount + linkedCount) / CONNECTORS.length) * 100);

  const actionFor = (c: Connector) => {
    if (c.id === "quickbooks") {
      return qbConnected ? (
        <Btn onClick={handleQbDisconnect} disabled={qbLoading}>
          {qbLoading ? t("quickbooks.disconnecting") : t("quickbooks.disconnect")}
        </Btn>
      ) : (
        <Btn variant="primary" onClick={handleQbConnect} disabled={qbLoading}>
          {qbLoading ? t("quickbooks.connecting") : t("quickbooks.connect")}
        </Btn>
      );
    }
    if (c.state === "live") {
      return (
        <Btn onClick={() => { setTab(c.category === "grid" ? "energy" : "benchmarks"); }}>
          {locale === "el" ? "Δείτε τα δεδομένα" : "See the data"}
        </Btn>
      );
    }
    return null;
  };

  const detailFor = (c: Connector) => {
    if (c.id !== "quickbooks" || !qbConnected || !qbStatus) return null;
    return (
      <div className="vci-tile-detail">
        <div>
          <span>{t("quickbooks.environment")}</span>
          <strong className="capitalize">{qbStatus.environment}</strong>
        </div>
        {qbStatus.lastSyncedAt && (
          <div>
            <span>{t("quickbooks.lastSync")}</span>
            <strong className="vck-num">
              {new Date(qbStatus.lastSyncedAt).toLocaleDateString()}
            </strong>
          </div>
        )}
        {qbStatus.isExpired && <div>{t("quickbooks.tokenExpired")}</div>}
      </div>
    );
  };

  const statusFor = (c: Connector) => {
    if (c.id === "quickbooks" && qbConnected) {
      return { word: t("quickbooks.connected"), tone: "good" as const };
    }
    return undefined;
  };

  return (
    <ConsolePage
      title={t("title")}
      purpose={
        locale === "el"
          ? "Κάθε αριθμός στην πλατφόρμα προέρχεται από μία από αυτές τις πηγές."
          : "Every figure in the workspace comes from one of these sources."
      }
      toolbar={
        <ConsoleTabs
          items={[
            {
              key: "directory",
              label: locale === "el" ? "Κατάλογος" : "Directory",
              count: CONNECTORS.length,
            },
            { key: "energy", label: locale === "el" ? "Δίκτυο" : "Grid and tariffs" },
            { key: "benchmarks", label: t("benchmarks.title") },
          ]}
          value={tab}
          onChange={(k) => setTab(k as typeof tab)}
        />
      }
    >
      <ReadingRail>
        <Reading
          label={locale === "el" ? "Ενεργές ροές" : "Live feeds"}
          value={liveCount}
          note={locale === "el" ? "χωρίς σύνδεση λογαριασμού" : "no account needed"}
        />
        <Reading
          label={locale === "el" ? "Συνδεδεμένοι λογαριασμοί" : "Linked accounts"}
          value={linkedCount}
          note={
            readyCount > 0
              ? locale === "el"
                ? `${readyCount} έτοιμος για σύνδεση`
                : `${readyCount} ready to link`
              : locale === "el"
                ? "όλοι συνδεδεμένοι"
                : "all linked"
          }
        />
        <Reading
          label={locale === "el" ? "Στον κατάλογο" : "In the catalogue"}
          value={CONNECTORS.length}
          note={locale === "el" ? "σε 4 κατηγορίες" : "across 4 categories"}
        />
        <Reading
          label={locale === "el" ? "Κάλυψη πηγών" : "Source coverage"}
          value={`${coverage}%`}
          note={<Bar pct={coverage} />}
        />
      </ReadingRail>

      {tab === "directory" &&
        CATEGORY_ORDER.map((cat) => {
          const items = CONNECTORS.filter((c) => c.category === cat);
          if (items.length === 0) return null;
          return (
            <Plate key={cat} label={CATEGORY_LABEL[cat][locale]} meta={`${items.length}`}>
              <p className="vci-group-note">{CATEGORY_NOTE[cat][locale]}</p>
              <div className="vci-grid">
                {items.map((c) => (
                  <ConnectorTile
                    key={c.id}
                    connector={c}
                    locale={locale}
                    status={statusFor(c)}
                    action={actionFor(c)}
                    detail={detailFor(c)}
                  />
                ))}
              </div>
            </Plate>
          );
        })}

      {tab === "energy" && (
        <>
          <Plate label={t("energy.title")} meta={locationType === "zone" ? location : "US ZIP"}>
            <p className="vci-group-note">{t("energy.subtitle")}</p>

            <div className="flex flex-wrap gap-2 mb-3">
              <Btn
                variant={locationType === "zone" ? "primary" : "quiet"}
                onClick={() => { setLocationType("zone"); setLocation("CY"); }}
              >
                {t("energy.globalZone")}
              </Btn>
              <Btn
                variant={locationType === "zip" ? "primary" : "quiet"}
                onClick={() => { setLocationType("zip"); setLocation("94105"); }}
              >
                {t("energy.usZip")}
              </Btn>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              {locationType === "zone" ? (
                <select
                  className="vck-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  aria-label={t("energy.globalZone")}
                >
                  {ZONES.map((g) => (
                    <optgroup key={g.group} label={g.group}>
                      {g.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              ) : (
                <input
                  className="vck-input"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("energy.zipPlaceholder")}
                  aria-label={t("energy.usZip")}
                />
              )}
              <Btn variant="primary" onClick={fetchEnergyData} disabled={loadingEnergy}>
                {loadingEnergy ? t("energy.loading") : t("energy.fetchData")}
              </Btn>
            </div>

            {locationType === "zone" && (
              <p className="vci-group-note" style={{ margin: "12px 0 0" }}>
                {t("energy.globalCoverage")} {t("energy.globalCoverageDesc")}
              </p>
            )}
          </Plate>

          {energyData ? (
            <PlateGrid>
              {energyData.carbonIntensity && !energyData.carbonIntensity.error && (
                <Plate
                  label={t("energy.carbonIntensity")}
                  foot={`Electricity Maps · ${energyData.zone}`}
                >
                  <ReadingRail>
                    <Reading
                      label={t("energy.carbonIntensity")}
                      value={energyData.carbonIntensity.current}
                      unit="gCO₂/kWh"
                    />
                    <Reading
                      label={locale === "el" ? "Ανανεώσιμα" : "Renewable share"}
                      value={`${energyData.carbonIntensity.renewablePercentage?.toFixed(1) ?? "—"}%`}
                      note={<Bar pct={energyData.carbonIntensity.renewablePercentage ?? 0} />}
                    />
                  </ReadingRail>
                </Plate>
              )}

              {energyData.utilityRates && !energyData.utilityRates.error && (
                <Plate label={t("energy.rate")} foot={`OpenEI · ${energyData.utilityRates.utility}`}>
                  <ReadingRail>
                    <Reading
                      label={t("energy.rate")}
                      value={`$${energyData.utilityRates.averageRatePerKwh?.toFixed(4)}`}
                      note={t("energy.perKwh")}
                    />
                    <Reading
                      label={t("energy.monthlyCost")}
                      value={`$${energyData.utilityRates.monthlyCost?.totalCost?.toFixed(2)}`}
                      note={t("energy.forUsage")}
                    />
                  </ReadingRail>
                </Plate>
              )}
            </PlateGrid>
          ) : (
            <Empty
              title={locale === "el" ? "Καμία μέτρηση ακόμη" : "No reading yet"}
              body={
                locale === "el"
                  ? "Επιλέξτε ζώνη δικτύου και πάρτε την τρέχουσα ένταση άνθρακα και το τιμολόγιο."
                  : "Pick a grid zone, then pull the current carbon intensity and tariff."
              }
              action={{ label: t("energy.fetchData"), onClick: fetchEnergyData }}
            />
          )}
        </>
      )}

      {tab === "benchmarks" && (
        <>
          <Plate
            label={t("benchmarks.title")}
            action={
              <Btn variant="primary" onClick={fetchBenchmarkComparison} disabled={loadingBenchmark || !userData}>
                {loadingBenchmark ? t("benchmarks.analyzing") : t("benchmarks.analyze")}
              </Btn>
            }
            foot="WikiRate · Climate TRACE"
          >
            {loadingUserData ? (
              <p className="vck-quiet">{t("benchmarks.loadingCompany")}</p>
            ) : userData ? (
              <ReadingRail>
                <Reading label={t("benchmarks.company")} value={userData.companyName} />
                <Reading
                  label={t("benchmarks.industry")}
                  value={<span className="capitalize">{userData.companyIndustry}</span>}
                  note={`${t("benchmarks.location")} ${userLocation}`}
                />
                <Reading
                  label={t("benchmarks.emissions")}
                  value={userData.totalEmissions.toFixed(2)}
                  unit="tCO₂e"
                />
                <Reading
                  label={t("benchmarks.perEmployee")}
                  value={(userData.totalEmissions / userData.employees).toFixed(2)}
                  unit="tCO₂e"
                  note={`${t("benchmarks.teamSize")} ${userData.teamSize}`}
                />
              </ReadingRail>
            ) : (
              <Empty
                title={t("benchmarks.incompleteProfile")}
                body={
                  locale === "el"
                    ? "Η σύγκριση χρειάζεται κλάδο, μέγεθος ομάδας και ετήσιες εκπομπές."
                    : "The comparison needs a sector, a team size and an annual emissions figure."
                }
                action={{ label: locale === "el" ? "Άνοιγμα ρυθμίσεων" : "Open settings", href: "/app/settings" }}
              />
            )}
          </Plate>

          {benchmarkComparison && (
            <>
              <Plate
                label={t("benchmarks.performanceRating")}
                meta={t(`benchmarks.ratings.${benchmarkComparison.interpretation}` as any)}
                metaTone={
                  benchmarkComparison.interpretation === "NEEDS_IMPROVEMENT"
                    ? "bad"
                    : benchmarkComparison.interpretation === "ABOVE_AVERAGE"
                      ? "warn"
                      : "good"
                }
              >
                <ReadingRail>
                  <Reading
                    label={t("benchmarks.vsRegional", {
                      country: benchmarkComparison.location_context.country,
                    })}
                    value={`${benchmarkComparison.vs_average_percent > 0 ? "+" : ""}${benchmarkComparison.vs_average_percent.toFixed(1)}%`}
                    tone={benchmarkComparison.vs_average_percent > 0 ? "bad" : "good"}
                  />
                  <Reading
                    label={t("benchmarks.vsGlobal")}
                    value={`${benchmarkComparison.vs_global_percent > 0 ? "+" : ""}${benchmarkComparison.vs_global_percent.toFixed(1)}%`}
                    tone={benchmarkComparison.vs_global_percent > 0 ? "bad" : "good"}
                  />
                  <Reading
                    label={t("benchmarks.regionalPercentile")}
                    value={`${benchmarkComparison.percentile_rank}th`}
                    note={t("benchmarks.inCountry", {
                      country: benchmarkComparison.location_context.country,
                    })}
                  />
                  <Reading
                    label={t("benchmarks.globalPercentile")}
                    value={`${benchmarkComparison.global_percentile_rank}th`}
                    note={t("benchmarks.worldwide")}
                  />
                </ReadingRail>
              </Plate>

              <PlateGrid>
                <Plate label={t("benchmarks.perEmployeeMetric")}>
                  <Reading
                    label={t("benchmarks.perEmployeeMetric")}
                    value={benchmarkComparison.emissions_per_employee.toFixed(2)}
                    unit="tCO₂e"
                    note={t("benchmarks.vsIndustryAvg", {
                      value: benchmarkComparison.industry_emissions_per_employee.toFixed(2),
                    })}
                  />
                </Plate>
                <Plate label={t("benchmarks.perRevenue")}>
                  <Reading
                    label={t("benchmarks.perRevenue")}
                    value={benchmarkComparison.emissions_per_revenue.toFixed(2)}
                    unit="tCO₂e"
                    note={t("benchmarks.vsIndustryAvg", {
                      value: benchmarkComparison.industry_emissions_per_revenue.toFixed(2),
                    })}
                  />
                </Plate>
                <Plate
                  label={t("benchmarks.locationContext", {
                    country: benchmarkComparison.location_context.country,
                  })}
                >
                  <Reading
                    label={t("benchmarks.totalCountryEmissions")}
                    value={(
                      benchmarkComparison.location_context.country_total_emissions / 1000000
                    ).toFixed(2)}
                    unit="Mt CO₂e"
                    note={`${t("benchmarks.yourContribution")} ${benchmarkComparison.location_context.user_percentage_of_country.toFixed(6)}%`}
                  />
                </Plate>
              </PlateGrid>

              {benchmarkComparison.recommendations?.length > 0 && (
                <Plate label={t("benchmarks.recommendationsTitle")}>
                  <ul className="vck-list">
                    {benchmarkComparison.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </Plate>
              )}
            </>
          )}
        </>
      )}
    </ConsolePage>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <ConsolePage title="Integrations" loading>
          <div />
        </ConsolePage>
      }
    >
      <IntegrationsContent />
    </Suspense>
  );
}
