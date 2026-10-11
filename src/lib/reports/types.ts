export interface LenderAnswer {
  id: string;
  topic: "E" | "S" | "G";
  questionEn: string;
  questionEl: string;
  /** null when no record backs the answer; the pack lists it as a gap. */
  value: number | null;
  unit?: string;
  sourceEn: string;
  sourceEl: string;
  /** True only when the value comes from bills or documents in the workspace. */
  fromRecords: boolean;
}

export interface LenderPackData {
  company: {
    name: string;
    legalName: string | null;
    registrationNo: string | null;
    sector: string;
    employees: number;
  };
  coverage: { electricityMonths: number; waterMonths: number };
  answers: LenderAnswer[];
  hash: string;
  generatedAt: string;
}

/** Facts the hotel enters itself. Nothing here is ever filled in for them. */
export interface HotelFacts {
  propertyName: string;
  totalRooms: number;
  annualOccupiedRooms: number;
  annualGuestNights: number;
  hasPool: boolean;
  hasRestaurant: boolean;
  hasSpa: boolean;
  hasLaundryOnSite: boolean;
  ecoLabel: string | null;
}

export interface HospitalityPackData {
  /** null until the hotel saves its own room and night figures. */
  profile: HotelFacts | null;
  company: { name: string; legalName: string | null };
  metrics: {
    totalElectricityKwh: number;
    totalCarbonKg: number;
    totalWaterM3: number;
    /** null when there are no bills or no hotel facts to divide by. */
    energyPerOccupiedRoomKwh: number | null;
    carbonPerOccupiedRoomKg: number | null;
    carbonPerGuestNightKg: number | null;
    waterPerGuestNightLiters: number | null;
  };
  bills: { electricity: number; water: number; electricityMonths: number; waterMonths: number };
  hash: string;
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

