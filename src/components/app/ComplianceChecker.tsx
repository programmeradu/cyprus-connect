"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSubscription } from "@/hooks/useSubscription";
import { useRouter } from "next/navigation";
import { EmptyState, SkeletonCards } from "@/components/app/shell";

interface ComplianceStatus {
  csrdScope: boolean;
  vsmeEligible: boolean;
  applicableFrameworks: string[];
  reportingDeadline: string;
  threshold: string;
  mandatoryReporting: boolean;
  estimatedDataPoints: number;
  complianceLevel: 'EXEMPT' | 'VOLUNTARY' | 'MANDATORY_MEDIUM' | 'MANDATORY_LARGE';
}

interface SMEData {
  employees: number;
  annualRevenue: number;
  totalAssets: number;
  country: string;
  industry: string;
}

const INDUSTRIES = [
  'Energy & Utilities',
  'Manufacturing',
  'Retail',
  'Hospitality',
  'Technology & IT',
  'Logistics & Transport',
  'Food Service',
  'Financial Services',
  'Healthcare',
  'Construction',
  'Agriculture',
  'Other',
];

export function ComplianceChecker() {
  const { plan, isLoading: isCustomerLoading } = useSubscription();
  const router = useRouter();
  const t = useTranslations("complianceChecker");
  const locale = useLocale();

  // Check if user has access to compliance tracking (Professional+ feature)
  const hasComplianceAccess = plan.id === 'pro' || plan.id === 'enterprise';

  const [smeData, setSmeData] = useState<SMEData>({
    employees: 0,
    annualRevenue: 0,
    totalAssets: 0,
    country: 'CY',
    industry: '',
  });
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cyprus-only product scope.
  useEffect(() => {
    setSmeData(prev => ({ ...prev, country: 'CY' }));
  }, []);

  const handleCheck = async () => {
    if (!smeData.employees || !smeData.annualRevenue || !smeData.totalAssets || !smeData.country || !smeData.industry) {
      setError(t('fillAll'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/compliance/check-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...smeData, country: 'CY', locale }),
      });

      if (!response.ok) {
        throw new Error(t('failed'));
      }

      const data = await response.json();
      setCompliance(data.compliance);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unknownError'));
    } finally {
      setLoading(false);
    }
  };

  const getComplianceLevelBadge = (level: string) => {
    return t(`level.${level}` as any);
  };

  // Loading state
  if (isCustomerLoading) {
    return <SkeletonCards count={2} />;
  }

  // Upgrade prompt if no access
  if (!hasComplianceAccess) {
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
        <h3 className="text-[1.0625rem] font-semibold leading-snug break-words">{t('title')}</h3>
        <p className="app-meta mt-1 break-words">{t('subtitle')}</p>
      </div>

      {/* Input Form */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="app-label mb-1.5 block">{t('country')}</label>
            <input
              value={t('cyprusOnly')}
              readOnly
              className="w-full min-h-11 rounded-md border border-[var(--app-rule)] bg-[var(--app-surface-2)] px-3 text-sm text-muted-foreground"
            />
          </div>

          <div>
            <label className="app-label mb-1.5 block">{t('industry')}</label>
            <select
              value={smeData.industry}
              onChange={(e) => setSmeData({ ...smeData, industry: e.target.value })}
              className="w-full min-h-11 rounded-md border border-[var(--app-rule-strong)] bg-[var(--app-surface-1)] px-3 text-sm text-foreground"
            >
              <option value="">{t('select')}</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {t(`industries.${industry}` as any)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="app-label mb-1.5 block">{t('employees')}</label>
            <input
              type="number"
              value={smeData.employees || ''}
              onChange={(e) => setSmeData({ ...smeData, employees: parseInt(e.target.value) || 0 })}
              placeholder="150"
              className="w-full min-h-11 rounded-md border border-[var(--app-rule-strong)] bg-[var(--app-surface-1)] px-3 text-sm app-num"
            />
          </div>

          <div>
            <label className="app-label mb-1.5 block">{t('revenue')}</label>
            <input
              type="number"
              value={smeData.annualRevenue || ''}
              onChange={(e) => setSmeData({ ...smeData, annualRevenue: parseFloat(e.target.value) || 0 })}
              placeholder="25000000"
              className="w-full min-h-11 rounded-md border border-[var(--app-rule-strong)] bg-[var(--app-surface-1)] px-3 text-sm app-num"
            />
          </div>

          <div>
            <label className="app-label mb-1.5 block">{t('assets')}</label>
            <input
              type="number"
              value={smeData.totalAssets || ''}
              onChange={(e) => setSmeData({ ...smeData, totalAssets: parseFloat(e.target.value) || 0 })}
              placeholder="15000000"
              className="w-full min-h-11 rounded-md border border-[var(--app-rule-strong)] bg-[var(--app-surface-1)] px-3 text-sm app-num"
            />
          </div>
        </div>

        {error && (
          <EmptyState tone="critical" title={t('failed')} description={error} />
        )}

        <button
          type="button"
          onClick={handleCheck}
          disabled={loading}
          className="app-btn w-full"
        >
          {loading ? t('checking') : t('checkStatus')}
        </button>
      </div>

      {/* Compliance Results */}
      {compliance && (
        <div className="space-y-3">
          <div className="app-card-inset p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="app-label">{t('complianceStatus')}</span>
              <span className="app-tag">{getComplianceLevelBadge(compliance.complianceLevel)}</span>
            </div>
            <p className="app-meta break-words">{compliance.threshold}</p>
          </div>

          <div className="app-ledger">
            <div className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="app-label">{t('csrdScope')}</span>
              <span className="text-sm font-medium break-words">{compliance.csrdScope ? t('inScope') : t('exempt')}</span>
            </div>
            <div className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="app-label">{t('vsme')}</span>
              <span className="text-sm font-medium break-words">{compliance.vsmeEligible ? t('eligible') : t('notEligible')}</span>
            </div>
            <div className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="app-label">{t('reporting')}</span>
              <span className="text-sm font-medium break-words">{compliance.mandatoryReporting ? t('mandatory') : t('optional')}</span>
            </div>
            {compliance.reportingDeadline && (
              <div className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="app-label">{t('reportingDeadline')}</span>
                <span className="text-sm font-medium break-words">{compliance.reportingDeadline}</span>
              </div>
            )}
            <div className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="app-label">{t('dataPoints')}</span>
              <span className="app-num text-sm font-medium">~{compliance.estimatedDataPoints}</span>
            </div>
          </div>

          <div className="app-card-inset p-3">
            <p className="app-label mb-2">{t('applicableFrameworks')}</p>
            <div className="flex flex-wrap gap-1.5">
              {compliance.applicableFrameworks.map((framework) => (
                <span key={framework} className="app-tag break-words">
                  {framework}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
