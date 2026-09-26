/**
 * Money/number parsing for OCR text in mixed locales:
 * "142,50" (Cyprus/EU), "1.234,56", "1,234.56", "60,000" / "60.000" (thousands), "$ 8,25".
 */
const NUMBER_TOKEN = /\d{1,3}(?:[.,\s]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?/g;

export function parseAmount(raw: string): number | null {
  const s = raw.replace(/\s/g, '');
  if (!/\d/.test(s)) return null;
  const lastSep = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
  if (lastSep === -1) return Number(s);
  const decimals = s.length - lastSep - 1;
  // A final separator followed by exactly 3 digits is a thousands separator (60,000 / 60.000).
  if (decimals === 3) return Number(s.replace(/[.,]/g, ''));
  const intPart = s.slice(0, lastSep).replace(/[.,]/g, '');
  const n = Number(`${intPart}.${s.slice(lastSep + 1)}`);
  return Number.isFinite(n) ? n : null;
}

/** All amounts on a line, left to right. Ignores values glued to letters (e.g. "@ty2"). */
export function amountsInLine(line: string): number[] {
  const out: number[] = [];
  for (const m of line.matchAll(NUMBER_TOKEN)) {
    const before = line[m.index! - 1] ?? ' ';
    if (/[a-z]/i.test(before)) continue;
    const v = parseAmount(m[0].trim());
    if (v != null) out.push(v);
  }
  return out;
}

// Highest priority first. Subtotals, tax lines and usage totals are excluded.
const TOTAL_LABELS: RegExp[] = [
  /amount\s*(?:due|payable)|total\s*(?:due|payable|to\s*pay)|grand\s*total|πληρωτέο|συνολο\s*πληρωμ/i,
  /\btotal\b|σύνολο|συνολο/i,
  /\bbalance\b/i,
];
const NOT_TOTAL = /sub\s*-?\s*total|total\s*(?:usage|consumption|kwh|units|qty|items?)|\btax\b|\bvat\b(?!.*total)|discount|change|cash/i;

/** Picks the payable total from OCR text; the last amount on the best label line wins (gross after net/tax). */
export function extractTotal(text: string): number | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const label of TOTAL_LABELS) {
    let found: number | null = null;
    lines.forEach((line, i) => {
      if (!label.test(line) || NOT_TOTAL.test(line)) return;
      let amounts = amountsInLine(line.replace(label, ' '));
      if (!amounts.length && lines[i + 1]) amounts = amountsInLine(lines[i + 1]);
      const money = amounts.filter((a) => a > 0);
      if (money.length) found = money[money.length - 1];
    });
    if (found != null) return found;
  }
  return null;
}

/** Usage amount directly attached to a unit, e.g. "812 kWh" or "Consumption: 1.204,5 kWh". */
export function extractUsage(text: string, unit: RegExp): number | null {
  const re = new RegExp(`(\\d[\\d.,\\s]*?)\\s*(?:${unit.source})`, 'gi');
  const values = [...text.matchAll(re)].map((m) => parseAmount(m[1].trim())).filter((v): v is number => v != null && v > 0);
  return values.length ? Math.max(...values) : null;
}
