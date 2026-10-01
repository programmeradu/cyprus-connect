/**
 * CBAM declaration PDF: the annual draft as a working paper for the
 * declarant, customs broker or verifier. It is not the Registry filing.
 */

import React from "react";
import { View, Text } from "@react-pdf/renderer";
import type { CbamDraft } from "@/lib/agents/cbam-calc";
import { Callout, Cover, DataTable, FingerprintBlock, InnerPage, KpiRow, PdfDocument, Section, ShareBars, type CellValue } from "./kit/components";
import { C, eur, fmt, fmtSmart, longDate, registerPdfFonts } from "./kit/theme";
import { fingerprint, groupedPrint } from "./kit/fingerprint";
import { assetBase, savePdf } from "./kit/save";

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

const BASIS: Record<string, CellValue> = {
  actual: { text: "Actual", tone: "good" },
  default: { text: "EU default", tone: "warn" },
  mixed: { text: "Part default", tone: "warn" },
  unknown_cn: { text: "Not CBAM / unknown", tone: "bad" },
  no_default: { text: "Needs supplier value", tone: "bad" },
};

const STATUS: Record<string, string> = {
  signed: "Signed",
  awaiting_signature: "Ready for signature",
  below_threshold: "Below the 50 t threshold",
  needs_data: "Needs data fixes",
};

