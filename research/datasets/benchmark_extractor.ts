import { dirname as __dn } from "node:path";
import { fileURLToPath as __fu } from "node:url";
const __here = __dn(__fu(import.meta.url));
/**
 * Scores the app's bill/receipt field extractor (src/lib/ocr/extract-bill-data.ts)
 * against labelled sample documents. Input text comes from local Tesseract
 * (stand-in for the production Gemini transcription). Run:
 *   bun research/datasets/benchmark_extractor.ts /tmp/ocrtxt
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { extractUtilityBillData } from '../../src/lib/ocr/extract-bill-data';

const txtDir = process.argv[2] ?? '/tmp/ocrtxt';
const root = join(__here, 'samples');
const manifest: { file: string; type: string }[] = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));

// Compare on digits only: "60.000" (IDR), "$ 8,25" (EU decimal) and 8.25 all reduce comparably.
const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '').replace(/^0+/, '');
function goldTotal(type: string, gt: any): string | null {
  const p = gt?.ground_truth?.gt_parse;
  const v = type === 'receipt' ? p?.total?.total_price : p?.summary?.total_gross_worth;
  return v ? digits(v) : null;
}

type Row = { file: string; type: string; ocr: boolean; gold: string | null; found: boolean; correct: boolean; textHasGold: boolean };
const rows: Row[] = [];
for (const m of manifest.filter((m) => m.type !== 'form')) {
  const base = m.file.split('/').pop()!.replace('.jpg', '');
  const txtPath = join(txtDir, base + '.txt');
  const gold = goldTotal(m.type, JSON.parse(readFileSync(join(root, m.file.replace('.jpg', '.json')), 'utf8')));
  if (!existsSync(txtPath)) { rows.push({ file: m.file, type: m.type, ocr: false, gold, found: false, correct: false, textHasGold: false }); continue; }
  const text = readFileSync(txtPath, 'utf8');
  const r = extractUtilityBillData(text);
  const got = r.totalAmount == null ? '' : digits(r.totalAmount.toFixed(2));
  const correct = !!gold && !!got && (got === gold || got.replace(/0+$/, '') === gold.replace(/0+$/, ''));
  rows.push({ file: m.file, type: m.type, ocr: true, gold, found: r.totalAmount != null, correct, textHasGold: !!gold && digits(text).includes(gold) });
}

const out: string[] = [];
for (const type of ['receipt', 'invoice']) {
  const s = rows.filter((r) => r.type === type && r.ocr && r.gold);
  const pct = (n: number) => `${n} (${((100 * n) / (s.length || 1)).toFixed(1)}%)`;
  out.push(`${type}: n=${s.length} | text contains true total: ${pct(s.filter((r) => r.textHasGold).length)} | extractor returned a total: ${pct(s.filter((r) => r.found).length)} | total correct: ${pct(s.filter((r) => r.correct).length)}`);
}
console.log(out.join('\n'));
writeFileSync(join(__here, 'benchmark_results.json'), JSON.stringify(rows, null, 1));
