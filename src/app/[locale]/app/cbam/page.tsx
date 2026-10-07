"use client";

/**
 * CBAM declaration. Import lines come from the user's customs CSV; every
 * figure below is the Border agent's stored draft. Nothing is invented here.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Btn,
  ConsolePage,
  ConsoleTable,
  Empty,
  Plate,
  PlateGrid,
  Reading,
  ReadingRail,
  State,
  type Column,
} from "@/components/app/console/kit";
import { invalidateWorkspace, useWorkspaceResource, workspaceRequest } from "@/components/app/console/workspace-store";
import { PendingEmailsPlate, RegistryPlate, SupplierContactsPlate, type PendingEmail, type Declarant, type SentRequest, type SupplierContact } from "@/components/app/console/CbamContacts";

interface Line {
  id: number;
  importDate: string;
  cnCode: string;
  description: string | null;
  originCountry: string;
  supplierName: string;
  installationId: string | null;
  netMass: number;
  directSee: number | null;
  indirectSee: number | null;
  customsRef: string | null;
}
interface DraftLine {
  id: number;
  basis: "actual" | "default" | "mixed" | "unknown_cn" | "no_default";
  embeddedT: number;
  unit: string;
  sector: string | null;
  defaultSource?: null | { table: "country" | "other" | "unknown_origin"; tableName: string; total: number };
  certificates?: number | null;
  costEur?: number | null;
  priceProvisional?: boolean;
}
interface Draft {
  dueDate: string;
  totals: { lines: number; massTonnesCounted: number; electricityMWh: number; directT: number; indirectT: number; embeddedT: number; defaultShare: number; certificates?: number; costEur?: number; costMissingLines?: number; costProvisional?: boolean };
  bySupplier: Array<{ supplierName: string; lines: number; embeddedT: number; defaultLines: number }>;
  issues: Array<{ kind: string; message: string; supplierName?: string }>;
  lines: DraftLine[];
}
interface Data {
  year: number;
  years: number[];
  lines: Line[];
  declaration: null | {
    status: string;
    draftHash: string;
    draft: Draft;
    signedBy: string | null;
    signedAt: string | null;
    updatedAt: string;
  };
  suppliers: SupplierContact[];
  declarant: Declarant;
  requests: SentRequest[];
  exportGaps: string[] | null;
  pendingEmails: PendingEmail[];
}

const TEMPLATE =
  "import_date,cn_code,description,origin_country,supplier,installation_id,net_mass,direct_see,indirect_see,customs_ref\n" +
  "2026-03-14,7208 51,Hot-rolled steel plate,TR,Example Steel AS,TR-INST-001,24.5,1.9,,CY26IM000123\n";

const STATUS_TONE: Record<string, "good" | "warn" | "bad" | "idle" | "live"> = {
  signed: "good",
  awaiting_signature: "live",
  below_threshold: "idle",
  needs_data: "bad",
};

const BASIS_TONE: Record<DraftLine["basis"], "good" | "warn" | "bad"> = {
  actual: "good",
  mixed: "warn",
  default: "warn",
  unknown_cn: "bad",
  no_default: "bad",
};

const CBAM = "/api/console/cbam";

export default function CbamPage() {
  const t = useTranslations("dashboard.cbam");
  const loc = useLocale() === "el" ? "el-CY" : "en-GB";
  const n = useCallback((v: number, dp = 2) => v.toLocaleString(loc, { maximumFractionDigits: dp }), [loc]);
  const dateLong = useCallback(
    (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
    [loc],
  );
  const statusLabel = useMemo(() => (s: string) => (s in STATUS_TONE ? t(`status.${s}` as "status.signed") : s), [t]);
  const [year, setYear] = useState<number | null>(null);
  const [busy, setBusy] = useState<"run" | "upload" | "pdf" | number | null>(null);
  const [note, setNote] = useState<{ tone: "good" | "warn"; text: string; details?: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cbam = useWorkspaceResource<Data>(`${CBAM}${year ? `?year=${year}` : ""}`);
  const data = cbam.data ?? null;
  const error = cbam.error;
  const shownYear = year ?? data?.year ?? null;
  const changed = useCallback(() => invalidateWorkspace([CBAM, "/api/console/agents"]), []);

  const runAgent = useCallback(async () => {
    setBusy("run");
    setNote(null);
    try {
      const b = await workspaceRequest<{ status?: string; summary?: string }>("/api/console/agents/run", { method: "POST", body: { agentKey: "cbam" } });
      setNote({ tone: b.status !== "skipped" ? "good" : "warn", text: b.summary ?? t("runFinished") });
      changed();
    } catch (e) {
      setNote({ tone: "warn", text: e instanceof Error ? e.message : t("noServer") });
    } finally {
      setBusy(null);
    }
  }, [changed, t]);

  const upload = useCallback(
    async (file: File) => {
      setBusy("upload");
      setNote(null);
      try {
        if (file.size > 1_000_000) throw new Error(t("tooBig"));
        const csv = await file.text();
        // A file where no row could be read still answers, with each row's problem listed.
        const b = await workspaceRequest<{ inserted?: number; duplicates?: number; errors?: string[] }>(CBAM, { method: "POST", body: { csv } });
        const errs: string[] = b.errors ?? [];
        setNote({
          tone: errs.length || !b.inserted ? "warn" : "good",
          text: [t("added", { inserted: b.inserted ?? 0 }), b.duplicates ? t("addedDup", { count: b.duplicates }) : "", errs.length ? t("addedSkipped", { count: errs.length }) : "", t("runToUpdate")].filter(Boolean).join(" "),
          details: errs.slice(0, 12),
        });
        changed();
      } catch (e) {
        setNote({ tone: "warn", text: e instanceof Error ? e.message : t("uploadFailed") });
      } finally {
        setBusy(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [changed, t],
  );

  const removeLine = useCallback(
    async (id: number) => {
      setBusy(id);
      try {
        await workspaceRequest(`${CBAM}?id=${id}`, { method: "DELETE" });
        changed();
      } catch (e) {
        setNote({ tone: "warn", text: e instanceof Error ? e.message : t("removeFailed") });
      } finally {
        setBusy(null);
      }
    },
    [changed, t],
  );

  const downloadTemplate = useCallback(() => {
    const blob = new Blob(["\uFEFF" + TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vuneli-cbam-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, []);

  const decl = data?.declaration ?? null;
  const draft = decl?.draft ?? null;
  const basisById = new Map((draft?.lines ?? []).map((l) => [l.id, l]));
  const stale = Boolean(draft && data && draft.totals.lines !== data.lines.length);
  const nowYear = new Date().getUTCFullYear();

  const columns: Column<Line>[] = [
    { key: "date", header: t("col.date"), render: (l) => l.importDate },
    { key: "cn", header: t("col.cn"), render: (l) => <>{l.cnCode}{l.description ? <><br /><span className="vck-quiet">{l.description}</span></> : null}</> },
    { key: "supplier", header: t("col.supplier"), render: (l) => <>{l.supplierName} · {l.originCountry}{l.installationId ? <><br /><span className="vck-quiet">{l.installationId}</span></> : null}</> },
    { key: "mass", header: t("col.mass"), numeric: true, render: (l) => `${n(l.netMass, 3)} ${basisById.get(l.id)?.unit ?? "t"}` },
    { key: "emb", header: t("col.embedded"), numeric: true, render: (l) => (basisById.has(l.id) ? n(basisById.get(l.id)!.embeddedT, 3) : t("runAgentCell")) },
    { key: "src", header: t("col.source"), render: (l) => { const s = basisById.get(l.id)?.defaultSource; return s ? <>{t(`source.${s.table}`, { name: s.tableName })}<br /><span className="vck-quiet">{n(s.total, 3)} tCO₂e/t</span></> : "—"; } },
    { key: "cost", header: t("col.cost"), numeric: true, render: (l) => { const b = basisById.get(l.id); return b && b.certificates != null && b.costEur != null ? <>{n(b.certificates, 2)}<br /><span className="vck-quiet">€{n(b.costEur, 0)}{b.priceProvisional ? "*" : ""}</span></> : "—"; } },
    { key: "basis", header: t("col.basis"), render: (l) => { const b = basisById.get(l.id); return b ? <State tone={BASIS_TONE[b.basis]}>{t(`basis.${b.basis}`)}</State> : <State tone="idle">{t("notDrafted")}</State>; } },
    { key: "x", header: "", render: (l) => <Btn variant="text" disabled={busy !== null} onClick={() => removeLine(l.id)} aria-label={t("removeLine", { id: l.id })}>{busy === l.id ? t("removing") : t("remove")}</Btn> },
  ];

  const downloadPdf = async () => {
    if (!decl || !data) return;
    setBusy("pdf");
    try {
      const { downloadCbamPdf } = await import("@/lib/pdf/cbam");
      await downloadCbamPdf(
        {
          year: data.year,
          company: data.declarant.legalName ?? "Workspace",
          declarant: data.declarant,
          status: decl.status,
          draftHash: decl.draftHash,
          signedBy: decl.signedBy,
          signedAt: decl.signedAt,
          draft: decl.draft as unknown as import("@/lib/agents/cbam-calc").CbamDraft,
        },
        `cbam-declaration-${data.year}.pdf`,
      );
    } finally {
      setBusy(null);
    }
  };

  const signatureText = !decl
    ? null
    : decl.status === "signed"
      ? t("sig.signed", { name: decl.signedBy ?? "—", when: decl.signedAt ? new Date(decl.signedAt).toLocaleString(loc) : "—" })
      : decl.status === "awaiting_signature"
        ? data!.year < nowYear
          ? t("sig.askPast", { year: data!.year })
          : t("sig.running", { year: data!.year })
        : decl.status === "below_threshold"
          ? t("sig.below")
          : t("sig.fix");

  return (
    <ConsolePage
      title={t("title")}
      purpose={t("purpose")}
      loading={!data && !error}
      error={error}
      onRetry={cbam.reload}
      actions={
        <div className="vck-cbam-actions">
          {data && data.years.length > 1 && (
            <select className="vck-cbam-year" aria-label={t("year")} value={shownYear ?? ""} onChange={(e) => setYear(Number(e.target.value))}>
              {data.years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          <label className="vck-btn vck-btn-quiet">
            {busy === "upload" ? t("uploading") : t("upload")}
            <input ref={fileRef} type="file" accept=".csv,text/csv" disabled={busy !== null} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
          {decl && data && (
            <Btn variant="quiet" disabled={busy !== null} onClick={downloadPdf}>{busy === "pdf" ? t("pdfBusy") : t("pdf")}</Btn>
          )}
          <Btn variant="primary" onClick={runAgent} disabled={busy !== null}>{busy === "run" ? t("running") : t("run")}</Btn>
        </div>
      }
    >
      {note && (
        <Plate tight>
          <p className="vck-cbam-note" role="status" data-tone={note.tone}>{note.text}</p>
          {note.details && note.details.length > 0 && <ul className="vck-list">{note.details.map((d) => <li key={d}>{d}</li>)}</ul>}
        </Plate>
      )}

      {data && data.lines.length === 0 && !decl ? (
        <Empty
          title={t("emptyTitle")}
          body={t("emptyBody")}
          action={{ label: t("downloadTemplate"), onClick: downloadTemplate }}
        />
      ) : (
        data && (
          <>
            {draft ? (
              <ReadingRail>
                <Reading label={t("r.embedded", { year: data.year })} value={n(draft.totals.embeddedT, 1)} unit="tCO₂e" note={t("r.split", { direct: n(draft.totals.directT, 1), indirect: n(draft.totals.indirectT, 1) })} />
                <Reading label={t("r.mass")} value={n(draft.totals.massTonnesCounted, 1)} unit="t" tone={draft.totals.massTonnesCounted >= 50 ? "warn" : "flat"} delta={draft.totals.massTonnesCounted >= 50 ? t("r.above") : t("r.under")} note={t("r.massNote")} />
                <Reading label={t("r.defaults")} value={n(draft.totals.defaultShare * 100, 0)} unit="%" tone={draft.totals.defaultShare > 0 ? "warn" : "good"} note={t("r.defaultsNote")} />
                {draft.totals.costEur !== undefined && (
                  <Reading
                    label={t("r.cost")}
                    value={`€${n(draft.totals.costEur, 0)}`}
                    tone={draft.totals.costMissingLines ? "warn" : "flat"}
                    delta={draft.totals.costMissingLines ? t("r.costMissing", { count: draft.totals.costMissingLines }) : undefined}
                    note={t(draft.totals.costProvisional ? "r.costProvisional" : "r.costNote", { certs: n(draft.totals.certificates ?? 0, 1) })}
                  />
                )}
                <Reading label={t("r.due")} value={dateLong(draft.dueDate)} note={statusLabel(decl!.status)} />
              </ReadingRail>
            ) : (
              <Empty title={t("noDraftTitle")} body={t("noDraftBody")} />
            )}

            {/* 50-Tonne De-Minimis Threshold Tracker (S-04) */}
            {draft && (
              <Plate
                label={t("threshold.title", { default: "50-Tonne Annual De-Minimis Threshold (Reg. EU 2025/2083)" })}
                meta={`${n(draft.totals.massTonnesCounted, 1)} / 50.0 t`}
                metaTone={draft.totals.massTonnesCounted >= 50 ? "bad" : draft.totals.massTonnesCounted >= 35 ? "warn" : "good"}
                tight
              >
                <div style={{ margin: "0.5rem 0 1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                    <span className="vck-quiet">
                      {draft.totals.massTonnesCounted >= 50
                        ? t("threshold.exceeded", { default: "Exceeded: In scope for full annual CBAM declaration & certificates." })
                        : draft.totals.massTonnesCounted >= 45
                        ? t("threshold.alert90", { default: "Critical Alert: 90%+ of de-minimis quota utilized." })
                        : draft.totals.massTonnesCounted >= 35
                        ? t("threshold.alert70", { default: "Warning: 70%+ of de-minimis quota utilized." })
                        : t("threshold.exempt", { default: "Exempt: Net imports under 50 tonnes/year have zero CBAM purchase obligations." })}
                    </span>
                    <strong className="vck-num">{Math.min(100, Math.round((draft.totals.massTonnesCounted / 50) * 100))}%</strong>
                  </div>
                  <div style={{ height: "8px", width: "100%", backgroundColor: "var(--vck-line, #e5e7eb)", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, (draft.totals.massTonnesCounted / 50) * 100)}%`,
                        backgroundColor:
                          draft.totals.massTonnesCounted >= 50
                            ? "#ef4444"
                            : draft.totals.massTonnesCounted >= 35
                            ? "#f59e0b"
                            : "#10b981",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
                <p className="vck-cbam-note" style={{ fontSize: "0.75rem", color: "var(--vck-text-quiet, #6b7280)", margin: 0 }}>
                  {t("threshold.rules", {
                    default:
                      "Under Regulation (EU) 2025/2083, importers below 50 tonnes net mass per calendar year (electricity and hydrogen excluded) are exempt from purchasing CBAM certificates. Crossing 50 tonnes brings the full year's cumulative volume into mandatory surrender.",
                  })}
                </p>
              </Plate>
            )}

            {decl && (
              <PlateGrid columns={2}>
                <Plate
                  label={t("signature")}
                  meta={<State tone={STATUS_TONE[decl.status] ?? "idle"}>{statusLabel(decl.status)}</State>}
                  foot={
                    <span className="vck-cbam-hash">
                      {t("fingerprint", { hash: decl.draftHash })}{" "}
                      <Link
                        href={`/verify/${encodeURIComponent(decl.draftHash)}`}
                        className="vck-link"
                        style={{ marginLeft: "0.5rem" }}
                      >
                        {t("verifyLink")} &rarr;
                      </Link>
                    </span>
                  }
                >
                  <p className="vck-cbam-note">{signatureText}</p>
                  {stale && <p className="vck-cbam-note" data-tone="warn">{t("stale")}</p>}
                </Plate>
                <Plate label={t("needs")} meta={draft?.issues.length ? String(draft.issues.length) : t("nothing")} metaTone={draft?.issues.length ? "warn" : "good"}>
                  {draft && draft.issues.length ? (
                    <>
                      <ul className="vck-list">{draft.issues.map((i) => <li key={i.message}>{i.message}</li>)}</ul>
                      {loc !== "en-GB" && <p className="vck-cbam-note vck-quiet">{t("issuesNote")}</p>}
                    </>
                  ) : (
                    <p className="vck-cbam-note">{t("allGood")}</p>
                  )}
                </Plate>
              </PlateGrid>
            )}

            <PendingEmailsPlate emails={data.pendingEmails} onDecided={(text, tone) => { setNote({ tone, text }); changed(); }} />

            <SupplierContactsPlate
              supplierNames={[...new Set(data.lines.map((l) => l.supplierName))].sort((a, b) => a.localeCompare(b))}
              needing={new Set((draft?.issues ?? []).filter((i) => (i.kind === "default_values" || i.kind === "no_installation") && i.supplierName).map((i) => i.supplierName!))}
              waiting={new Set(data.pendingEmails.map((e) => e.supplierName))}
              contacts={data.suppliers}
              requests={data.requests}
              onSaved={changed}
            />

            <RegistryPlate key={`${data.year}|${JSON.stringify(data.declarant)}`} year={data.year} declarant={data.declarant} gaps={data.exportGaps} hasDraft={Boolean(decl)} onSaved={changed} />

            {draft && draft.bySupplier.length > 0 && (
              <Plate label={t("bySupplier")} flush>
                <div className="vck-cbam-table">
                <ConsoleTable
                  rows={draft.bySupplier}
                  rowKey={(r) => r.supplierName}
                  columns={[
                    { key: "s", header: t("col.supplier"), render: (r) => r.supplierName },
                    { key: "l", header: t("col.lines"), numeric: true, render: (r) => r.lines },
                    { key: "d", header: t("col.onDefaults"), numeric: true, render: (r) => r.defaultLines },
                    { key: "e", header: t("col.embedded"), numeric: true, render: (r) => n(r.embeddedT, 2) },
                  ]}
                />
                </div>
              </Plate>
            )}

            <Plate label={t("importLines", { year: data.year })} meta={String(data.lines.length)} action={<Btn variant="text" onClick={downloadTemplate}>{t("template")}</Btn>} flush
              foot={<>{t("linesFoot")} {t("officialNote")}</>}>
              <div className="vck-cbam-table vck-cbam-table-wide">
                <ConsoleTable rows={data.lines} rowKey={(l) => String(l.id)} columns={columns} empty={t("noLines")} />
              </div>
            </Plate>
          </>
        )
      )}
    </ConsolePage>
  );
}
