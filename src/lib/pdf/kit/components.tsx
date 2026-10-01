/**
 * Building blocks for every Vuneli PDF. Typographic hierarchy, hairline rules
 * and numerals carry the design; no icons, no pill badges (brand rule).
 */

import React from "react";
import { Document, Page, View, Text, Image, Svg, Rect, Line, Text as SvgText, Defs, LinearGradient, Stop, StyleSheet } from "@react-pdf/renderer";
import { C, SANS, DISPLAY, MONO, longDate, fmtSmart } from "./theme";
import { groupedPrint, shortPrint } from "./fingerprint";

export const PAGE_W = 595.28;
export const MARGIN = 54;
export const CONTENT_W = PAGE_W - MARGIN * 2;

const s = StyleSheet.create({
  page: { fontFamily: SANS as unknown as string, fontSize: 9.5, color: C.body, paddingTop: 76, paddingBottom: 70, paddingHorizontal: MARGIN, lineHeight: 1.45 },
  header: { position: "absolute", top: 30, left: MARGIN, right: MARGIN, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 0.5, borderBottomColor: C.rule, paddingBottom: 9 },
  headerText: { fontSize: 7.5, color: C.quiet, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 500 },
  footer: { position: "absolute", bottom: 30, left: MARGIN, right: MARGIN, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderTopWidth: 0.5, borderTopColor: C.rule, paddingTop: 8 },
  footerText: { fontSize: 7, color: C.faint, lineHeight: 1.35 },
  mono: { fontFamily: MONO as unknown as string },
  eyebrow: { fontSize: 7.5, fontWeight: 600, letterSpacing: 1.1, textTransform: "uppercase", color: C.accent },
  h2: { fontFamily: DISPLAY as unknown as string, fontWeight: 600, fontSize: 19, color: C.ink, letterSpacing: -0.3, lineHeight: 1.2 },
  lede: { fontSize: 10, color: C.quiet, marginTop: 5, lineHeight: 1.5, maxWidth: 400 },
});

const font = (f: string[]) => f as unknown as string;

/** Upper-case text drops Greek tonos marks (and other accents), as typesetters do. */
const caps = (t: string) => t.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC");

/* ---------------------------------------------------------------- document */

export function PdfDocument({ title, subject, hash, children }: { title: string; subject: string; hash: string; children: React.ReactNode }) {
  return (
    <Document title={title} subject={subject} author="Vuneli" creator="Vuneli" producer="Vuneli" keywords={`sha256:${hash}`} language="en">
      {children}
    </Document>
  );
}

/* ------------------------------------------------------------------- cover */

export interface CoverMeta {
  label: string;
  value: string;
}

