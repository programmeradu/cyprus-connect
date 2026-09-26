"use client";

/**
 * CBAM declaration. Import lines come from the user's customs CSV; every
 * figure below is the Border agent's stored draft. Nothing is invented here.
 */

import { useCallback, useEffect, useRef, useState } from "react";
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
  basis: "actual" | "default" | "mixed" | "unknown_cn";
  embeddedT: number;
  unit: string;
  sector: string | null;
}
interface Draft {
  dueDate: string;
  totals: { lines: number; massTonnesCounted: number; electricityMWh: number; directT: number; indirectT: number; embeddedT: number; defaultShare: number };
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

const STATUS: Record<string, { tone: "good" | "warn" | "bad" | "idle" | "live"; label: string }> = {
  signed: { tone: "good", label: "Signed" },
  awaiting_signature: { tone: "live", label: "Ready" },
  below_threshold: { tone: "idle", label: "Below 50 t threshold" },
  needs_data: { tone: "bad", label: "Needs data fixes" },
};

const BASIS: Record<DraftLine["basis"], { tone: "good" | "warn" | "bad"; label: string }> = {
  actual: { tone: "good", label: "Supplier actual" },
  mixed: { tone: "warn", label: "Part default" },
  default: { tone: "warn", label: "Default value" },
  unknown_cn: { tone: "bad", label: "Not a CBAM code" },
};

const n = (v: number, dp = 2) => v.toLocaleString("en-GB", { maximumFractionDigits: dp });
const dateLong = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const CBAM = "/api/console/cbam";

export default function CbamPage() {
  const [year, setYear] = useState<number | null>(null);
  const [busy, setBusy] = useState<"run" | "upload" | number | null>(null);
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
      setNote({ tone: b.status !== "skipped" ? "good" : "warn", text: b.summary ?? "Run finished." });
      changed();
    } catch (e) {
      setNote({ tone: "warn", text: e instanceof Error ? e.message : "Could not reach the server. Try again." });
    } finally {
      setBusy(null);
    }
  }, [changed]);

  const upload = useCallback(
    async (file: File) => {
      setBusy("upload");
      setNote(null);
      try {
        if (file.size > 1_000_000) throw new Error("The file is over 1 MB. Split it and upload the parts.");
        const csv = await file.text();
        let b: { inserted?: number; duplicates?: number; errors?: string[] };
        try {
          b = await workspaceRequest(CBAM, { method: "POST", body: { csv } });
        } catch (e) {
          // A file where every row is wrong comes back refused, with the row errors listed.
          throw e;
        }
        const errs: string[] = b.errors ?? [];
        setNote({
          tone: errs.length || !b.inserted ? "warn" : "good",
          text: `Added ${b.inserted ?? 0} line(s)${b.duplicates ? `, ${b.duplicates} already there` : ""}${errs.length ? `, ${errs.length} row(s) skipped` : ""}. Run the agent to update the draft.`,
          details: errs.slice(0, 12),
        });
        changed();
      } catch (e) {
        setNote({ tone: "warn", text: e instanceof Error ? e.message : "Upload failed." });
      } finally {
        setBusy(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [changed],
  );

  const removeLine = useCallback(
    async (id: number) => {
      setBusy(id);
      try {
        await workspaceRequest(`${CBAM}?id=${id}`, { method: "DELETE" });
        changed();
      } catch (e) {
        setNote({ tone: "warn", text: e instanceof Error ? e.message : "Could not remove that line." });
      } finally {
        setBusy(null);
      }
    },
    [changed],
  );

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob(["\uFEFF" + TEMPLATE], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "vuneli-cbam-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const decl = data?.declaration ?? null;
  const draft = decl?.draft ?? null;
  const basisById = new Map((draft?.lines ?? []).map((l) => [l.id, l]));
  const stale = Boolean(draft && data && draft.totals.lines !== data.lines.length);
  const nowYear = new Date().getUTCFullYear();

  const columns: Column<Line>[] = [
    { key: "date", header: "Date", render: (l) => l.importDate },
    { key: "cn", header: "CN code", render: (l) => <>{l.cnCode}{l.description ? <><br /><span className="vck-quiet">{l.description}</span></> : null}</> },
    { key: "supplier", header: "Supplier", render: (l) => <>{l.supplierName} · {l.originCountry}{l.installationId ? <><br /><span className="vck-quiet">{l.installationId}</span></> : null}</> },
    { key: "mass", header: "Mass", numeric: true, render: (l) => `${n(l.netMass, 3)} ${basisById.get(l.id)?.unit ?? "t"}` },
    { key: "emb", header: "Embedded tCO₂e", numeric: true, render: (l) => (basisById.has(l.id) ? n(basisById.get(l.id)!.embeddedT, 3) : "Run agent") },
    { key: "basis", header: "Basis", render: (l) => { const b = basisById.get(l.id); return b ? <State tone={BASIS[b.basis].tone}>{BASIS[b.basis].label}</State> : <State tone="idle">Not drafted yet</State>; } },
    { key: "x", header: "", render: (l) => <Btn variant="text" disabled={busy !== null} onClick={() => removeLine(l.id)} aria-label={`Remove line ${l.id}`}>{busy === l.id ? "Removing…" : "Remove"}</Btn> },
  ];

  const signatureText = !decl
    ? null
    : decl.status === "signed"
      ? `Signed by ${decl.signedBy} on ${decl.signedAt ? new Date(decl.signedAt).toLocaleString("en-GB") : "—"}. Submission to the EU CBAM Registry is still done by you, in your own declarant account.`
      : decl.status === "awaiting_signature"
        ? data!.year < nowYear
          ? "The agent has asked for your signature. Approve “Sign the " + data!.year + " CBAM declaration” in your review queue; it signs this exact version only."
          : `This is a running tally. The agent asks for your signature after 31 December ${data!.year}.`
        : decl.status === "below_threshold"
          ? "Your imports are under 50 tonnes this year, so no declaration is needed unless that changes."
          : "Fix the flagged lines first. The agent will not ask for a signature while lines are invalid.";

  return (
    <ConsolePage
      title="CBAM declaration"
      purpose="Border turns your customs import lines into the annual CBAM declaration, chases missing supplier data, and asks you to sign."
      loading={!data && !error}
      error={error}
      onRetry={cbam.reload}
      actions={
        <div className="vck-cbam-actions">
          {data && data.years.length > 1 && (
            <select className="vck-cbam-year" aria-label="Year" value={shownYear ?? ""} onChange={(e) => setYear(Number(e.target.value))}>
              {data.years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          <label className="vck-btn vck-btn-quiet">
            {busy === "upload" ? "Uploading…" : "Upload import CSV"}
            <input ref={fileRef} type="file" accept=".csv,text/csv" disabled={busy !== null} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
          <Btn variant="primary" onClick={runAgent} disabled={busy !== null}>{busy === "run" ? "Running…" : "Run CBAM agent"}</Btn>
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
          title="No CBAM imports yet"
          body="Upload your customs import lines for iron and steel, aluminium, cement, fertilisers, hydrogen or electricity. Border builds the declaration from them. Add supplier actual values where you have them; empty cells use indicative defaults and get flagged."
          action={{ label: "Download the CSV template", onClick: downloadTemplate }}
        />
      ) : (
        data && (
          <>
            {draft ? (
              <ReadingRail>
                <Reading label={`Embedded emissions ${data.year}`} value={n(draft.totals.embeddedT, 1)} unit="tCO₂e" note={`${n(draft.totals.directT, 1)} direct · ${n(draft.totals.indirectT, 1)} indirect`} />
                <Reading label="Mass counted" value={n(draft.totals.massTonnesCounted, 1)} unit="t" tone={draft.totals.massTonnesCounted >= 50 ? "warn" : "flat"} delta={draft.totals.massTonnesCounted >= 50 ? "Above 50 t" : "Under 50 t"} note="threshold, excl. electricity & hydrogen" />
                <Reading label="On default values" value={n(draft.totals.defaultShare * 100, 0)} unit="%" tone={draft.totals.defaultShare > 0 ? "warn" : "good"} note="of embedded emissions" />
                <Reading label="Declaration due" value={dateLong(draft.dueDate)} note={STATUS[decl!.status]?.label ?? decl!.status} />
              </ReadingRail>
            ) : (
              <Empty title="No draft yet" body="Run the CBAM agent to build the declaration from these lines." />
            )}

            {decl && (
              <PlateGrid columns={2}>
                <Plate label="Signature" meta={<State tone={STATUS[decl.status]?.tone ?? "idle"}>{STATUS[decl.status]?.label ?? decl.status}</State>}
                  foot={<span className="vck-cbam-hash">Draft fingerprint {decl.draftHash}</span>}>
                  <p className="vck-cbam-note">{signatureText}</p>
                  {stale && <p className="vck-cbam-note" data-tone="warn">Lines changed since the last run. Run the agent to refresh the draft.</p>}
                </Plate>
                <Plate label="What Border needs" meta={draft?.issues.length ? String(draft.issues.length) : "Nothing"} metaTone={draft?.issues.length ? "warn" : "good"}>
                  {draft && draft.issues.length ? (
                    <ul className="vck-list">{draft.issues.map((i) => <li key={i.message}>{i.message}</li>)}</ul>
                  ) : (
                    <p className="vck-cbam-note">Every line has supplier actual values and a valid CN code.</p>
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
              <Plate label="By supplier" flush>
                <div className="vck-cbam-table">
                <ConsoleTable
                  rows={draft.bySupplier}
                  rowKey={(r) => r.supplierName}
                  columns={[
                    { key: "s", header: "Supplier", render: (r) => r.supplierName },
                    { key: "l", header: "Lines", numeric: true, render: (r) => r.lines },
                    { key: "d", header: "On defaults", numeric: true, render: (r) => r.defaultLines },
                    { key: "e", header: "Embedded tCO₂e", numeric: true, render: (r) => n(r.embeddedT, 2) },
                  ]}
                />
                </div>
              </Plate>
            )}

            <Plate label={`Import lines ${data.year}`} meta={String(data.lines.length)} action={<Btn variant="text" onClick={downloadTemplate}>CSV template</Btn>} flush
              foot="Default values are indicative, not the Commission's definitive table. Replace them with supplier actual data before you sign.">
              <div className="vck-cbam-table vck-cbam-table-wide">
                <ConsoleTable rows={data.lines} rowKey={(l) => String(l.id)} columns={columns} empty="No lines for this year." />
              </div>
            </Plate>
          </>
        )
      )}
    </ConsolePage>
  );
}
