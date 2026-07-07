// Compliance Deadline Tracker - CSRD, SEC, CBAM, UK SDR
export interface ComplianceRequirement {
  id: string;
  name: string;
  region: "EU" | "US" | "UK" | "Global";
  applicableToSME: boolean;
  deadline: Date;
  status: "not_started" | "in_progress" | "completed";
  framework: "CSRD" | "SEC" | "TCFD" | "GRI" | "CBAM" | "UK_SDR" | "ISSB";
  description: string;
  documentationUrl: string;
  priority: "high" | "medium" | "low";
}

export const COMPLIANCE_REQUIREMENTS: ComplianceRequirement[] = [
  {
    id: "csrd-2025-nfrd",
    name: "CSRD - First NFRD Company Reporting",
    region: "EU",
    applicableToSME: false,
    deadline: new Date("2025-04-15"),
    status: "not_started",
    framework: "CSRD",
    priority: "high",
    description:
      "Companies previously subject to NFRD must publish first CSRD-compliant report for 2024 fiscal year",
    documentationUrl: "https://www.integritynext.com/csrd-timeline",
  },
  {
    id: "csrd-2026-large",
    name: "CSRD Phase 2 - Large Companies",
    region: "EU",
    applicableToSME: false,
    deadline: new Date("2026-04-15"),
    status: "not_started",
    framework: "CSRD",
    priority: "high",
    description:
      "Large EU companies (250+ employees, €25M+ balance sheet, €50M+ turnover) report 2025 fiscal year",
    documentationUrl: "https://www.integritynext.com/csrd-timeline",
  },
  {
    id: "csrd-2027-sme",
    name: "CSRD Phase 3 - Listed SMEs",
    region: "EU",
    applicableToSME: true,
    deadline: new Date("2027-04-15"),
    status: "not_started",
    framework: "CSRD",
    priority: "high",
    description:
      "Listed SMEs (excluding micro) report 2026 fiscal year with optional 2-year opt-out",
    documentationUrl: "https://www.integritynext.com/csrd-timeline",
  },
  {
    id: "cbam-2026",
    name: "CBAM Definitive Period",
    region: "EU",
    applicableToSME: true,
    deadline: new Date("2026-01-01"),
    status: "not_started",
    framework: "CBAM",
    priority: "medium",
    description:
      "Carbon Border Adjustment Mechanism enters definitive period; SME relief: 50-tonne exemption threshold",
    documentationUrl:
      "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en",
  },
  {
    id: "sec-climate-2026",
    name: "SEC Climate Rule Phase 1",
    region: "US",
    applicableToSME: false,
    deadline: new Date("2026-12-31"),
    status: "not_started",
    framework: "SEC",
    priority: "high",
    description:
      "Large accelerated filers must file climate disclosures (Scope 1/2 emissions)",
    documentationUrl:
      "https://www.sec.gov/news/statement/lee-climate-disclosure-rulemaking-statement-030524",
  },
  {
    id: "uk-sdr-2027",
    name: "UK Sustainability Disclosure Requirements",
    region: "UK",
    applicableToSME: false,
    deadline: new Date("2027-01-01"),
    status: "not_started",
    framework: "UK_SDR",
    priority: "medium",
    description:
      "UK SRS (aligned with ISSB) implementation for asset managers and owners",
    documentationUrl: "https://www.fca.org.uk/publications/policy-statements/ps24-8-sustainability-disclosure-requirements",
  },
  {
    id: "tcfd-ongoing",
    name: "TCFD Recommendations (Voluntary)",
    region: "Global",
    applicableToSME: true,
    deadline: new Date("2025-12-31"),
    status: "not_started",
    framework: "TCFD",
    priority: "low",
    description:
      "Task Force on Climate-related Financial Disclosures - voluntary best practice",
    documentationUrl: "https://www.fsb-tcfd.org/",
  },
  {
    id: "gri-2025",
    name: "GRI Standards (Universal)",
    region: "Global",
    applicableToSME: true,
    deadline: new Date("2025-12-31"),
    status: "not_started",
    framework: "GRI",
    priority: "low",
    description:
      "Global Reporting Initiative standards for sustainability reporting",
    documentationUrl: "https://www.globalreporting.org/",
  },
];

export class ComplianceTracker {
  /**
   * Get requirements applicable to specific company profile
   */
  getApplicableRequirements(params: {
    region?: "EU" | "US" | "UK" | "Global";
    isSME?: boolean;
    framework?: string;
  }): ComplianceRequirement[] {
    return COMPLIANCE_REQUIREMENTS.filter((req) => {
      if (params.region && req.region !== params.region && req.region !== "Global") {
        return false;
      }
      if (params.isSME === true && !req.applicableToSME) {
        return false;
      }
      if (params.framework && req.framework !== params.framework) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get upcoming deadlines within specified days
   */
  getUpcomingDeadlines(days: number = 90): ComplianceRequirement[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return COMPLIANCE_REQUIREMENTS.filter(
      (req) => req.deadline >= now && req.deadline <= futureDate
    ).sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  }

  /**
   * Calculate compliance score
   */
  getComplianceScore(
    region: "EU" | "US" | "UK" | "Global",
    isSME: boolean
  ): {
    completed: number;
    inProgress: number;
    notStarted: number;
    total: number;
    percentage: number;
  } {
    const applicable = this.getApplicableRequirements({ region, isSME });
    const completed = applicable.filter((r) => r.status === "completed").length;
    const inProgress = applicable.filter((r) => r.status === "in_progress").length;
    const notStarted = applicable.filter((r) => r.status === "not_started").length;

    return {
      completed,
      inProgress,
      notStarted,
      total: applicable.length,
      percentage: applicable.length > 0 ? (completed / applicable.length) * 100 : 0,
    };
  }

  /**
   * Get requirements by priority
   */
  getByPriority(priority: "high" | "medium" | "low"): ComplianceRequirement[] {
    return COMPLIANCE_REQUIREMENTS.filter((req) => req.priority === priority);
  }

  /**
   * Calculate days until deadline
   */
  getDaysUntilDeadline(requirementId: string): number | null {
    const req = COMPLIANCE_REQUIREMENTS.find((r) => r.id === requirementId);
    if (!req) return null;

    const now = new Date();
    const diffTime = req.deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export const complianceTracker = new ComplianceTracker();
