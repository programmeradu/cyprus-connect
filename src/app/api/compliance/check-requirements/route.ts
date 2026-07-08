import { NextRequest, NextResponse } from 'next/server';

interface SMEMetrics {
  employees: number;
  annualRevenue: number; // raw EUR from the UI; large values are normalized to EUR millions
  totalAssets: number; // raw EUR from the UI; large values are normalized to EUR millions
  country: string;
  industry: string;
  locale?: string;
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

const CYPRUS_CSRD_THRESHOLDS = {
  largeEnterprise: {
    employees: 1000,
    revenue: 50,
    assets: 25,
  },
  preOmnibusLarge: {
    employees: 250,
    revenue: 40,
    assets: 20,
  },
};

function toMillions(value: number) {
  return value > 1000 ? value / 1_000_000 : value;
}

function isGreek(locale?: string) {
  return locale?.toLowerCase().startsWith('el');
}

export async function POST(req: NextRequest) {
  try {
    const input: SMEMetrics = await req.json();
    const greek = isGreek(input.locale);
    const smeData = {
      ...input,
      country: 'CY',
      annualRevenue: toMillions(Number(input.annualRevenue || 0)),
      totalAssets: toMillions(Number(input.totalAssets || 0)),
      employees: Number(input.employees || 0),
    };
    
    // 2-out-of-3 rule check (CSRD criteria)
    const meetsThreshold = (thresholds: typeof CYPRUS_CSRD_THRESHOLDS['largeEnterprise']) => {
      let count = 0;
      if (smeData.employees >= thresholds.employees) count++;
      if (smeData.annualRevenue >= thresholds.revenue) count++;
      if (smeData.totalAssets >= thresholds.assets) count++;
      return count >= 2;
    };

    const isLargeEnterprise = meetsThreshold(CYPRUS_CSRD_THRESHOLDS.largeEnterprise);
    const isPreOmnibusLarge = meetsThreshold(CYPRUS_CSRD_THRESHOLDS.preOmnibusLarge);

    // Determine compliance level
    let complianceLevel: ComplianceStatus['complianceLevel'];
    if (isLargeEnterprise) {
      complianceLevel = 'MANDATORY_LARGE';
    } else if (isPreOmnibusLarge) {
      complianceLevel = 'MANDATORY_MEDIUM';
    } else if (smeData.employees >= 10 || smeData.annualRevenue >= 0.7 || smeData.totalAssets >= 0.35) {
      complianceLevel = 'VOLUNTARY';
    } else {
      complianceLevel = 'EXEMPT';
    }

    // Applicable frameworks
    const frameworks: string[] = [];
    if (complianceLevel === 'VOLUNTARY' || complianceLevel === 'EXEMPT') {
      frameworks.push('EFRAG VSME', 'Cyprus SME sustainability profile');
    }
    if (complianceLevel.startsWith('MANDATORY')) {
      frameworks.push('CSRD Cyprus transposition', 'ESRS', 'EU Taxonomy screening');
    }
    frameworks.push('Cyprus NECP 2030', 'GDPR / Cyprus Data Protection Law');
    if (smeData.industry.match(/energy|manufacturing|construction|transport|logistics/i)) {
      frameworks.push('Cyprus energy-efficiency actions', 'CBAM relevance check');
    }
    if (smeData.industry.match(/financial|banking|insurance/i)) {
      frameworks.push('Financed-emissions readiness');
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
      csrdScope: complianceLevel.startsWith('MANDATORY'),
      vsmeEligible: !complianceLevel.startsWith('MANDATORY'),
      applicableFrameworks: frameworks,
      reportingDeadline: complianceLevel.startsWith('MANDATORY') 
        ? greek
          ? 'Σταδιακή εφαρμογή CSRD στην Κύπρο — ελέγξτε χρήση και κύκλο εργασιών'
          : 'Cyprus CSRD phased reporting — verify financial year and listing status'
        : greek
        ? 'Εθελοντικά / κατόπιν αιτήματος ενδιαφερομένων'
        : 'Voluntary / stakeholder-driven',
      threshold: complianceLevel.startsWith('MANDATORY')
        ? greek
          ? 'Κύπρος / CSRD: πιθανή υποχρεωτική αναφορά με βάση τον κανόνα 2 από 3. Επιβεβαιώστε με σύμβουλο πριν από επίσημη υποβολή.'
          : 'Cyprus / CSRD: likely mandatory reporting based on the 2-of-3 threshold test. Confirm with counsel before formal filing.'
        : greek
        ? 'Κύπρος / ΜμΕ: κάτω από τα βασικά υποχρεωτικά όρια CSRD. Το VSME προτείνεται για τράπεζες, προσφορές, πελάτες και εφοδιαστική αλυσίδα.'
        : 'Cyprus / SME: below core mandatory CSRD thresholds. VSME is recommended for banks, tenders, customers, and supply-chain requests.',
      mandatoryReporting: complianceLevel.startsWith('MANDATORY'),
      estimatedDataPoints,
      complianceLevel,
    };

    return NextResponse.json({
      success: true,
      compliance,
      note: greek
        ? 'Πρώτη κυπριακή έκδοση: βασισμένη σε CSRD/ESRS/VSME, κυπριακή μεταφορά CSRD και το Εθνικό Σχέδιο για την Ενέργεια και το Κλίμα.'
        : 'First Cyprus localization pass: based on CSRD/ESRS/VSME, Cyprus CSRD transposition, and Cyprus National Energy & Climate Plan context.',
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
