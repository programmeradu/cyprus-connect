"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useUser } from "@/lib/user-context";
import { useCustomer } from "autumn-js/react";
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

// Complete list of ALL world countries grouped by continent
const WORLD_COUNTRIES = {
  "Africa": [
    { code: "DZ", name: "Algeria" }, { code: "AO", name: "Angola" }, { code: "BJ", name: "Benin" },
    { code: "BW", name: "Botswana" }, { code: "BF", name: "Burkina Faso" }, { code: "BI", name: "Burundi" },
    { code: "CM", name: "Cameroon" }, { code: "CV", name: "Cape Verde" }, { code: "CF", name: "Central African Republic" },
    { code: "TD", name: "Chad" }, { code: "KM", name: "Comoros" }, { code: "CG", name: "Congo" },
    { code: "CD", name: "DR Congo" }, { code: "CI", name: "Côte d'Ivoire" }, { code: "DJ", name: "Djibouti" },
    { code: "EG", name: "Egypt" }, { code: "GQ", name: "Equatorial Guinea" }, { code: "ER", name: "Eritrea" },
    { code: "SZ", name: "Eswatini" }, { code: "ET", name: "Ethiopia" }, { code: "GA", name: "Gabon" },
    { code: "GM", name: "Gambia" }, { code: "GH", name: "Ghana" }, { code: "GN", name: "Guinea" },
    { code: "GW", name: "Guinea-Bissau" }, { code: "KE", name: "Kenya" }, { code: "LS", name: "Lesotho" },
    { code: "LR", name: "Liberia" }, { code: "LY", name: "Libya" }, { code: "MG", name: "Madagascar" },
    { code: "MW", name: "Malawi" }, { code: "ML", name: "Mali" }, { code: "MR", name: "Mauritania" },
    { code: "MU", name: "Mauritius" }, { code: "MA", name: "Morocco" }, { code: "MZ", name: "Mozambique" },
    { code: "NA", name: "Namibia" }, { code: "NE", name: "Niger" }, { code: "NG", name: "Nigeria" },
    { code: "RW", name: "Rwanda" }, { code: "ST", name: "São Tomé & Príncipe" }, { code: "SN", name: "Senegal" },
    { code: "SC", name: "Seychelles" }, { code: "SL", name: "Sierra Leone" }, { code: "SO", name: "Somalia" },
    { code: "ZA", name: "South Africa" }, { code: "SS", name: "South Sudan" }, { code: "SD", name: "Sudan" },
    { code: "TZ", name: "Tanzania" }, { code: "TG", name: "Togo" }, { code: "TN", name: "Tunisia" },
    { code: "UG", name: "Uganda" }, { code: "ZM", name: "Zambia" }, { code: "ZW", name: "Zimbabwe" },
  ],
  "Asia": [
    { code: "AF", name: "Afghanistan" }, { code: "AM", name: "Armenia" }, { code: "AZ", name: "Azerbaijan" },
    { code: "BH", name: "Bahrain" }, { code: "BD", name: "Bangladesh" }, { code: "BT", name: "Bhutan" },
    { code: "BN", name: "Brunei" }, { code: "KH", name: "Cambodia" }, { code: "CN", name: "China" },
    { code: "GE", name: "Georgia" }, { code: "HK", name: "Hong Kong" }, { code: "IN", name: "India" },
    { code: "ID", name: "Indonesia" }, { code: "IR", name: "Iran" }, { code: "IQ", name: "Iraq" },
    { code: "IL", name: "Israel" }, { code: "JP", name: "Japan" }, { code: "JO", name: "Jordan" },
    { code: "KZ", name: "Kazakhstan" }, { code: "KW", name: "Kuwait" }, { code: "KG", name: "Kyrgyzstan" },
    { code: "LA", name: "Laos" }, { code: "LB", name: "Lebanon" }, { code: "MO", name: "Macao" },
    { code: "MY", name: "Malaysia" }, { code: "MV", name: "Maldives" }, { code: "MN", name: "Mongolia" },
    { code: "MM", name: "Myanmar" }, { code: "NP", name: "Nepal" }, { code: "KP", name: "North Korea" },
    { code: "OM", name: "Oman" }, { code: "PK", name: "Pakistan" }, { code: "PS", name: "Palestine" },
    { code: "PH", name: "Philippines" }, { code: "QA", name: "Qatar" }, { code: "SA", name: "Saudi Arabia" },
    { code: "SG", name: "Singapore" }, { code: "KR", name: "South Korea" }, { code: "LK", name: "Sri Lanka" },
    { code: "SY", name: "Syria" }, { code: "TW", name: "Taiwan" }, { code: "TJ", name: "Tajikistan" },
    { code: "TH", name: "Thailand" }, { code: "TL", name: "Timor-Leste" }, { code: "TM", name: "Turkmenistan" },
    { code: "AE", name: "UAE" }, { code: "UZ", name: "Uzbekistan" }, { code: "VN", name: "Vietnam" },
    { code: "YE", name: "Yemen" },
  ],
  "Europe": [
    { code: "AL", name: "Albania" }, { code: "AD", name: "Andorra" }, { code: "AT", name: "Austria" },
    { code: "BY", name: "Belarus" }, { code: "BE", name: "Belgium" }, { code: "BA", name: "Bosnia & Herzegovina" },
    { code: "BG", name: "Bulgaria" }, { code: "HR", name: "Croatia" }, { code: "CY", name: "Cyprus" },
    { code: "CZ", name: "Czech Republic" }, { code: "DK", name: "Denmark" }, { code: "EE", name: "Estonia" },
    { code: "FI", name: "Finland" }, { code: "FR", name: "France" }, { code: "DE", name: "Germany" },
    { code: "GR", name: "Greece" }, { code: "HU", name: "Hungary" }, { code: "IS", name: "Iceland" },
    { code: "IE", name: "Ireland" }, { code: "IT", name: "Italy" }, { code: "XK", name: "Kosovo" },
    { code: "LV", name: "Latvia" }, { code: "LI", name: "Liechtenstein" }, { code: "LT", name: "Lithuania" },
    { code: "LU", name: "Luxembourg" }, { code: "MT", name: "Malta" }, { code: "MD", name: "Moldova" },
    { code: "MC", name: "Monaco" }, { code: "ME", name: "Montenegro" }, { code: "NL", name: "Netherlands" },
    { code: "MK", name: "North Macedonia" }, { code: "NO", name: "Norway" }, { code: "PL", name: "Poland" },
    { code: "PT", name: "Portugal" }, { code: "RO", name: "Romania" }, { code: "RU", name: "Russia" },
    { code: "SM", name: "San Marino" }, { code: "RS", name: "Serbia" }, { code: "SK", name: "Slovakia" },
    { code: "SI", name: "Slovenia" }, { code: "ES", name: "Spain" }, { code: "SE", name: "Sweden" },
    { code: "CH", name: "Switzerland" }, { code: "TR", name: "Turkey" }, { code: "UA", name: "Ukraine" },
    { code: "GB", name: "United Kingdom" }, { code: "VA", name: "Vatican City" },
  ],
  "North America": [
    { code: "AG", name: "Antigua & Barbuda" }, { code: "BS", name: "Bahamas" }, { code: "BB", name: "Barbados" },
    { code: "BZ", name: "Belize" }, { code: "CA", name: "Canada" }, { code: "CR", name: "Costa Rica" },
    { code: "CU", name: "Cuba" }, { code: "DM", name: "Dominica" }, { code: "DO", name: "Dominican Republic" },
    { code: "SV", name: "El Salvador" }, { code: "GD", name: "Grenada" }, { code: "GT", name: "Guatemala" },
    { code: "HT", name: "Haiti" }, { code: "HN", name: "Honduras" }, { code: "JM", name: "Jamaica" },
    { code: "MX", name: "Mexico" }, { code: "NI", name: "Nicaragua" }, { code: "PA", name: "Panama" },
    { code: "KN", name: "St. Kitts & Nevis" }, { code: "LC", name: "St. Lucia" }, { code: "VC", name: "St. Vincent" },
    { code: "TT", name: "Trinidad & Tobago" }, { code: "US", name: "United States" },
  ],
  "South America": [
    { code: "AR", name: "Argentina" }, { code: "BO", name: "Bolivia" }, { code: "BR", name: "Brazil" },
    { code: "CL", name: "Chile" }, { code: "CO", name: "Colombia" }, { code: "EC", name: "Ecuador" },
    { code: "GY", name: "Guyana" }, { code: "PY", name: "Paraguay" }, { code: "PE", name: "Peru" },
    { code: "SR", name: "Suriname" }, { code: "UY", name: "Uruguay" }, { code: "VE", name: "Venezuela" },
  ],
  "Oceania": [
    { code: "AU", name: "Australia" }, { code: "FJ", name: "Fiji" }, { code: "KI", name: "Kiribati" },
    { code: "MH", name: "Marshall Islands" }, { code: "FM", name: "Micronesia" }, { code: "NR", name: "Nauru" },
    { code: "NZ", name: "New Zealand" }, { code: "PW", name: "Palau" }, { code: "PG", name: "Papua New Guinea" },
    { code: "WS", name: "Samoa" }, { code: "SB", name: "Solomon Islands" }, { code: "TO", name: "Tonga" },
    { code: "TV", name: "Tuvalu" }, { code: "VU", name: "Vanuatu" },
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
  const { user } = useUser();
  const { customer, isLoading: isCustomerLoading } = useCustomer();
  const router = useRouter();
  
  // Check if user has access to compliance tracking (Professional+ feature)
  const hasComplianceAccess = customer?.products?.some(
    (product) => product.id === 'professional' || product.id === 'enterprise'
  ) || false;

  const [smeData, setSmeData] = useState<SMEData>({
    employees: 0,
    annualRevenue: 0,
    totalAssets: 0,
    country: '',
    industry: '',
  });
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect and set user location on mount
  useEffect(() => {
    const detectLocation = async () => {
      // Priority 1: Use user's countryCode from database
      if (user?.countryCode) {
        setSmeData(prev => ({ ...prev, country: user.countryCode || '' }));
        return;
      }

      // Priority 2: Try geolocation API
      try {
        const response = await fetch('/api/geolocation');
        if (response.ok) {
          const data = await response.json();
          if (data.countryCode) {
            setSmeData(prev => ({ ...prev, country: data.countryCode }));
          }
        }
      } catch (err) {
        console.error('Failed to detect location:', err);
      }
    };

    detectLocation();
  }, [user?.countryCode]);

  const handleCheck = async () => {
    if (!smeData.employees || !smeData.annualRevenue || !smeData.totalAssets || !smeData.country || !smeData.industry) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/compliance/check-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smeData),
      });

      if (!response.ok) {
        throw new Error('Failed to check compliance');
      }

      const data = await response.json();
      setCompliance(data.compliance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getComplianceLevelBadge = (level: string) => {
    const labels = {
      EXEMPT: 'Exempt',
      VOLUNTARY: 'Voluntary',
      MANDATORY_MEDIUM: 'Required - Medium',
      MANDATORY_LARGE: 'Required - Large',
    };
    return labels[level as keyof typeof labels] || level;
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
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold">Compliance Check</h3>
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-[10px] text-muted-foreground">
              CSRD & ESRS requirements
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
              <p className="text-xs font-semibold text-primary mb-1">
                Professional Feature
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Automated CSRD, ESRS, and VSME compliance tracking for your organization
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
        <h3 className="text-sm font-bold mb-1">Compliance Check</h3>
        <p className="text-[10px] text-muted-foreground">
          CSRD & ESRS requirements
        </p>
      </div>

      {/* Input Form */}
      <div className="space-y-2.5 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-medium mb-1.5">Country</label>
            <select
              value={smeData.country}
              onChange={(e) => setSmeData({ ...smeData, country: e.target.value })}
              className="w-full p-2 text-[11px] rounded-lg border border-border bg-background text-foreground"
            >
              <option value="">Select</option>
              {Object.entries(WORLD_COUNTRIES).map(([continent, countries]) => (
                <optgroup key={continent} label={continent}>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-medium mb-1.5">Industry</label>
            <select
              value={smeData.industry}
              onChange={(e) => setSmeData({ ...smeData, industry: e.target.value })}
              className="w-full p-2 text-[11px] rounded-lg border border-border bg-background text-foreground"
            >
              <option value="">Select</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[9px] font-medium mb-1.5">Employees</label>
            <input
              type="number"
              value={smeData.employees || ''}
              onChange={(e) => setSmeData({ ...smeData, employees: parseInt(e.target.value) || 0 })}
              placeholder="150"
              className="w-full p-2 text-[11px] rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-[9px] font-medium mb-1.5">Revenue ($)</label>
            <input
              type="number"
              value={smeData.annualRevenue || ''}
              onChange={(e) => setSmeData({ ...smeData, annualRevenue: parseFloat(e.target.value) || 0 })}
              placeholder="25000000"
              className="w-full p-2 text-[11px] rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-[9px] font-medium mb-1.5">Assets ($)</label>
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
          <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[10px]">
            {error}
          </div>
        )}

        <PremiumButton
          onClick={handleCheck}
          disabled={loading}
          className="w-full"
          size="sm"
        >
          <span className="text-[10px]">{loading ? 'Checking...' : 'Check Status'}</span>
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
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                Compliance Status
              </span>
              <span className="text-xs font-bold text-foreground px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                {getComplianceLevelBadge(compliance.complianceLevel)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {compliance.threshold}
            </p>
          </div>

          {/* Key Indicators - Unified Design */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <p className="text-[9px] text-muted-foreground mb-1.5 uppercase tracking-wide">CSRD Scope</p>
              <p className="text-[11px] font-semibold text-foreground">
                {compliance.csrdScope ? 'In Scope' : 'Exempt'}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-card border border-border">
              <p className="text-[9px] text-muted-foreground mb-1.5 uppercase tracking-wide">VSME</p>
              <p className="text-[11px] font-semibold text-foreground">
                {compliance.vsmeEligible ? 'Eligible' : 'Not Eligible'}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-card border border-border">
              <p className="text-[9px] text-muted-foreground mb-1.5 uppercase tracking-wide">Reporting</p>
              <p className="text-[11px] font-semibold text-foreground">
                {compliance.mandatoryReporting ? 'Mandatory' : 'Optional'}
              </p>
            </div>
          </div>

          {/* Deadline & Data Points */}
          {compliance.reportingDeadline && (
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-muted-foreground mb-0.5 uppercase tracking-wide">
                    Reporting Deadline
                  </p>
                  <p className="text-[11px] font-semibold text-foreground">
                    {compliance.reportingDeadline}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-muted-foreground mb-0.5 uppercase tracking-wide">
                    Data Points
                  </p>
                  <p className="text-[11px] font-semibold text-foreground">
                    ~{compliance.estimatedDataPoints}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Frameworks */}
          <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
            <p className="text-[9px] font-medium mb-2 text-muted-foreground uppercase tracking-wide">
              Applicable Frameworks
            </p>
            <div className="flex flex-wrap gap-1.5">
              {compliance.applicableFrameworks.map((framework) => (
                <span
                  key={framework}
                  className="px-2 py-1 rounded-md text-[9px] font-medium bg-background text-foreground border border-border"
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