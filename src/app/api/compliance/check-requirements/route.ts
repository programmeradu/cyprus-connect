import { NextRequest, NextResponse } from 'next/server';

interface SMEMetrics {
  employees: number;
  annualRevenue: number; // in EUR millions
  totalAssets: number; // in EUR millions
  country: string;
  industry: string;
}

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

const CSRD_OMNIBUS_2025_THRESHOLDS = {
  largeEnterprise: {
    employees: 1000,
    revenue: 50, // EUR millions
    assets: 25, // EUR millions
  },
  mediumEnterprise: {
    employees: 250,
    revenue: 40,
    assets: 20,
  },
};

export async function POST(req: NextRequest) {
  try {
    const smeData: SMEMetrics = await req.json();
    
    // 2-out-of-3 rule check (CSRD criteria)
    const meetsThreshold = (thresholds: typeof CSRD_OMNIBUS_2025_THRESHOLDS['largeEnterprise']) => {
      let count = 0;
      if (smeData.employees > thresholds.employees) count++;
      if (smeData.annualRevenue > thresholds.revenue) count++;
      if (smeData.totalAssets > thresholds.assets) count++;
      return count >= 2;
    };

    const isLargeEnterprise = meetsThreshold(CSRD_OMNIBUS_2025_THRESHOLDS.largeEnterprise);
    const isMediumEnterprise = meetsThreshold(CSRD_OMNIBUS_2025_THRESHOLDS.mediumEnterprise);
    
    // EU turnover threshold for non-EU companies
    const isEU = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'SE', 'DK', 'FI', 'IE', 'PT', 'GR', 'PL', 'CZ'].includes(smeData.country);
    const isNonEUinScope = !isEU && smeData.annualRevenue > 450;

    // Determine compliance level
    let complianceLevel: ComplianceStatus['complianceLevel'];
    if (isLargeEnterprise || isNonEUinScope) {
      complianceLevel = 'MANDATORY_LARGE';
    } else if (isMediumEnterprise) {
      complianceLevel = 'MANDATORY_MEDIUM';
    } else if (smeData.employees > 10) {
      complianceLevel = 'VOLUNTARY';
    } else {
      complianceLevel = 'EXEMPT';
    }

    // Applicable frameworks
    const frameworks: string[] = [];
    if (complianceLevel === 'VOLUNTARY' || complianceLevel === 'EXEMPT') {
      frameworks.push('VSME');
    }
    if (complianceLevel.startsWith('MANDATORY')) {
      frameworks.push('ESRS', 'CSRD');
    }
    frameworks.push('GRI'); // Universal
    if (smeData.industry.match(/energy|manufacturing|mining/i)) {
      frameworks.push('CBAM', 'EU Taxonomy');
    }
    if (smeData.industry.match(/financial|banking/i)) {
      frameworks.push('TCFD');
    }

    // Estimated data points
    let estimatedDataPoints = 0;
    if (complianceLevel === 'VOLUNTARY') {
      estimatedDataPoints = 30; // VSME simplified
    } else if (complianceLevel === 'MANDATORY_MEDIUM') {
      estimatedDataPoints = 750; // ESRS 2025 reduced
    } else if (complianceLevel === 'MANDATORY_LARGE') {
      estimatedDataPoints = 750;
    }

    const compliance: ComplianceStatus = {
      csrdScope: isLargeEnterprise || isMediumEnterprise || isNonEUinScope,
      vsmeEligible: !isLargeEnterprise && smeData.employees <= 250,
      applicableFrameworks: frameworks,
      reportingDeadline: isLargeEnterprise 
        ? '2025 (FY 2024)' 
        : isMediumEnterprise 
        ? '2028 (FY 2027)' 
        : 'Voluntary',
      threshold: isMediumEnterprise 
        ? 'Medium enterprise (2 of 3: 250+ employees, €40M+ revenue, €20M+ assets)'
        : isLargeEnterprise
        ? 'Large enterprise (2 of 3: 1000+ employees, €50M+ revenue, €25M+ assets)'
        : 'SME - Below mandatory threshold',
      mandatoryReporting: complianceLevel.startsWith('MANDATORY'),
      estimatedDataPoints,
      complianceLevel,
    };

    return NextResponse.json({
      success: true,
      compliance,
      note: 'Based on CSRD Omnibus 2025 thresholds (updated November 2025)',
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Compliance check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
