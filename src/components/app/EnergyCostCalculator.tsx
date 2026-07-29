"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useUser } from "@/lib/user-context";
import { useSubscription } from "@/hooks/useSubscription";
import { useRouter } from "next/navigation";
import { getEnergyZoneData } from "@/lib/energy-zones";
import { Metric, MetricRow, EmptyState, SkeletonCards } from "@/components/app/shell";

interface CarbonIntensityData {
  carbonIntensity: number;
  fossilFuelPercentage: number;
  renewablePercentage: number;
  zone: string;
  datetime: string;
  fallback?: boolean;
  region?: string;
  note?: string;
}

interface SpotPriceData {
  unix_timestamp: number;
  price: number;
  unit: string;
}

interface SpotPriceResponse {
  data: SpotPriceData[];
  metadata: {
    bzn: string;
    resolution: string;
  };
  fallback?: boolean;
  region?: string;
  note?: string;
}

interface CostSavings {
  currentCost: number;
  projectedCost: number;
  annualSavings: number;
  co2Reduction: number;
  roiMonths: number;
}

export function EnergyCostCalculator() {
  const t = useTranslations("energyCalc");
  const { convertAmount, formatAmount, selectedCurrency, refreshTrigger } = useCurrency();
  const { user } = useUser();
  const { plan, isLoading: isCustomerLoading } = useSubscription();
  const router = useRouter();
  const [carbonData, setCarbonData] = useState<CarbonIntensityData | null>(null);

  const [spotPriceResponse, setSpotPriceResponse] = useState<SpotPriceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [consumption, setConsumption] = useState<number>(50000);
  const [efficiencyGain, setEfficiencyGain] = useState<number>(20);
  const [savings, setSavings] = useState<CostSavings | null>(null);
  const [userZone, setUserZone] = useState<string>('');
  const [userBiddingZone, setUserBiddingZone] = useState<string>('');

  // Check if user has access to real-time climate data
  const hasRealtimeDataAccess = plan.id === 'pro' || plan.id === 'enterprise';

  // Vuneli is Cyprus-only: use the Cyprus grid profile regardless of IP/user country.
  useEffect(() => {
    const zoneData = getEnergyZoneData('CY');
    setUserZone(zoneData.zone);
    setUserBiddingZone(zoneData.biddingZone || zoneData.zone);
  }, []);

  // Fetch data when zone changes OR when currency changes
  useEffect(() => {
    fetchEnergyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userZone, userBiddingZone, refreshTrigger]);

  // Recalculate savings when currency changes
  useEffect(() => {
    if (spotPriceResponse) {
      calculateSavings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consumption, efficiencyGain, spotPriceResponse, selectedCurrency, refreshTrigger]);

  const fetchEnergyData = async () => {
    if (!hasRealtimeDataAccess) return; // Don't fetch if no access

    setLoading(true);
    try {
      const [carbonRes, priceRes] = await Promise.all([
        fetch(`/api/energy-prices/carbon-intensity?zone=${userZone}`),
        fetch(`/api/energy-prices/spot-prices?bzn=${userBiddingZone}`),
      ]);

      const carbon = await carbonRes.json();
      const price = await priceRes.json();

      setCarbonData(carbon);
      setSpotPriceResponse(price);
    } catch (error) {
      console.error('Failed to fetch energy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSavings = () => {
    if (!spotPriceResponse?.data?.[0]) return;

    const spotPrice = spotPriceResponse.data[0];
    // Convert from EUR/MWh to user's currency per kWh
    const pricePerKWh = convertAmount(spotPrice.price, 'EUR') / 1000;
    const currentAnnualCost = consumption * pricePerKWh;
    const reducedConsumption = consumption * (1 - efficiencyGain / 100);
    const projectedAnnualCost = reducedConsumption * pricePerKWh;
    const annualSavings = currentAnnualCost - projectedAnnualCost;

    const consumptionReduction = consumption - reducedConsumption;
    const co2Reduction = carbonData
      ? (consumptionReduction * carbonData.carbonIntensity) / 1000
      : (consumptionReduction * 0.35);

    // Convert investment cost from EUR to user's currency
    const investmentCost = convertAmount(10000, 'EUR');
    const roiMonths = (investmentCost / annualSavings) * 12;

    setSavings({
      currentCost: currentAnnualCost,
      projectedCost: projectedAnnualCost,
      annualSavings,
      co2Reduction,
      roiMonths,
    });
  };

  const isUsingFallback = carbonData?.fallback || spotPriceResponse?.fallback;
  const dataRegion = carbonData?.region || spotPriceResponse?.region || 'Unknown';

  // Loading state
  if (isCustomerLoading || loading) {
    return <SkeletonCards count={2} />;
  }

  // Upgrade prompt if no access
  if (!hasRealtimeDataAccess) {
    return (
      <EmptyState
        title={t("proFeature")}
        description={t("proBlurb")}
        action={{ label: t("upgradeCta"), onClick: () => router.push('/pricing') }}
      />
    );
  }

  return (
    <div className="app-card p-4">
      <div className="mb-4">
        <h3 className="text-[1.0625rem] font-semibold leading-snug break-words">{t("title")}</h3>
        <p className="app-meta mt-1 break-words">
          {dataRegion} &middot; {user?.countryCode || userZone}
        </p>
        {isUsingFallback && (
          <div className="app-card-inset mt-2 p-2.5">
            <p className="app-meta break-words">{t("fallbackNote", { region: dataRegion })}</p>
          </div>
        )}
      </div>

      {/* Real-time Energy Data */}
      <MetricRow columns={2}>
        <Metric
          label={t("spotPriceZone", { zone: userBiddingZone })}
          value={formatAmount(convertAmount(spotPriceResponse?.data?.[0]?.price || 0, 'EUR'))}
          unit="/MWh"
        />
        <Metric
          label={t("carbonIntensity")}
          value={carbonData?.carbonIntensity || 0}
          unit="gCO₂/kWh"
        />
      </MetricRow>

      {/* Input Controls */}
      <div className="space-y-4 my-4">
        <div>
          <label className="app-label mb-1.5 block">
            {t("annualConsumption")}
          </label>
          <input
            type="range"
            min="10000"
            max="200000"
            step="5000"
            value={consumption}
            onChange={(e) => setConsumption(parseInt(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between app-meta mt-1">
            <span>10k</span>
            <span className="app-num font-medium text-foreground">{(consumption / 1000).toFixed(0)}k</span>
            <span>200k</span>
          </div>
        </div>

        <div>
          <label className="app-label mb-1.5 block">
            {t("efficiencyGain")}
          </label>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={efficiencyGain}
            onChange={(e) => setEfficiencyGain(parseInt(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between app-meta mt-1">
            <span>5%</span>
            <span className="app-num font-medium text-foreground">{efficiencyGain}%</span>
            <span>50%</span>
          </div>
        </div>
      </div>

      {/* Savings Results */}
      {savings && (
        <div className="space-y-3">
          <Metric
            label={t("annualSavings")}
            value={formatAmount(savings.annualSavings)}
            note={`${formatAmount(savings.currentCost)} \u2192 ${formatAmount(savings.projectedCost)}`}
          />

          <MetricRow columns={2}>
            <Metric label={t("co2Cut")} value={savings.co2Reduction.toFixed(1)} unit={t("tPerYr")} />
            <Metric label={t("roi")} value={savings.roiMonths.toFixed(1)} unit={t("mo")} />
          </MetricRow>
        </div>
      )}

      <button
        type="button"
        onClick={fetchEnergyData}
        className="app-btn-ghost app-btn w-full mt-4"
      >
        {t("refresh")}
      </button>
    </div>
  );
}
