/**
 * CBAM declaration PDF: the annual draft as a working paper for the
 * declarant, customs broker or verifier. It is not the Registry filing.
 * Layout: public/pdf-typst/cbam.typ.
 */

import type { CbamDraft } from "@/lib/agents/cbam-calc";
import { fingerprint, groupedPrint } from "./kit/fingerprint";
import { docId, eur, fmt, fmtSmart, longDate } from "./format";

export interface CbamPdfInput {
  year: number;
  company: string;
  declarant: { legalName: string | null; eori: string | null; accountNumber: string | null };
  status: string;
  draftHash: string;
  signedBy: string | null;
  signedAt: string | null;
  draft: CbamDraft;
}

const SECTOR: Record<string, string> = {
  cement: "Cement",
  "iron-steel": "Iron and steel",
  aluminium: "Aluminium",
  fertilisers: "Fertilisers",
  hydrogen: "Hydrogen",
  electricity: "Electricity",
};

const BASIS: Record<string, [string, string]> = {
  actual: ["Actual", "good"],
  default: ["EU default", "warn"],
  mixed: ["Part default", "warn"],
  unknown_cn: ["Not CBAM / unknown", "bad"],
  no_default: ["Needs supplier value", "bad"],
};

const STATUS: Record<string, [string, string]> = {
  signed: ["Signed", "good"],
  awaiting_signature: ["Ready for signature", ""],
  below_threshold: ["Below the 50 t threshold", "good"],
  needs_data: ["Needs data fixes", "warn"],
};

export const CBAM_SOURCES = [
  "Regulation (EU) 2023/956, as amended by Regulation (EU) 2025/2083",
  "Default values: Implementing Regulation (EU) 2025/2621, corrected by (EU) 2026/1740",
  "Benchmarks: Implementing Regulation (EU) 2025/2620",
  "Cross-sectoral correction factor: Decision (EU) 2026/1862",
  "Certificate prices: European Commission, published quarterly",
];

export function cbamData(d: CbamPdfInput, hash: string, generatedAt: Date) {
  const t = d.draft.totals;
  const maxSector = Math.max(1e-9, ...d.draft.bySector.map((s) => s.embeddedT));
  const [statusText, statusTone] = STATUS[d.status] ?? [d.status, ""];
  const notes: { title: string; body: string; tone: string }[] = [];
  if (t.defaultShare > 0)
    notes.push({
      title: `${Math.round(t.defaultShare * 100)}% of emissions use EU default values`,
      body: "Default values carry a mark-up and are usually higher than a supplier's actual values. Asking suppliers for actual data normally lowers the certificate cost.",
      tone: "warn",
    });
  if (d.draft.belowThreshold)
    notes.push({
      title: "Below the 50 tonne threshold",
      body: "Imports of CBAM goods this year are under 50 tonnes (electricity and hydrogen excluded), so no declaration is due.",
      tone: "good",
    });
  return {
    hash,
    docId: docId("CB", hash, generatedAt),
    issued: longDate(generatedAt),
    year: d.year,
    company: d.declarant.legalName || d.company,
    statusText,
    statusTone,
    due: longDate(d.draft.dueDate),
    eori: d.declarant.eori || "Not recorded",
    account: d.declarant.accountNumber || "Not recorded",
    lineCount: String(t.lines),
    kpis: [
      { label: "Embedded emissions", value: fmtSmart(t.embeddedT), unit: "tCO₂e", note: `Direct ${fmtSmart(t.directT)} · indirect ${fmtSmart(t.indirectT)}`, tone: "" },
      { label: "Goods counted", value: fmtSmart(t.massTonnesCounted), unit: "t", note: t.electricityMWh ? `Plus ${fmtSmart(t.electricityMWh)} MWh electricity` : `${t.lines} import line${t.lines === 1 ? "" : "s"}`, tone: "" },
      { label: "Certificates", value: fmt(t.certificates, 2), unit: "", note: t.costMissingLines ? `${t.costMissingLines} line(s) without a figure` : "After free allocation", tone: "" },
      { label: "Estimated cost", value: `${eur(t.costEur)}${t.costProvisional ? "*" : ""}`, unit: "", note: t.costProvisional ? "* Latest published price" : "Official quarterly prices", tone: "warn" },
    ],
    notes,
    sectors: d.draft.bySector.map((s) => ({ label: SECTOR[s.sector] ?? s.sector, value: fmtSmart(s.embeddedT), note: `${fmtSmart(s.massTonnes)} t`, share: s.embeddedT / maxSector })),
    suppliers: d.draft.bySupplier.map((s) => ({ name: s.supplierName, lines: String(s.lines), defaults: s.defaultLines, em: fmt(s.embeddedT, 3) })),
    lines: d.draft.lines.map((l) => {
      const [basis, basisTone] = BASIS[l.basis] ?? [l.basis, ""];
      return {
        cn: l.cnCode,
        supplier: l.supplierName,
        origin: l.originCountry,
        inst: l.installationId ?? "",
        mass: `${fmt(l.netMass, 3)} ${l.unit}`,
        basis,
        basisTone,
        def: l.defaultSource ? `${l.defaultSource.tableName} · ${fmt(l.defaultSource.total, 3)} t/t` : "—",
        em: fmt(l.embeddedT, 3),
        cost: l.costEur != null ? `${eur(l.costEur)}${l.priceProvisional ? "*" : ""}` : "—",
      };
    }),
    foot: ["Total", `${t.lines} line${t.lines === 1 ? "" : "s"}`, `${fmtSmart(t.massTonnesCounted)} t`, "", "", fmt(t.embeddedT, 3), `${eur(t.costEur)}${t.costProvisional ? "*" : ""}`],
    provisional: Boolean(t.costProvisional),
    issues: d.draft.issues.map((i) => ({ msg: i.message, lines: i.lineIds.join(", ") })),
    method:
      'Embedded emissions are net mass times specific embedded emissions. Supplier actual values are used where given. Otherwise the EU default value for the country of origin is used, then the "other countries" table, then the highest value for unknown origin. Certificates are embedded emissions with the default mark-up, less free allocation (benchmark times the CBAM phase-in factor), and the cost uses the official quarterly certificate price.',
    sources: CBAM_SOURCES,
    signature: d.status === "signed" ? { by: d.signedBy ?? "—", at: d.signedAt ? longDate(d.signedAt) : "—", draft: groupedPrint(d.draftHash) } : null,
  };
}

export async function buildCbamData(d: CbamPdfInput, generatedAt = new Date()) {
  const hash = await fingerprint({ kind: "cbam", d });
  return cbamData(d, hash, generatedAt);
}

export async function downloadCbamPdf(d: CbamPdfInput, fileName: string) {
  const { renderTypst, downloadBytes, siteBase } = await import("./typst-render");
  const bytes = await renderTypst("cbam.typ", await buildCbamData(d), { base: siteBase() });
  downloadBytes(bytes, fileName);
}
