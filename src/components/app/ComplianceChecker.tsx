"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useSubscription } from "@/hooks/useSubscription";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";

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

// VerdeIQ is Cyprus-focused. The compliance checker covers Cyprus and the
// wider EU/EEA where CSRD, VSME, EU Taxonomy, and CBAM apply.
const WORLD_COUNTRIES = {
  "Cyprus": [
    { code: "CY", name: "Cyprus" },
  ],
  "EU / EEA": [
    { code: "AT", name: "Austria" }, { code: "BE", name: "Belgium" }, { code: "BG", name: "Bulgaria" },
    { code: "HR", name: "Croatia" }, { code: "CZ", name: "Czech Republic" }, { code: "DK", name: "Denmark" },
    { code: "EE", name: "Estonia" }, { code: "FI", name: "Finland" }, { code: "FR", name: "France" },
    { code: "DE", name: "Germany" }, { code: "GR", name: "Greece" }, { code: "HU", name: "Hungary" },
    { code: "IE", name: "Ireland" }, { code: "IT", name: "Italy" }, { code: "LV", name: "Latvia" },
    { code: "LT", name: "Lithuania" }, { code: "LU", name: "Luxembourg" }, { code: "MT", name: "Malta" },
    { code: "NL", name: "Netherlands" }, { code: "PL", name: "Poland" }, { code: "PT", name: "Portugal" },
    { code: "RO", name: "Romania" }, { code: "SK", name: "Slovakia" }, { code: "SI", name: "Slovenia" },
    { code: "ES", name: "Spain" }, { code: "SE", name: "Sweden" },
    { code: "IS", name: "Iceland" }, { code: "LI", name: "Liechtenstein" }, { code: "NO", name: "Norway" },
  ],
};

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
  if (!hasComplianceAccess) {
    return (
      <PremiumCard className="p-4 relative overflow-hidden">
        {/* Blurred preview background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm z-0" />
        
        <div className="relative z-10">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1 gap-2">
              <h3 className="text-sm font-bold min-w-0 break-words">{t('title')}</h3>
              <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
            <p className="text-[10px] text-muted-foreground break-words">
              {t('subtitle')}
            </p>
          </div>

          {/* Preview content (dimmed) */}
          <div className="opacity-40 space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-2">
              <div className="h-10 rounded-lg bg-muted/50 border border-border" />
              <div className="h-10 rounded-lg bg-muted/50 border border-border" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-12 rounded-lg bg-muted/40 border border-border" />
              <div className="h-12 rounded-lg bg-muted/40 border border-border" />
              <div className="h-12 rounded-lg bg-muted/40 border border-border" />
            </div>
            <div className="h-20 rounded-lg bg-muted/30 border border-border" />
          </div>

          {/* Upgrade prompt */}
          <div className="text-center space-y-3">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-1 break-words">
                {t('proFeature')}
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed break-words">
                {t('proBlurb')}
              </p>
            </div>
            
            <PremiumButton
              onClick={() => router.push('/pricing')}
              className="w-full"
              size="sm"
            >
              <Lock className="w-3 h-3 mr-1.5 flex-shrink-0" />
              <span className="text-[10px] min-w-0 break-words">{t('upgradeCta')}</span>
            </PremiumButton>
          </div>
        </div>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-bold mb-1 break-words">{t('title')}</h3>
        <p className="text-[10px] text-muted-foreground break-words">
          {t('subtitle')}
        </p>
      </div>

      {/* Input Form */}
      <div className="space-y-2.5 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <label className="block text-[10px] font-medium mb-1.5 break-words">{t('country')}</label>
            <input
              value={t('cyprusOnly')}
              readOnly
              className="w-full p-2 text-[11px] rounded-lg border border-border bg-muted/40 text-foreground"
            />
          </div>

          <div className="min-w-0">
            <label className="block text-[10px] font-medium mb-1.5 break-words">{t('industry')}</label>
            <select
              value={smeData.industry}
              onChange={(e) => setSmeData({ ...smeData, industry: e.target.value })}
              className="w-full p-2 text-[11px] rounded-lg border border-border bg-background text-foreground"
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

        <div className="grid grid-cols-3 gap-2">
          <div className="min-w-0">
            <label className="block text-[9px] font-medium mb-1.5 break-words">{t('employees')}</label>
            <input
              type="number"
              value={smeData.employees || ''}
              onChange={(e) => setSmeData({ ...smeData, employees: parseInt(e.target.value) || 0 })}
              placeholder="150"
              className="w-full p-2 text-[11px] rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div className="min-w-0">
            <label className="block text-[9px] font-medium mb-1.5 break-words">{t('revenue')}</label>
            <input
              type="number"
              value={smeData.annualRevenue || ''}
              onChange={(e) => setSmeData({ ...smeData, annualRevenue: parseFloat(e.target.value) || 0 })}
              placeholder="25000000"
              className="w-full p-2 text-[11px] rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div className="min-w-0">
            <label className="block text-[9px] font-medium mb-1.5 break-words">{t('assets')}</label>
            <input
              type="number"
              value={smeData.totalAssets || ''}
              onChange={(e) => setSmeData({ ...smeData, totalAssets: parseFloat(e.target.value) || 0 })}
              placeholder="15000000"
              className="w-full p-2 text-[11px] rounded-lg border border-border bg-background text-foreground"
            />
          </div>
        </div>

        {error && (
          <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[10px] break-words">
            {error}
          </div>
        )}

        <PremiumButton
          onClick={handleCheck}
          disabled={loading}
          className="w-full"
          size="sm"
        >
          <span className="text-[10px] break-words">{loading ? t('checking') : t('checkStatus')}</span>
        </PremiumButton>
      </div>

      {/* Compliance Results */}
      {compliance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2.5"
        >
          {/* Compliance Level Badge */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider min-w-0 break-words">
                {t('complianceStatus')}
              </span>
              <span className="text-xs font-bold text-foreground px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0 break-words">
                {getComplianceLevelBadge(compliance.complianceLevel)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed break-words">
              {compliance.threshold}
            </p>
          </div>

          {/* Key Indicators - Unified Design */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-card border border-border min-w-0">
              <p className="text-[9px] text-muted-foreground mb-1.5 uppercase tracking-wide break-words">{t('csrdScope')}</p>
              <p className="text-[11px] font-semibold text-foreground break-words">
                {compliance.csrdScope ? t('inScope') : t('exempt')}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-card border border-border min-w-0">
              <p className="text-[9px] text-muted-foreground mb-1.5 uppercase tracking-wide break-words">{t('vsme')}</p>
              <p className="text-[11px] font-semibold text-foreground break-words">
                {compliance.vsmeEligible ? t('eligible') : t('notEligible')}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-card border border-border min-w-0">
              <p className="text-[9px] text-muted-foreground mb-1.5 uppercase tracking-wide break-words">{t('reporting')}</p>
              <p className="text-[11px] font-semibold text-foreground break-words">
                {compliance.mandatoryReporting ? t('mandatory') : t('optional')}
              </p>
            </div>
          </div>

          {/* Deadline & Data Points */}
          {compliance.reportingDeadline && (
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[9px] text-muted-foreground mb-0.5 uppercase tracking-wide break-words">
                    {t('reportingDeadline')}
                  </p>
                  <p className="text-[11px] font-semibold text-foreground break-words">
                    {compliance.reportingDeadline}
                  </p>
                </div>
                <div className="text-right min-w-0">
                  <p className="text-[9px] text-muted-foreground mb-0.5 uppercase tracking-wide break-words">
                    {t('dataPoints')}
                  </p>
                  <p className="text-[11px] font-semibold text-foreground break-words">
                    ~{compliance.estimatedDataPoints}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Frameworks */}
          <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
            <p className="text-[9px] font-medium mb-2 text-muted-foreground uppercase tracking-wide break-words">
              {t('applicableFrameworks')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {compliance.applicableFrameworks.map((framework) => (
                <span
                  key={framework}
                  className="px-2 py-1 rounded-md text-[9px] font-medium bg-background text-foreground border border-border break-words"
                >
                  {framework}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </PremiumCard>
  );
}