import { UtilityBillData } from './types';

export function extractUtilityBillData(text: string): UtilityBillData {
  // Normalize text: remove extra whitespace, lowercase for matching
  const normalized = text.replace(/\s+/g, ' ').toLowerCase();

  // Account number patterns
  const accountNumberMatch =
    normalized.match(/(?:account|acct|ref|reference)[\s:]*([a-z0-9]{6,20})/i) ||
    normalized.match(/([a-z0-9]{10,20})\s*(?:account|bill|statement)/i);
  const accountNumber = accountNumberMatch ? accountNumberMatch[1].toUpperCase() : null;

  // Billing period extraction
  const billingPeriodMatch = normalized.match(
    /(?:billing|service|period|from)[\s:]*(\d{1,2}[\s\/\-](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2})[\s\/\-]\d{2,4})/gi
  );
  const billingPeriodStart = billingPeriodMatch ? billingPeriodMatch[0] : null;
  const billingPeriodEnd = billingPeriodMatch && billingPeriodMatch[1] ? billingPeriodMatch[1] : null;

  // Determine utility type
  let usageType: 'electricity' | 'gas' | 'water' | 'unknown' = 'unknown';
  let usageUnit: 'kWh' | 'm³' | 'BTU' | 'gallons' | null = null;

  if (/(electric|kwh|kilowatt|electricity)/i.test(normalized)) {
    usageType = 'electricity';
    usageUnit = 'kWh';
  } else if (/(gas|therm|mmbtu|cubic foot|ccf)/i.test(normalized)) {
    usageType = 'gas';
    usageUnit = 'BTU';
  } else if (/(water|gallons|cubic meter|m³|m3|ccf water)/i.test(normalized)) {
    usageType = 'water';
    usageUnit = 'gallons';
  }

  // Usage amount extraction
  const usageMatch = normalized.match(
    /(?:usage|consumption|total.*?usage|meter.*?reading)[\s:]*([0-9,]+\.?[0-9]*)\s*(?:kwh|therm|gallons|m³|m3|ccf)?/i
  );
  const usageAmount = usageMatch
    ? parseFloat(usageMatch[1].replace(/,/g, ''))
    : null;

  // Total amount extraction
  const totalMatch = normalized.match(
    /(?:total|amount due|total due|balance|total charges)[\s:]*\$?\s*([0-9,]+\.[0-9]{2})/i
  );
  const totalAmount = totalMatch
    ? parseFloat(totalMatch[1].replace(/,/g, ''))
    : null;

  // Currency detection
  const currency = /£|gbp/i.test(normalized) ? 'GBP' : /€|eur/i.test(normalized) ? 'EUR' : 'USD';

  return {
    accountNumber,
    billingPeriodStart,
    billingPeriodEnd,
    usageAmount,
    usageUnit,
    usageType,
    totalAmount,
    currency,
    rawText: text,
    extractedAt: new Date().toISOString(),
  };
}
