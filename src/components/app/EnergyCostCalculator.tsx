"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useUser } from "@/lib/user-context";
import { useCustomer } from "autumn-js/react";
import { useRouter } from "next/navigation";
import { AlertCircle, Wifi, WifiOff, Lock } from "lucide-react";
import { getEnergyZoneData } from "@/lib/energy-zones";


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
  const { customer, isLoading: isCustomerLoading } = useCustomer();
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
  const hasRealtimeDataAccess = customer?.products?.some(
    (product) => product.id === 'professional' || product.id === 'enterprise'
  ) || false;

  // Detect user's energy zone from database preferences or country code
  useEffect(() => {
    // Priority: user.energyZone > user.countryCode mapped > fallback to geolocation
    const detectZone = async () => {
      let countryCode = user?.countryCode;

      // Fallback to geolocation API if no country code in database
      if (!countryCode) {
        try {
          const response = await fetch('/api/geolocation');
          if (response.ok) {
            const data = await response.json();
            countryCode = data.countryCode;
          }
        } catch (error) {
          console.error('Failed to detect location:', error);
        }
      }

      // Use the comprehensive energy zones library
      const zoneData = getEnergyZoneData(countryCode || 'DE');
      
      setUserZone(zoneData.zone);
      setUserBiddingZone(zoneData.biddingZone || zoneData.zone);
    };

    detectZone();
  }, [user?.countryCode, user?.energyZone]);

  // Fetch data when zone changes OR when currency changes
  useEffect(() => {
    fetchEnergyData();
  }, [userZone, userBiddingZone, refreshTrigger]);

  // Recalculate savings when currency changes
  useEffect(() => {
    if (spotPriceResponse) {
      calculateSavings();
    }
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

  // Show loading state
  if (isCustomerLoading) {
    return (
      <PremiumCard className="p-4">
        <div className="flex items-center justify-center h-48">
          <motion.div
            className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </PremiumCard>
    );
  }

  // Show upgrade prompt if no access
  if (!hasRealtimeDataAccess) {
    return (
      <PremiumCard className="p-4 relative overflow-hidden">
        {/* Blurred preview background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm z-0" />
        
        <div className="relative z-10">
          <div className="mb-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-sm font-bold break-words min-w-0">{t("title")}</h3>
              <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
            <p className="text-[10px] text-muted-foreground break-words">
              {t("subtitle")}
            </p>
          </div>

          {/* Preview content (dimmed) */}
          <div className="opacity-40 space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <p className="text-[9px] text-muted-foreground mb-1 break-words">{t("spotPrice")}</p>
                <p className="text-base font-bold">€••• <span className="text-[10px] font-normal">/MWh</span></p>
              </div>
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                <p className="text-[9px] text-muted-foreground mb-1 break-words">{t("carbonIntensity")}</p>
                <p className="text-base font-bold">••• <span className="text-[10px] font-normal">gCO₂/kWh</span></p>
              </div>
            </div>
            <div className="h-20 rounded-lg bg-muted/50 border border-border" />
            <div className="h-16 rounded-lg bg-muted/30 border border-border" />
          </div>

          {/* Upgrade prompt */}
          <div className="text-center space-y-3">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-1 break-words">
                {t("proFeature")}
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed break-words">
                {t("proBlurb")}
              </p>
            </div>

            <PremiumButton
              onClick={() => router.push('/pricing')}
              className="w-full"
              size="sm"
            >
              <Lock className="w-3 h-3 mr-1.5 flex-shrink-0" />
              <span className="text-[10px] break-words">{t("upgradeCta")}</span>
            </PremiumButton>
          </div>
        </div>
      </PremiumCard>

    );
  }

  if (loading) {
    return (
      <PremiumCard className="p-4">
        <div className="flex items-center justify-center h-48">
          <motion.div
            className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard className="p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold">Energy Cost Calculator</h3>
          {isUsingFallback ? (
            <WifiOff className="w-3.5 h-3.5 text-orange-500" />
          ) : (
            <Wifi className="w-3.5 h-3.5 text-green-500" />
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {dataRegion} • {user?.countryCode || userZone}
        </p>
        {isUsingFallback && (
          <div className="flex items-start gap-1.5 mt-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <AlertCircle className="w-3 h-3 text-orange-600 flex-shrink-0 mt-0.5" />
            <p className="text-[9px] text-orange-600 leading-tight">
              Using regional estimates • Real-time data not available for {dataRegion}
            </p>
          </div>
        )}
      </div>

      {/* Real-time Energy Data */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <motion.div
          className="p-2.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-[9px] text-muted-foreground mb-1">
            Spot Price ({userBiddingZone}) {spotPriceResponse?.fallback && '~'}
          </p>
          <p className="text-base font-bold">
            {formatAmount(convertAmount(spotPriceResponse?.data?.[0]?.price || 0, 'EUR'))}{' '}
            <span className="text-[10px] font-normal">/MWh</span>
          </p>
        </motion.div>

        <motion.div
          className="p-2.5 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-[9px] text-muted-foreground mb-1">
            Carbon Intensity {carbonData?.fallback && '~'}
          </p>
          <p className="text-base font-bold">
            {carbonData?.carbonIntensity || 0}{' '}
            <span className="text-[10px] font-normal">gCO₂/kWh</span>
          </p>
        </motion.div>
      </div>

      {/* Input Controls */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-[10px] font-medium mb-1.5">
            Annual Consumption (kWh)
          </label>
          <input
            type="range"
            min="10000"
            max="200000"
            step="5000"
            value={consumption}
            onChange={(e) => setConsumption(parseInt(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
            <span>10k</span>
            <span className="font-bold text-foreground">{(consumption / 1000).toFixed(0)}k</span>
            <span>200k</span>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-medium mb-1.5">
            Efficiency Gain (%)
          </label>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={efficiencyGain}
            onChange={(e) => setEfficiencyGain(parseInt(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
            <span>5%</span>
            <span className="font-bold text-foreground">{efficiencyGain}%</span>
            <span>50%</span>
          </div>
        </div>
      </div>

      {/* Savings Results */}
      {savings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
            <p className="text-[9px] text-muted-foreground mb-0.5">Annual Savings</p>
            <p className="text-xl font-bold text-green-600">
              {formatAmount(savings.annualSavings)}
            </p>
            <p className="text-[9px] text-muted-foreground mt-1">
              {formatAmount(savings.currentCost)} → {formatAmount(savings.projectedCost)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <p className="text-[9px] text-muted-foreground mb-0.5">CO₂ Cut</p>
              <p className="text-sm font-bold">{savings.co2Reduction.toFixed(1)} <span className="text-[9px] font-normal">t/yr</span></p>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <p className="text-[9px] text-muted-foreground mb-0.5">ROI</p>
              <p className="text-sm font-bold">{savings.roiMonths.toFixed(1)} <span className="text-[9px] font-normal">mo</span></p>
            </div>
          </div>
        </motion.div>
      )}

      <PremiumButton 
        onClick={fetchEnergyData} 
        className="w-full mt-3"
        size="sm"
      >
        <span className="text-[10px]">Refresh Prices</span>
      </PremiumButton>
    </PremiumCard>
  );
}