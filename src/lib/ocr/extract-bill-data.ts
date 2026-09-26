import { UtilityBillData } from './types';
import { extractTotal, extractUsage } from './amounts';

export function extractUtilityBillData(text: string): UtilityBillData {
  const normalized = text.replace(/\s+/g, ' ').toLowerCase();

  // Account numbers must contain a digit, so ordinary words after "reference" are not picked up.
  const accountNumberMatch =
    normalized.match(/(?:account|acct|ref|reference|αρ\.?\s*λογαριασμού)\s*(?:no\.?|number|#)?[\s:]*((?=[a-z0-9-]*\d)[a-z0-9-]{6,20})/i);
  const accountNumber = accountNumberMatch ? accountNumberMatch[1].toUpperCase() : null;

  const billingPeriodMatch = normalized.match(
    /(?:billing|service|period|from)[\s:]*(\d{1,2}[\s\/\-.](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2})[\s\/\-.]\d{2,4})/gi
  );
  const billingPeriodStart = billingPeriodMatch ? billingPeriodMatch[0] : null;
  const billingPeriodEnd = billingPeriodMatch && billingPeriodMatch[1] ? billingPeriodMatch[1] : null;

  let usageType: UtilityBillData['usageType'] = 'unknown';
  let usageUnit: UtilityBillData['usageUnit'] = null;
  let usageAmount: number | null = null;

  if (/(electric|kwh|kilowatt|ηλεκτρ|αρηκ|\beac\b)/i.test(normalized)) {
    usageType = 'electricity';
    usageUnit = 'kWh';
    usageAmount = extractUsage(text, /kwh/);
  } else if (/(\bgas\b|therm|mmbtu|cubic foot|ccf)/i.test(normalized)) {
    usageType = 'gas';
    usageUnit = 'BTU';
    usageAmount = extractUsage(text, /therms?|mmbtu|ccf/);
  } else if (/(water|νερ|gallons|cubic meter|m³|m3)/i.test(normalized)) {
    usageType = 'water';
    usageUnit = /gallons/i.test(normalized) ? 'gallons' : 'm³';
    usageAmount = extractUsage(text, /m³|m3|gallons/);
  }

  const totalAmount = extractTotal(text);
  const currency = /£|gbp/i.test(normalized) ? 'GBP' : /€|eur/i.test(normalized) ? 'EUR' : /\$|usd/i.test(normalized) ? 'USD' : 'EUR';

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
