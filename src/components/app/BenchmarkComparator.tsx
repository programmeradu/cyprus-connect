"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { useUser } from "@/lib/user-context";
import { useSubscription } from "@/hooks/useSubscription";
import { useRouter } from "next/navigation";
import { Metric, MetricRow, EmptyState, SkeletonCards } from "@/components/app/shell";

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
  const { plan, isLoading: isCustomerLoading } = useSubscription();
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
  // Vuneli is Cyprus-locked: benchmarks are always against Cypriot peers.
  const userCountry = 'CY';

  // Check if user has access to industry benchmarking
  const hasBenchmarkingAccess = plan.id === 'pro' || plan.id === 'enterprise';

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
      setError(t('fillAll'));
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
      setError(err instanceof Error ? err.message : t('unknownError'));
    } finally {
      setLoading(false);
    }
  };

  const interpretationTone = (interpretation: string): "positive" | "caution" | "critical" | undefined => {
    switch (interpretation) {
      case 'EXCELLENT':
      case 'GOOD':
        return 'positive';
      case 'AVERAGE':
      case 'ABOVE_AVERAGE':
        return 'caution';
      case 'NEEDS_IMPROVEMENT':
        return 'critical';
      default:
        return undefined;
    }
  };

  // Loading state
  if (isCustomerLoading) {
    return <SkeletonCards count={2} />;
  }

  // Upgrade prompt if no access
  if (!hasBenchmarkingAccess) {
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
        <p className="app-meta mt-1 break-words">{t("subtitle")} &mdash; {userCountry}</p>
      </div>

      {/* Input Form */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="app-label mb-1.5 block">{t("sector")}</label>
          <select
            value={companyData.sector}
            onChange={(e) => setCompanyData({ ...companyData, sector: e.target.value })}
            className="w-full min-h-11 rounded-md border border-[var(--app-rule-strong)] bg-[var(--app-surface-1)] px-3 text-sm text-foreground"
          >
            {SECTOR_KEYS.map((k) => (
              <option key={k} value={k}>
                {t(`sectors.${k}` as any)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="app-label mb-1.5 block">{t("emissions")}</label>
            <input
              type="number"
              value={companyData.annual_emissions || ''}
              onChange={(e) => setCompanyData({ ...companyData, annual_emissions: parseFloat(e.target.value) || 0 })}
              placeholder="250"
              className="w-full min-h-11 rounded-md border border-[var(--app-rule-strong)] bg-[var(--app-surface-1)] px-3 text-sm app-num"
            />
          </div>

          <div>
            <label className="app-label mb-1.5 block">{t("employees")}</label>
            <input
              type="number"
              value={companyData.employees || ''}
              onChange={(e) => setCompanyData({ ...companyData, employees: parseInt(e.target.value) || 0 })}
              placeholder="50"
              className="w-full min-h-11 rounded-md border border-[var(--app-rule-strong)] bg-[var(--app-surface-1)] px-3 text-sm app-num"
            />
          </div>

          <div>
            <label className="app-label mb-1.5 block">{t("revenue")}</label>
            <input
              type="number"
              value={companyData.annual_revenue || ''}
              onChange={(e) => setCompanyData({ ...companyData, annual_revenue: parseFloat(e.target.value) || 0 })}
              placeholder="5000000"
              className="w-full min-h-11 rounded-md border border-[var(--app-rule-strong)] bg-[var(--app-surface-1)] px-3 text-sm app-num"
            />
          </div>
        </div>

        {error && (
          <EmptyState tone="critical" title={t('unknownError')} description={error} />
        )}

        <button
          type="button"
          onClick={handleCompare}
          disabled={loading}
          className="app-btn w-full"
        >
          {loading ? t('analyzing') : t('compare')}
        </button>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-3">
          <div className="app-card-inset p-3">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <span className="app-label">{t("performance")}</span>
              <span className="app-tag" data-tone={interpretationTone(comparison.interpretation)}>
                {t(`interp.${comparison.interpretation}` as any)}
              </span>
            </div>
            <p className="app-meta break-words">
              {t('percentileLocal', { country: userCountry, n: comparison.percentile_rank })}
            </p>
          </div>

          {comparison.location_context && (
            <div className="app-card-inset p-3">
              <p className="app-meta break-words">
                {t('countryImpact', { country: userCountry })}
              </p>
              <p className="text-sm font-medium break-words mt-1">
                {t('gtTotal', { value: (comparison.location_context.country_total_emissions / 1000000000).toFixed(2) })}
              </p>
            </div>
          )}

          <MetricRow columns={2}>
            <Metric
              label={t("regionalAvg")}
              value={comparison.regional_average.toFixed(1)}
              unit="tCO₂e"
              delta={
                comparison.vs_average_percent < 0
                  ? t('below', { pct: Math.abs(comparison.vs_average_percent).toFixed(1) })
                  : t('above', { pct: comparison.vs_average_percent.toFixed(1) })
              }
              deltaTone={comparison.vs_average_percent < 0 ? "positive" : "negative"}
            />
            <Metric
              label={t("globalAvg")}
              value={comparison.global_average.toFixed(1)}
              unit="tCO₂e"
              delta={
                comparison.vs_global_percent < 0
                  ? t('below', { pct: Math.abs(comparison.vs_global_percent).toFixed(1) })
                  : t('above', { pct: comparison.vs_global_percent.toFixed(1) })
              }
              deltaTone={comparison.vs_global_percent < 0 ? "positive" : "negative"}
            />
          </MetricRow>

          <MetricRow columns={2}>
            <Metric
              label={t("perEmployee")}
              value={comparison.emissions_per_employee.toFixed(2)}
              unit="tCO₂e"
              note={t('vsAvg', { value: comparison.industry_emissions_per_employee.toFixed(2) })}
            />
            <Metric
              label={t("perRevenue")}
              value={comparison.emissions_per_revenue.toFixed(4)}
              unit="tCO₂e"
              note={t('vsAvg', { value: comparison.industry_emissions_per_revenue.toFixed(4) })}
            />
          </MetricRow>

          {comparison.recommendations && comparison.recommendations.length > 0 && (
            <div className="app-ledger">
              <div className="px-3 py-2">
                <p className="app-label">{t("tailored")}</p>
              </div>
              {comparison.recommendations.slice(0, 3).map((rec, idx) => (
                <div key={idx} className="px-3 py-2.5 text-sm break-words">
                  {rec}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