export function Cover({
  image,
  wordmark,
  eyebrow,
  title,
  subtitle,
  meta,
  hash,
  caption,
  contents,
}: {
  image: string;
  wordmark: string;
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  meta: CoverMeta[];
  hash: string;
  caption: string;
  contents?: string[];
}) {
  const imgH = 430;
  return (
    <Page size="A4" style={{ fontFamily: font(SANS), backgroundColor: C.paper, color: C.body }}>
      <View style={{ height: imgH, position: "relative" }}>
        <Image src={image} style={{ width: PAGE_W, height: imgH, objectFit: "cover" }} />
        {/* Soft fade into the paper so the photograph and the type share one surface. */}
        <Svg width={PAGE_W} height={90} style={{ position: "absolute", left: 0, bottom: 0 }}>
          <Defs>
            <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={PAGE_W} height={90} fill="url(#fade)" />
        </Svg>
        <Image src={wordmark} style={{ position: "absolute", top: 34, left: MARGIN, width: 74 }} />
      </View>

      <View style={{ paddingHorizontal: MARGIN, marginTop: 6, flexGrow: 1 }}>
        <Text style={s.eyebrow}>{eyebrow}</Text>
        <Text style={{ fontFamily: font(DISPLAY), fontWeight: 600, fontSize: 34, color: C.ink, letterSpacing: -0.8, lineHeight: 1.08, marginTop: 10, maxWidth: 440 }}>
          {title}
        </Text>
        {subtitle ? <Text style={{ fontSize: 12, color: C.quiet, marginTop: 10, lineHeight: 1.45, maxWidth: 420 }}>{subtitle}</Text> : null}

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 26, borderTopWidth: 0.75, borderTopColor: C.ink }}>
          {meta.map((m, i) => (
            <View key={i} style={{ width: "50%", paddingTop: 10, paddingBottom: 10, paddingRight: 12, borderBottomWidth: 0.5, borderBottomColor: C.rule }}>
              <Text style={{ fontSize: 7, color: C.quiet, letterSpacing: 0.9, textTransform: "uppercase", fontWeight: 600 }}>{m.label}</Text>
              <Text style={{ fontSize: 10.5, color: C.ink, marginTop: 3, fontWeight: 500 }}>{m.value}</Text>
            </View>
          ))}
        </View>
        {contents?.length ? (
          <View style={{ marginTop: 22, flexDirection: "row", flexWrap: "wrap" }}>
            {contents.map((c, i) => (
              <View key={i} style={{ width: "33.33%", flexDirection: "row", paddingVertical: 3, paddingRight: 8 }}>
                <Text style={{ fontFamily: font(DISPLAY), fontSize: 9, color: C.accent, width: 18 }}>{String(i + 1).padStart(2, "0")}</Text>
                <Text style={{ fontSize: 8.5, color: C.body, flex: 1 }}>{c}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: MARGIN, paddingBottom: 34, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <View style={{ maxWidth: 300 }}>
          <Text style={{ fontSize: 6.5, color: C.quiet, letterSpacing: 0.9, textTransform: "uppercase", fontWeight: 600 }}>Document fingerprint (SHA-256)</Text>
          <Text style={[s.mono, { fontSize: 6.8, color: C.body, marginTop: 3, lineHeight: 1.5 }]}>{groupedPrint(hash)}</Text>
        </View>
        <Text style={{ fontSize: 6.5, color: C.faint, maxWidth: 150, textAlign: "right" }}>{caption}</Text>
      </View>
    </Page>
  );
}

/* ------------------------------------------------------------ inner pages */

export function InnerPage({ docTitle, company, hash, children, orientation = "portrait" }: { docTitle: string; company: string; hash: string; children: React.ReactNode; orientation?: "portrait" | "landscape" }) {
  return (
    <Page size="A4" orientation={orientation} style={s.page} wrap>
      <View style={s.header} fixed>
        <Text style={s.headerText}>{caps(company)}</Text>
        <Text style={s.headerText}>{docTitle}</Text>
      </View>
      {children}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>
          Prepared with Vuneli from the company's own records.{"\n"}
          <Text style={s.mono}>SHA-256 {shortPrint(hash)}</Text>
        </Text>
      </View>
      <Text fixed style={{ position: "absolute", bottom: 34, right: MARGIN, fontSize: 7.5, lineHeight: 1, color: C.quiet }} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </Page>
  );
}

export function Section({ n, title, lede, children, breakBefore }: { n: string; title: string; lede?: string | null; children: React.ReactNode; breakBefore?: boolean }) {
  return (
    <View break={breakBefore} style={{ marginBottom: 26 }}>
      <View wrap={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text style={{ fontFamily: font(DISPLAY), fontSize: 11, color: C.accent, width: 26, fontWeight: 500 }}>{n}</Text>
          <Text style={s.h2}>{title}</Text>
        </View>
        {lede ? <Text style={[s.lede, { marginLeft: 26 }]}>{lede}</Text> : null}
      </View>
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ figures */

export interface Kpi {
  label: string;
  value: string;
  unit?: string;
  note?: string | null;
  tone?: "default" | "warn" | "good";
}

export function KpiRow({ items }: { items: Kpi[] }) {
  return (
    <View style={{ flexDirection: "row", borderTopWidth: 0.75, borderTopColor: C.ink }} wrap={false}>
      {items.map((k, i) => (
        <View key={i} style={{ flex: 1, paddingTop: 11, paddingRight: 12, paddingLeft: i === 0 ? 0 : 12, borderLeftWidth: i === 0 ? 0 : 0.5, borderLeftColor: C.rule }}>
          <Text style={{ fontSize: 7, color: C.quiet, letterSpacing: 0.9, textTransform: "uppercase", fontWeight: 600 }}>{k.label}</Text>
          <Text style={{ fontFamily: font(DISPLAY), fontWeight: 600, fontSize: 24, lineHeight: 1.15, letterSpacing: -0.6, marginTop: 6, color: k.tone === "warn" ? C.warn : k.tone === "good" ? C.accent : C.ink }}>
            {k.value}
            {k.unit ? <Text style={{ fontFamily: font(SANS), fontWeight: 400, fontSize: 8.5, letterSpacing: 0, color: C.quiet }}>{"  "}{k.unit}</Text> : null}
          </Text>
          {k.note ? <Text style={{ fontSize: 7.5, color: C.quiet, marginTop: 4, lineHeight: 1.4 }}>{k.note}</Text> : null}
        </View>
      ))}
    </View>
  );
}

export function Callout({ tone = "info", title, children }: { tone?: "info" | "warn"; title: string; children: React.ReactNode }) {
  const bar = tone === "warn" ? C.warn : C.accent;
  const bg = tone === "warn" ? C.warnSoft : C.band;
  return (
    <View wrap={false} style={{ backgroundColor: bg, borderLeftWidth: 2, borderLeftColor: bar, paddingVertical: 10, paddingHorizontal: 12, marginTop: 12 }}>
      <Text style={{ fontSize: 8.5, fontWeight: 600, color: C.ink, marginBottom: 3 }}>{title}</Text>
      <Text style={{ fontSize: 8.5, color: C.body, lineHeight: 1.5 }}>{children}</Text>
    </View>
  );
}

export function Para({ children, style }: { children: React.ReactNode; style?: import("@react-pdf/renderer").Styles[string] }) {
  return <Text style={[{ fontSize: 9.5, color: C.body, lineHeight: 1.55, marginBottom: 8 }, style ?? {}]}>{children}</Text>;
}

/* -------------------------------------------------------------------- table */

export interface Column {
  label: string;
  /** Share of the table width (any units; normalised). */
  w: number;
  align?: "left" | "right";
  mono?: boolean;
}

export type CellValue = string | { text: string; tone?: "warn" | "quiet" | "good" | "bad"; strong?: boolean };

export function DataTable({ columns, rows, width = CONTENT_W, foot, empty = "Nothing recorded." }: { columns: Column[]; rows: CellValue[][]; width?: number; foot?: CellValue[]; empty?: string }) {
  const total = columns.reduce((a, c) => a + c.w, 0);
  const widths = columns.map((c) => (c.w / total) * width);
  const cell = (v: CellValue, i: number, bold = false) => {
    const o = typeof v === "string" ? { text: v } : v;
    const color = o.tone === "warn" ? C.warn : o.tone === "bad" ? C.bad : o.tone === "good" ? C.accent : o.tone === "quiet" ? C.quiet : C.ink;
    return (
      <View key={i} style={{ width: widths[i], paddingVertical: 5.5, paddingHorizontal: 5, justifyContent: "center" }}>
        <Text
          style={{
            fontSize: 8,
            lineHeight: 1.35,
            color,
            textAlign: columns[i].align ?? "left",
            fontWeight: bold || o.strong ? 600 : 400,
            fontFamily: columns[i].mono ? font(MONO) : font(SANS),
          }}
        >
          {o.text || "—"}
        </Text>
      </View>
    );
  };
  return (
    <View style={{ width }}>
      <View fixed style={{ flexDirection: "row", borderBottomWidth: 0.75, borderBottomColor: C.ink, marginLeft: -5, marginRight: -5 }}>
        {columns.map((c, i) => (
          <View key={i} style={{ width: widths[i], paddingVertical: 5, paddingHorizontal: 5 }}>
            <Text style={{ fontSize: 6.8, fontWeight: 600, color: C.quiet, letterSpacing: 0.7, textTransform: "uppercase", textAlign: c.align ?? "left" }}>{c.label}</Text>
          </View>
        ))}
      </View>
      {rows.length === 0 ? (
        <Text style={{ fontSize: 8.5, color: C.quiet, paddingVertical: 10 }}>{empty}</Text>
      ) : (
        rows.map((r, ri) => (
          <View key={ri} wrap={false} style={{ flexDirection: "row", borderBottomWidth: 0.4, borderBottomColor: C.hair, backgroundColor: ri % 2 ? C.band : C.paper, marginLeft: -5, marginRight: -5 }}>
            {r.map((v, i) => cell(v, i))}
          </View>
        ))
      )}
      {foot ? (
        <View wrap={false} style={{ flexDirection: "row", borderTopWidth: 0.75, borderTopColor: C.ink, marginLeft: -5, marginRight: -5 }}>
          {foot.map((v, i) => cell(v, i, true))}
        </View>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------- chart */

export function BarChart({ points, unit, width = CONTENT_W, height = 150, highlightLast = true }: { points: Array<{ label: string; value: number }>; unit: string; width?: number; height?: number; highlightLast?: boolean }) {
  if (points.length === 0) return null;
  const padL = 34;
  const padB = 18;
  const padT = 14;
  const max = Math.max(...points.map((p) => p.value), 0) || 1;
  const nice = (() => {
    const p = Math.pow(10, Math.floor(Math.log10(max)));
    const m = max / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  })();
  const plotW = width - padL;
  const plotH = height - padB - padT;
  const slot = plotW / points.length;
  const bw = Math.min(26, slot * 0.62);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const step = Math.max(1, Math.ceil(points.length / 12));
  return (
    <View wrap={false}>
      <Svg width={width} height={height}>
        {ticks.map((t) => {
          const y = padT + plotH - t * plotH;
          return (
            <React.Fragment key={t}>
              <Line x1={padL} y1={y} x2={width} y2={y} stroke={t === 0 ? C.ink : C.hair} strokeWidth={t === 0 ? 0.75 : 0.5} />
              <SvgText x={padL - 6} y={y + 2.5} style={{ fontSize: 6.5, fontFamily: font(SANS) }} fill={C.quiet} textAnchor="end">
                {axisLabel(nice * t, nice)}
              </SvgText>
            </React.Fragment>
          );
        })}
        {points.map((p, i) => {
          const h = Math.max(0.5, (p.value / nice) * plotH);
          const x = padL + i * slot + (slot - bw) / 2;
          const last = highlightLast && i === points.length - 1;
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={padT + plotH - h} width={bw} height={h} fill={last ? C.accent : "#B9C8AE"} />
              {i % step === 0 || last ? (
                <SvgText x={x + bw / 2} y={height - 5} style={{ fontSize: 6.5, fontFamily: font(SANS) }} fill={C.quiet} textAnchor="middle">
                  {p.label}
                </SvgText>
              ) : null}
            </React.Fragment>
          );
        })}
        <SvgText x={0} y={8} style={{ fontSize: 6.5, fontFamily: font(SANS) }} fill={C.quiet}>
          {unit}
        </SvgText>
      </Svg>
    </View>
  );
}

function axisLabel(v: number, top: number) {
  const step = top / 4;
  const d = step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
  return v.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** Horizontal share bars: label, bar, value. Used for sector and supplier splits. */
export function ShareBars({ items, unit, width = CONTENT_W }: { items: Array<{ label: string; value: number; note?: string }>; unit: string; width?: number }) {
  const max = Math.max(...items.map((i) => i.value), 0) || 1;
  const labelW = width * 0.32;
  const valueW = width * 0.18;
  const barW = width - labelW - valueW;
  return (
    <View>
      {items.map((it, i) => (
        <View key={i} wrap={false} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4.5, borderBottomWidth: 0.4, borderBottomColor: C.hair }}>
          <View style={{ width: labelW, paddingRight: 8 }}>
            <Text style={{ fontSize: 8.5, color: C.ink }}>{it.label}</Text>
            {it.note ? <Text style={{ fontSize: 7, color: C.quiet }}>{it.note}</Text> : null}
          </View>
          <View style={{ width: barW, height: 7, backgroundColor: C.hair }}>
            <View style={{ width: `${Math.max(1, (it.value / max) * 100)}%`, height: 7, backgroundColor: i === 0 ? C.accent : "#9DB38F" }} />
          </View>
          <Text style={{ width: valueW, fontSize: 8.5, color: C.ink, textAlign: "right", fontWeight: 600 }}>
            {fmtSmart(it.value)} <Text style={{ fontWeight: 400, color: C.quiet, fontSize: 7 }}>{unit}</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ---------------------------------------------------------------- closing */

export function FingerprintBlock({ hash, generatedAt, sources }: { hash: string; generatedAt: Date; sources: string[] }) {
  return (
    <View wrap={false} style={{ marginTop: 10, borderTopWidth: 0.75, borderTopColor: C.ink, paddingTop: 12 }}>
      <Text style={s.eyebrow}>About this document</Text>
      <Text style={{ fontSize: 8.5, color: C.body, marginTop: 6, lineHeight: 1.55 }}>
        Generated on {longDate(generatedAt)} from the records held in Vuneli. Every figure comes from a stored reading, an uploaded document or an
        official published factor; nothing is estimated without being marked as such.
      </Text>
      {sources.length ? (
        <View style={{ marginTop: 8 }}>
          {sources.map((src, i) => (
            <Text key={i} style={{ fontSize: 7.5, color: C.quiet, lineHeight: 1.5 }}>
              {String(i + 1).padStart(2, "0")}  {src}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={{ marginTop: 12, backgroundColor: C.band, padding: 10 }}>
        <Text style={{ fontSize: 6.8, color: C.quiet, letterSpacing: 0.9, textTransform: "uppercase", fontWeight: 600 }}>Document fingerprint (SHA-256)</Text>
        <Text style={[s.mono, { fontSize: 8, color: C.ink, marginTop: 4, lineHeight: 1.5 }]}>{groupedPrint(hash)}</Text>
        <Text style={{ fontSize: 7, color: C.quiet, marginTop: 5, lineHeight: 1.45 }}>
          A digest of the exact data printed here. The same data always produces the same fingerprint, so a changed figure shows up as a different
          fingerprint. It is a tamper check, not a qualified electronic signature.
        </Text>
      </View>
    </View>
  );
}
