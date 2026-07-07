"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useSession } from "@/lib/auth-client";
import { useUser } from "@/lib/user-context";
import { useCustomer } from "autumn-js/react";
import { useRouter } from "next/navigation";
import { Globe, MapPin, TrendingUp, TrendingDown, Loader2, Lock } from "lucide-react";


interface CompanyData {
  sector: string;
  annual_emissions: number;
  employees: number;
  annual_revenue: number;
  country?: string;
  userId?: string;
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

const SECTOR_KEYS = ['retail','manufacturing','hospitality','technology','logistics','food-service'] as const;

export function BenchmarkComparator() {
  const t = useTranslations("benchmark");
  const { data: session } = useSession();
  const { user } = useUser();
  const { customer, isLoading: isCustomerLoading } = useCustomer();
  const router = useRouter();

  
  const [companyData, setCompanyData] = useState<CompanyData>({
    sector: 'retail',
    annual_emissions: 0,
    employees: 0,
    annual_revenue: 0,
  });
  const [comparison, setComparison] = useState<BenchmarkComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>('');
  const [loadingLocation, setLoadingLocation] = useState(true);

  // Check if user has access to industry benchmarking
  const hasBenchmarkingAccess = customer?.products?.some(
    (product) => product.id === 'professional' || product.id === 'enterprise'
  ) || false;

  // Use user's country from database, fallback to geolocation API
  useEffect(() => {
    const detectLocation = async () => {
      // First, try to use user's stored countryCode from database
      if (user?.countryCode) {
        setUserCountry(user.countryCode);
        setLoadingLocation(false);
        return;
      }

      // Fallback to geolocation API if not in database
      try {
        const response = await fetch('/api/geolocation');
        if (response.ok) {
          const data = await response.json();
          setUserCountry(data.countryCode || 'US');
        } else {
          setUserCountry('US');
        }
      } catch (error) {
        console.error('Failed to detect location:', error);
        setUserCountry('US');
      } finally {
        setLoadingLocation(false);
      }
    };

    detectLocation();
  }, [user?.countryCode]);

  // Pre-fill with user data if available
  useEffect(() => {
    if (user && user.companyIndustry) {
      const sectorMap: Record<string, string> = {
        'technology': 'technology',
        'retail': 'retail',
        'manufacturing': 'manufacturing',
        'hospitality': 'hospitality',
        'logistics': 'logistics',
        'food': 'food-service',
      };
      
      const mappedSector = sectorMap[user.companyIndustry.toLowerCase()] || 'retail';
      
      setCompanyData(prev => ({
        ...prev,
        sector: mappedSector,
        userId: user.id,
      }));
    }
  }, [user]);

  const handleCompare = async () => {
    if (!companyData.annual_emissions || !companyData.employees || !companyData.annual_revenue) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...companyData,
        country: userCountry,
        userId: session?.user?.id,
      };

      const response = await fetch('/api/benchmarks/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comparison');
      }

