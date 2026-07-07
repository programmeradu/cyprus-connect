export interface UtilityBillData {
  accountNumber: string | null;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  usageAmount: number | null;
  usageUnit: 'kWh' | 'm³' | 'BTU' | 'gallons' | null;
  usageType: 'electricity' | 'gas' | 'water' | 'unknown' | null;
  totalAmount: number | null;
  currency: string;
  rawText: string;
  extractedAt: string;
}

export interface OCRResult {
  success: boolean;
  text: string;
  confidence?: number;
  error?: string;
  processingTime: number;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  fileSize: number;
  mimeType: string;
}