export function CbamDocument({ d, hash, base, generatedAt }: { d: CbamPdfInput; hash: string; base: string; generatedAt: Date }) {
  const t = d.draft.totals;
  const title = `CBAM declaration ${d.year}`;
  const company = d.declarant.legalName || d.company;
  return (
    <PdfDocument title={`${company} — ${title}`} subject="CBAM annual declaration draft" hash={hash}>
      <Cover
        image={`${base}/pdf-art/cbam-cover.jpg`}
        wordmark={`${base}/pdf-art/wordmark.png`}
        eyebrow={`CBAM · Regulation (EU) 2023/956 · ${d.year}`}
        title={title}
        subtitle={company}
        meta={[
          { label: "Status", value: STATUS[d.status] ?? d.status },
          { label: "Due", value: longDate(d.draft.dueDate) },
          { label: "EORI", value: d.declarant.eori || "Not recorded" },
          { label: "CBAM account", value: d.declarant.accountNumber || "Not recorded" },
        ]}
        hash={hash}
        caption="Photograph: Limassol port. Generated illustration."
        contents={["Summary", "By sector", "By supplier", "Import lines", "Open issues", "Method and sources"]}
      />

      <InnerPage docTitle={title} company={company} hash={hash}>
        <Section n="01" title="Summary">
          <KpiRow
            items={[
              { label: "Embedded emissions", value: fmtSmart(t.embeddedT), unit: "tCO2e", note: `Direct ${fmtSmart(t.directT)} · indirect ${fmtSmart(t.indirectT)}` },
              { label: "Goods counted", value: fmtSmart(t.massTonnesCounted), unit: "t", note: t.electricityMWh ? `Plus ${fmtSmart(t.electricityMWh)} MWh electricity` : `${t.lines} import line(s)` },
              { label: "Certificates", value: fmt(t.certificates, 2), note: t.costMissingLines ? `${t.costMissingLines} line(s) without a figure` : "After free allocation" },
              { label: "Estimated cost", value: eur(t.costEur), note: t.costProvisional ? "* Uses the latest published price" : "Official 2026 prices", tone: "warn" },
            ]}
          />
          {t.defaultShare > 0 ? (
            <Callout tone="warn" title={`${Math.round(t.defaultShare * 100)}% of emissions use EU default values`}>
              Default values carry a mark-up and are usually higher than a supplier's actual values. Asking suppliers for actual data normally lowers the
              certificate cost.
            </Callout>
          ) : null}
          {d.draft.belowThreshold ? (
            <Callout title="Below the 50 tonne threshold">Imports of CBAM goods this year are under 50 tonnes (electricity and hydrogen excluded), so no declaration is due.</Callout>
          ) : null}
        </Section>

        <Section n="02" title="By sector">
          <ShareBars items={d.draft.bySector.map((s) => ({ label: SECTOR[s.sector] ?? s.sector, value: s.embeddedT, note: `${fmtSmart(s.massTonnes)} t` }))} unit="tCO2e" />
        </Section>

        <Section n="03" title="By supplier">
          <DataTable
            columns={[
              { label: "Supplier", w: 3 },
              { label: "Lines", w: 0.7, align: "right" },
              { label: "On defaults", w: 1, align: "right" },
              { label: "Embedded tCO2e", w: 1.3, align: "right" },
            ]}
            rows={d.draft.bySupplier.map((s): CellValue[] => [
              s.supplierName,
              String(s.lines),
              s.defaultLines ? { text: String(s.defaultLines), tone: "warn" } : { text: "0", tone: "quiet" },
              { text: fmt(s.embeddedT, 3), strong: true },
            ])}
          />
        </Section>

        <Section n="04" title="Import lines" breakBefore lede="Every line in the declaration, with the value basis and the default table used.">
          <DataTable
            columns={[
              { label: "CN code", w: 1.05, mono: true },
              { label: "Supplier · origin", w: 2 },
              { label: "Mass", w: 0.9, align: "right" },
              { label: "Basis", w: 1.15 },
              { label: "Default used", w: 1.4 },
              { label: "tCO2e", w: 0.85, align: "right" },
              { label: "Cost", w: 0.85, align: "right" },
            ]}
            rows={d.draft.lines.map((l): CellValue[] => [
              l.cnCode,
              `${l.supplierName} · ${l.originCountry}${l.installationId ? `\n${l.installationId}` : ""}`,
              `${fmt(l.netMass, 3)} ${l.unit}`,
              BASIS[l.basis] ?? l.basis,
              l.defaultSource ? { text: `${l.defaultSource.tableName}\n${fmt(l.defaultSource.total, 3)} t/t`, tone: "quiet" } : { text: "—", tone: "quiet" },
              { text: fmt(l.embeddedT, 3), strong: true },
              l.costEur != null ? `${eur(l.costEur)}${l.priceProvisional ? "*" : ""}` : "—",
            ])}
            foot={["Total", `${t.lines} line(s)`, `${fmtSmart(t.massTonnesCounted)} t`, "", "", fmt(t.embeddedT, 3), `${eur(t.costEur)}${t.costProvisional ? "*" : ""}`]}
          />
        </Section>

        <Section n="05" title="Open issues" lede={d.draft.issues.length ? "Fix these before signing." : null}>
          {d.draft.issues.length ? (
            <DataTable
              columns={[
                { label: "#", w: 0.3 },
                { label: "Issue", w: 5 },
                { label: "Lines", w: 1 },
              ]}
              rows={d.draft.issues.map((i, k): CellValue[] => [String(k + 1), i.message, i.lineIds.join(", ")])}
            />
          ) : (
            <Text style={{ fontSize: 9, color: C.accent }}>No open issues.</Text>
          )}
        </Section>

        <Section n="06" title="Method and sources">
          <Text style={{ fontSize: 8.5, lineHeight: 1.55, color: C.body }}>
            Embedded emissions are net mass times specific embedded emissions. Supplier actual values are used where given. Otherwise the EU default
            value for the country of origin is used, then the "other countries" table, then the highest value for unknown origin. Certificates are
            embedded emissions with the default mark-up, less free allocation (benchmark times the CBAM phase-in factor), and the cost uses the
            official quarterly certificate price. Costs marked * use the latest published price because the quarter's price is not yet published.
          </Text>
        </Section>

        {d.status === "signed" ? (
          <View wrap={false} style={{ borderWidth: 0.75, borderColor: C.ink, padding: 12, marginBottom: 14 }}>
            <Text style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: 1.1, textTransform: "uppercase", color: C.accent }}>Signature recorded in Vuneli</Text>
            <Text style={{ fontSize: 10, color: C.ink, marginTop: 5 }}>
              {d.signedBy ?? "—"} · {d.signedAt ? longDate(d.signedAt) : "—"}
            </Text>
            <Text style={{ fontSize: 7, color: C.quiet, marginTop: 4, fontFamily: "JetBrains Mono" }}>Draft {groupedPrint(d.draftHash)}</Text>
            <Text style={{ fontSize: 7, color: C.quiet, marginTop: 4 }}>Recorded in Vuneli only. Submission is made by the authorised declarant in the EU CBAM Registry.</Text>
          </View>
        ) : null}

        <FingerprintBlock
          hash={hash}
          generatedAt={generatedAt}
          sources={[
            "Regulation (EU) 2023/956, as amended by Regulation (EU) 2025/2083",
            "Default values: Implementing Regulation (EU) 2025/2621, corrected by (EU) 2026/1740",
            "Benchmarks: Implementing Regulation (EU) 2025/2620",
            "Cross-sectoral correction factor: Decision (EU) 2026/1862",
            "Certificate prices: European Commission, published quarterly",
          ]}
        />
      </InnerPage>
    </PdfDocument>
  );
}

export async function buildCbamPdf(d: CbamPdfInput, base: string, generatedAt = new Date()) {
  registerPdfFonts(base);
  const hash = await fingerprint({ kind: "cbam", d });
  return { element: <CbamDocument d={d} hash={hash} base={base} generatedAt={generatedAt} />, hash };
}

export async function downloadCbamPdf(d: CbamPdfInput, fileName: string) {
  const { element } = await buildCbamPdf(d, assetBase());
  await savePdf(element, fileName);
}
