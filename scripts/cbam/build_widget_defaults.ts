/**
 * Small official-default table for the public CBAM tool: each CN heading the
 * tool offers x each country it offers. Re-run after the default-value JSON
 * changes: bun scripts/cbam/build_widget_defaults.ts
 */
import { writeFileSync } from "node:fs";
import { CN_CODES, CBAM_COUNTRIES } from "../../src/data/tools/cbam-cn-codes";
import { lookupDefault, sectorOf } from "../../src/lib/cbam/official";

const INDIRECT = new Set(["cement", "fertilisers"]);
const out: Record<string, Record<string, [number, number, string]>> = {};
for (const cn of CN_CODES) {
  for (const c of CBAM_COUNTRIES) {
    const dv = lookupDefault(cn.code, c.code);
    if (!dv) continue;
    const ind = INDIRECT.has(sectorOf(cn.code) ?? "") ? dv.indirect ?? 0 : 0;
    (out[cn.code] ??= {})[c.code] = [Math.round((dv.total - ind) * 1000) / 1000, ind, dv.table];
  }
}
writeFileSync("src/data/cbam/widget-defaults.json", JSON.stringify(out));
console.log(Object.keys(out).length, "CN codes");