      const data = await response.json();
      setComparison(data.comparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getInterpretationColor = (interpretation: string) => {
    switch (interpretation) {
      case 'EXCELLENT':
        return 'text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      case 'GOOD':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
      case 'AVERAGE':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
      case 'ABOVE_AVERAGE':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800';
      case 'NEEDS_IMPROVEMENT':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
      default:
        return '';
    }
  };

  // Show loading state
  if (isCustomerLoading) {
    return (
      <PremiumCard className="p-4">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PremiumCard>
    );
  }

  // Show upgrade prompt if no access
  if (!hasBenchmarkingAccess) {
    return (
      <PremiumCard className="p-4 relative overflow-hidden">
        {/* Blurred preview background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm z-0" />
        
        <div className="relative z-10">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold">Industry Benchmarks</h3>
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Location-aware comparison
            </p>
          </div>

          {/* Preview content (dimmed) */}
          <div className="opacity-40 space-y-3 mb-6">
            <div className="space-y-2">
              <div className="h-10 rounded-lg bg-muted/50 border border-border" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-12 rounded-lg bg-muted/40 border border-border" />
                <div className="h-12 rounded-lg bg-muted/40 border border-border" />
                <div className="h-12 rounded-lg bg-muted/40 border border-border" />
              </div>
            </div>
            <div className="h-24 rounded-lg bg-muted/30 border border-border" />
          </div>

          {/* Upgrade prompt */}
          <div className="text-center space-y-3">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-1">
                Professional Feature
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Compare your emissions against industry peers with regional and global insights
              </p>
            </div>
            
            <PremiumButton
              onClick={() => router.push('/pricing')}
              className="w-full"
              size="sm"
            >
              <Lock className="w-3 h-3 mr-1.5" />
              <span className="text-[10px]">Upgrade to Professional</span>
            </PremiumButton>
          </div>
        </div>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard className="p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold">Industry Benchmarks</h3>
          {loadingLocation ? (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          ) : (
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {userCountry}
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Location-aware comparison
        </p>
      </div>

      {/* Input Form */}
      <div className="space-y-2.5 mb-4">
        <div>
          <label className="block text-[10px] font-medium mb-1.5">Sector</label>
          <select
            value={companyData.sector}
            onChange={(e) => setCompanyData({ ...companyData, sector: e.target.value })}
            className="w-full p-2 text-[11px] rounded-lg border border-border bg-background text-foreground"
          >
            {SECTORS.map((sector) => (
              <option key={sector.value} value={sector.value}>
                {sector.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[9px] font-medium mb-1.5">Emissions (tCO₂e)</label>
            <input
              type="number"
              value={companyData.annual_emissions || ''}
              onChange={(e) => setCompanyData({ ...companyData, annual_emissions: parseFloat(e.target.value) || 0 })}
              placeholder="250"
              className="w-full p-2 text-[11px] rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-[9px] font-medium mb-1.5">Employees</label>
            <input
              type="number"
              value={companyData.employees || ''}
              onChange={(e) => setCompanyData({ ...companyData, employees: parseInt(e.target.value) || 0 })}
              placeholder="50"
              className="w-full p-2 text-[11px] rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-[9px] font-medium mb-1.5">Revenue ($)</label>
            <input
              type="number"
              value={companyData.annual_revenue || ''}
              onChange={(e) => setCompanyData({ ...companyData, annual_revenue: parseFloat(e.target.value) || 0 })}
              placeholder="5000000"
              className="w-full p-2 text-[11px] rounded-lg border border-border bg-background text-foreground"
            />
          </div>
        </div>

        {error && (
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 text-[10px]">
            {error}
          </div>
        )}

        <PremiumButton
          onClick={handleCompare}
          disabled={loading}
          className="w-full"
          size="sm"
        >
          <span className="text-[10px]">{loading ? 'Analyzing...' : 'Compare'}</span>
        </PremiumButton>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {/* Performance Badge */}
          <div className={`p-2.5 rounded-lg border ${getInterpretationColor(comparison.interpretation)}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-semibold">Performance</span>
              <span className="text-sm font-bold">{comparison.interpretation.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center justify-between text-[9px]">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{userCountry}: {comparison.percentile_rank}th percentile</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Global: {comparison.global_percentile_rank}th</span>
              </div>
            </div>
          </div>

          {/* Location Context */}
          {comparison.location_context && (
            <div className="p-2 rounded-lg bg-accent/30 border border-border/50">
              <p className="text-[9px] text-muted-foreground mb-1">
                Country Impact: {userCountry}
              </p>
              <p className="text-[10px] font-medium">
                {(comparison.location_context.country_total_emissions / 1000000000).toFixed(2)} Gt CO₂e total
              </p>
            </div>
          )}

          {/* Regional vs Global */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-1 mb-0.5">
                <MapPin className="w-3 h-3 text-primary" />
                <p className="text-[9px] text-muted-foreground">Regional Avg</p>
              </div>
              <p className="text-sm font-bold">
                {comparison.regional_average.toFixed(1)} <span className="text-[9px] font-normal">tCO₂e</span>
              </p>
              <div className="flex items-center gap-1 text-[9px] mt-1">
                {comparison.vs_average_percent < 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">{Math.abs(comparison.vs_average_percent).toFixed(1)}% below</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3 h-3 text-red-600" />
                    <span className="text-red-600">{comparison.vs_average_percent.toFixed(1)}% above</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-1 mb-0.5">
                <Globe className="w-3 h-3 text-primary" />
                <p className="text-[9px] text-muted-foreground">Global Avg</p>
              </div>
              <p className="text-sm font-bold">
                {comparison.global_average.toFixed(1)} <span className="text-[9px] font-normal">tCO₂e</span>
              </p>
              <div className="flex items-center gap-1 text-[9px] mt-1">
                {comparison.vs_global_percent < 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">{Math.abs(comparison.vs_global_percent).toFixed(1)}% below</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3 h-3 text-red-600" />
                    <span className="text-red-600">{comparison.vs_global_percent.toFixed(1)}% above</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Intensity Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-accent/20 border border-border/30">
              <p className="text-[9px] text-muted-foreground mb-0.5">Per Employee</p>
              <p className="text-xs font-bold">
                {comparison.emissions_per_employee.toFixed(2)} tCO₂e
              </p>
              <p className="text-[8px] text-muted-foreground">vs {comparison.industry_emissions_per_employee.toFixed(2)} avg</p>
            </div>

            <div className="p-2 rounded-lg bg-accent/20 border border-border/30">
              <p className="text-[9px] text-muted-foreground mb-0.5">Per $1M Revenue</p>
              <p className="text-xs font-bold">
                {comparison.emissions_per_revenue.toFixed(4)} tCO₂e
              </p>
              <p className="text-[8px] text-muted-foreground">vs {comparison.industry_emissions_per_revenue.toFixed(4)} avg</p>
            </div>
          </div>

          {/* Personalized Recommendations */}
          {comparison.recommendations && comparison.recommendations.length > 0 && (
            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-[9px] font-semibold mb-2 text-primary">Tailored Insights</p>
              <ul className="space-y-1.5">
                {comparison.recommendations.slice(0, 3).map((rec, idx) => (
                  <li key={idx} className="text-[9px] text-foreground flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    <span className="flex-1">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </PremiumCard>
  );
}