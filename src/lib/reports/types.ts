export type BankTarget = "boc" | "hellenic";

export interface BankQuestionResponse {
  id: string;
  category: "Environmental (E)" | "Social (S)" | "Governance (G)";
  code: string;
  questionEn: string;
  questionEl: string;
  answer: string | number;
  unit?: string;
  auditTrail: string;
  sourceDocCount: number;
  isVerified: boolean;
  qualifiesGreenCovenant?: boolean;
}

export interface BankBorrowerPackData {
  targetBank: BankTarget;
  bankName: string;
  company: {
    name: string;
    legalName: string | null;
    registrationNo: string | null;
    sector: string;
    sites: number;
    employees: number;
    revenueEur: number | null;
    bankLinked: boolean;
  };
  metrics: {
    annualElectricityKwh: number;
    scope1Tonnes: number;
    scope2Tonnes: number;
    waterM3: number;
    greenMarginDiscountBps: number;
    estimatedAnnualInterestSavedEur: number | null;
  };
  covenantEligibility: {
    qualifies: boolean;
    tier: "Tier 1 (-35 to -50 bps)" | "Tier 2 (-25 bps)" | "Standard";
    reasonsEn: string[];
    reasonsEl: string[];
  };
  questionnaire: BankQuestionResponse[];
  merkleRootHash: string;
  generatedAt: string;
}

export interface HospitalityPackData {
  profile: {
    propertyName: string;
    hotelCategory: string;
    totalRooms: number;
    annualOccupiedRooms: number;
    annualGuestNights: number;
    hasPool: boolean;
    hasRestaurant: boolean;
    hasSpa: boolean;
    hasLaundryOnSite: boolean;
    ecoLabel: string;
    tourOperatorPartners: string;
  };
  company: {
    name: string;
    legalName: string | null;
    country: string;
    baselineYear: number;
  };
  hcmiMetrics: {
    totalElectricityKwh: number;
    totalScope1KgCo2e: number;
    totalScope2KgCo2e: number;
    totalWaterLiters: number;
    energyPerOccupiedRoomKwh: number;
    carbonPerOccupiedRoomKg: number;
    carbonPerGuestNightKg: number;
    waterPerGuestNightLiters: number;
    tuiCarbonBenchmarkDiffPct: number;
    waterBenchmarkDiffPct: number;
    tourOperatorReadinessScore: number;
  };
  verifiedBills: {
    eacBillsCount: number;
    waterBillsCount: number;
    allMetered: boolean;
  };
  merkleRootHash: string;
  generatedAt: string;
}

export interface VsmeMetricItem {
  id: string;
  code: string;
  labelEn: string;
  labelEl: string;
  value: string | number | null;
  unit?: string;
  source: string;
  isVerified: boolean;
  notes?: string;
}

export interface VsmeDisclosureBlock {
  code: string;
  titleEn: string;
  titleEl: string;
  summaryEn: string;
  summaryEl: string;
  items: VsmeMetricItem[];
  completenessPct: number;
}

export interface VsmePassportData {
  passport: {
    id: number;
    slug: string;
    shareToken: string;
    isPublic: boolean;
    headline: string | null;
    customNotes: string | null;
    viewCount: number;
    lastViewedAt: string | null;
  };
  company: {
    name: string;
    legalName: string | null;
    sector: string;
    country: string;
    employees: number;
    revenueEur: number | null;
    registrationNo: string | null;
    baselineYear: number;
  };
  metrics: {
    totalEnergyMwh: number;
    scope1Tonnes: number;
    scope2Tonnes: number;
    waterM3: number;
    wasteTonnes: number;
    overallCompletenessPct: number;
  };
  disclosures: VsmeDisclosureBlock[];
  verifiedDocumentsCount: number;
  confirmedActionsCount: number;
  generatedAt: string;
  merkleRootHash: string;
}

