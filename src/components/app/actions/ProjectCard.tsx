"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { workspaceRequest, WorkspaceRequestError, invalidateWorkspace } from "@/components/app/console/workspace-store";
import { CATALOG, type InputKey, type ProjectInputs, type Stage } from "@/lib/actions/catalog";
import type { PlanProject } from "@/lib/actions/projects.server";

const PATH = "/api/console/actions";
const MONEY_KEYS: InputKey[] = ["quoteEur", "grantEur", "savedEurYr"];

export function useFormat() {
  const locale = useLocale() === "el" ? "el-CY" : "en-GB";
  const eur = (v: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
  const num = (v: number, d = 0) => new Intl.NumberFormat(locale, { maximumFractionDigits: d }).format(v);
  const date = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  return { eur, num, date, locale };
}

function Fig({ label, value, missing }: { label: string; value: string | null; missing: string }) {
  return (
    <div className="min-w-0">
      <dt className="vck-meta">{label}</dt>
      <dd className={`mt-0.5 break-words ${value ? "vck-num text-[0.9375rem] font-semibold" : "text-sm text-muted-foreground"}`}>
        {value ? (
          value
        ) : (
          <>
            <span className="hidden sm:inline">{missing}</span>
            <span className="sm:hidden text-muted-foreground/60 select-none" aria-hidden="true">—</span>
            <span className="sr-only sm:hidden">{missing}</span>
          </>
        )}
      </dd>
    </div>
  );
}

export function ProjectCard({ p, onChanged }: { p: PlanProject; onChanged: (next?: Stage) => void }) {
  const t = useTranslations("dashboard.projects");
  const { eur, num, date } = useFormat();
  const def = CATALOG[p.type];
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(def.inputs.map((k) => [k, p.inputs[k] == null ? "" : String(p.inputs[k])])),
  );
  const [installedOn, setInstalledOn] = useState(new Date().toISOString().slice(0, 10));
  const [showInstall, setShowInstall] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const f = p.figures;
  const locked = p.stage === "confirmed";
  const today = new Date().toISOString().slice(0, 10);

  async function call(key: string, body: unknown, ok?: string, next?: Stage) {
    setBusy(key);
    try {
      await workspaceRequest(PATH, { method: "POST", body });
      if (ok) toast.success(ok);
      invalidateWorkspace([PATH, "/api/console/overview"]);
      onChanged(next);
      return true;
    } catch (e) {
      toast.error(e instanceof WorkspaceRequestError ? e.message : t("errors.generic"));
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function saveInputs() {
    const inputs: ProjectInputs = {};
    for (const k of def.inputs) {
      const raw = (form[k] ?? "").trim();
      if (k === "supplierName") inputs.supplierName = raw || null;
      else {
        const n = raw === "" ? null : Number(raw.replace(",", "."));
        if (n !== null && (!Number.isFinite(n) || n < 0)) {
          toast.error(`${t(`inputs.${k}` as never)}: ${t("errors.generic")}`);
          return;
        }
        (inputs as Record<string, number | null>)[k] = n;
      }
    }
    await call("save", { op: "update", id: p.id, inputs }, t("inputs.saved"));
  }

  async function upload(file: File) {
    if (!p.inputs.supplierName) {
      toast.error(t("proof.needSupplier"));
      return;
    }
    setBusy("upload");
    const fd = new FormData();
    fd.set("file", file);
    fd.set("projectId", String(p.id));
    try {
      const r = await workspaceRequest<{ ok: boolean; missing?: string[] }>(`${PATH}/proof`, { method: "POST", body: fd });
      if (!r.ok) {
        const list = (r.missing ?? []).map((m) => t(`proof.missing.${m}` as never)).join(", ");
        toast.error(t("proof.refused", { list }), { duration: 9000 });
        return;
      }
      toast.success(t("proof.accepted"));
      invalidateWorkspace([PATH]);
      const nextStage: Stage =
        p.stage === "being_checked"
          ? p.checks.filter((c) => c.kind !== "purchase").every((c) => c.status === "passed")
            ? "confirmed"
            : "being_checked"
          : p.stage;
      onChanged(nextStage);
    } catch (e) {
      toast.error(e instanceof WorkspaceRequestError ? e.message : t("errors.generic"));
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const unit = f.savedUnit === "kWh" ? "kWh" : f.savedUnit === "m3" ? "m³" : f.savedUnit === "litres" ? "L" : "";
  const triggerText = t(`trigger.${p.trigger.key}` as never, Object.fromEntries(Object.entries(p.trigger.values).map(([k, v]) => [k, num(v)])) as never);
  const hasMissing = f.costEur === null || f.netCostEur === null || f.savedEurYr === null || f.co2KgYr === null || f.paybackYrs === null;

  return (
    <article className="vck-card flex flex-col gap-5 p-5" aria-labelledby={`proj-${p.type}`}>
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h3 id={`proj-${p.type}`} className="text-base font-semibold leading-snug break-words">{t(`types.${p.type}.title`)}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground break-words">{t(`types.${p.type}.body`)}</p>
          <p className="vck-meta mt-1.5 break-words">{triggerText}</p>
          {p.type === "solar" && f.suggestedKwp && !p.inputs.kwp && <p className="vck-meta mt-1 break-words">{t("suggestedKwp", { kwp: num(f.suggestedKwp, 1) })}</p>}
        </div>
        <span className="vck-tag shrink-0 self-start" data-tone={p.stage === "confirmed" ? "positive" : p.stage === "being_checked" ? "caution" : undefined}>
          {t(`stage.${p.stage}`)}
        </span>
      </header>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-[var(--vc-rule)] py-4 sm:grid-cols-3 lg:grid-cols-5">
        <Fig label={t("fig.cost")} value={f.costEur !== null ? eur(f.costEur) : null} missing={t("fig.missing")} />
        <Fig label={t("fig.net")} value={f.netCostEur !== null ? eur(f.netCostEur) : null} missing={t("fig.missing")} />
        <Fig label={t("fig.saved")} value={f.savedEurYr !== null ? eur(f.savedEurYr) : f.savedQtyYr !== null ? `${num(f.savedQtyYr)} ${unit}` : null} missing={t("fig.missing")} />
        <Fig label={t("fig.co2")} value={f.co2KgYr !== null ? `${num(f.co2KgYr / 1000, 1)} t` : null} missing={t("fig.missing")} />
        <Fig label={t("fig.payback")} value={f.paybackYrs !== null ? `${num(f.paybackYrs, 1)} ${t("summary.years")}` : null} missing={t("fig.missing")} />
      </dl>
      {hasMissing && (
        <p className="vck-meta -mt-2 text-xs sm:hidden">{t("fig.missing")}</p>
      )}

      <details className="group">
        <summary className="vck-meta cursor-pointer select-none font-medium text-foreground">{t("basis.title")}</summary>
        {f.basis.length === 0 ? (
          <p className="vck-meta mt-2">{t("basis.empty")}</p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--vc-rule)] text-sm">
            {f.basis.map((b) => (
              <li key={b.label} className="grid gap-1 py-2 sm:grid-cols-[1fr_auto] sm:gap-4">
                <span className="min-w-0 break-words">{b.label} <span className="vck-meta block">{b.source}</span></span>
                <span className="vck-num break-words sm:text-right">{b.value}</span>
              </li>
            ))}
          </ul>
        )}
      </details>

      {p.funding.length > 0 && (
        <section aria-label={t("funding.title")}>
          <p className="vck-meta font-medium">{t("funding.title")}</p>
          <ul className="mt-1.5 space-y-1.5">
            {p.funding.map((c) => (
              <li key={c.id} className="text-sm">
                <a href={c.url} target="_blank" rel="noreferrer" className="break-words font-medium hover:underline">{c.title}</a>
                <span className="vck-meta block">
                  {t(`funding.${c.verdict === "strong" ? "strong" : "needs_info"}`)}
                  {c.deadline ? ` · ${t("funding.closes", { date: date(c.deadline) })}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.id === null ? (
        <div className="flex justify-end">
          <button type="button" className="vck-btn vck-btn-primary" disabled={busy !== null} onClick={() => call("start", { op: "start", type: p.type }, t("do.started"), "under_way")}>
            {t("do.start")}
          </button>
        </div>
      ) : (
        <>
          <section aria-label={t("inputs.title")}>
            <p className="vck-meta font-medium">{t("inputs.title")}</p>
            <p className="vck-meta">{locked ? t("inputs.locked") : t("inputs.hint")}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {def.inputs.map((k) => (
                <label key={k} className="flex min-w-0 flex-col gap-1.5 text-sm">
                  <span className="break-words">{t(`inputs.${k}` as never)}</span>
                  <input
                    className="vck-input w-full min-w-0 rounded-md border border-[var(--vc-rule)] bg-transparent px-3 py-2 text-sm"
                    value={form[k] ?? ""}
                    disabled={locked}
                    inputMode={k === "supplierName" ? "text" : "decimal"}
                    autoComplete={k === "supplierName" ? "organization" : "off"}
                    placeholder={k === "kwp" && f.suggestedKwp ? String(f.suggestedKwp) : MONEY_KEYS.includes(k) ? "0" : ""}
                    onChange={(e) => setForm((s) => ({ ...s, [k]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
            {!locked && (
              <div className="mt-3 flex justify-end">
                <button type="button" className="vck-btn" disabled={busy !== null} onClick={saveInputs}>{t("inputs.save")}</button>
              </div>
            )}
          </section>

          <section aria-label={t("proof.title")}>
            <p className="vck-meta font-medium">{t("proof.title")}</p>
            <ol className="mt-2 divide-y divide-[var(--vc-rule)] rounded-md border border-[var(--vc-rule)]">
              {def.checks.map((kind) => {
                const c = p.checks.find((x) => x.kind === kind);
                const status = c?.status ?? "waiting";
                const inv = p.evidence.find((e) => e.kind === "invoice");
                const reason = c
                  ? t(`proof.reason.${c.reason}` as never, { ...(c.numbers ?? {}), supplier: inv?.quotes.supplier ?? "", date: inv?.quotes.date ?? "" } as never)
                  : t("proof.reason.not_installed");
                return (
                  <li key={kind} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium break-words">{t(`proof.${kind}`)}</p>
                      <p className="vck-meta mt-0.5 break-words">{reason}</p>
                      {kind === "purchase" && status === "confirm" && p.payments.length > 0 && (
                        <ul className="mt-2 space-y-2">
                          {p.payments.map((pay) => (
                            <li key={pay.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <span className="vck-meta min-w-0 break-words">{date(pay.bookedOn)} · <span className="vck-num">{eur(pay.amount)}</span> · {pay.description}</span>
                              <button type="button" className="vck-btn shrink-0" disabled={busy !== null} onClick={() => call(`pay-${pay.id}`, { op: "confirm_payment", id: p.id, transactionId: pay.id }, t("proof.linked"))}>
                                {t("proof.linkPayment")}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {kind === "purchase" && status !== "passed" && !locked && (
                        <div className="mt-2">
                          <input ref={fileRef} type="file" accept="application/pdf" className="sr-only" id={`proof-${p.type}`} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                          <label htmlFor={`proof-${p.type}`} className={`vck-btn inline-flex cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`} aria-disabled={busy !== null}>
                            {busy === "upload" ? t("proof.uploading") : t("proof.upload")}
                          </label>
                        </div>
                      )}
                    </div>
                    <span className="vck-tag shrink-0 self-start" data-tone={status === "passed" ? "positive" : status === "failed" || status === "needed" || status === "confirm" ? "caution" : undefined}>
                      {t(`proof.status.${status}`)}
                    </span>
                  </li>
                );
              })}
            </ol>
            {p.evidence.length > 0 && (
              <div className="mt-3">
                <p className="vck-meta font-medium">{t("proof.evidence")}</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {p.evidence.map((e) => (
                    <li key={e.id} className="break-words">
                      {e.fileName ?? e.quotes.supplier} <span className="vck-meta">· {[e.quotes.date, e.quotes.amount, e.quotes.item && `“${e.quotes.item}”`].filter(Boolean).join(" · ")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <footer className="flex flex-col-reverse gap-3 border-t border-[var(--vc-rule)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            {!locked ? (
              <button
                type="button"
                className="vck-btn self-start"
                disabled={busy !== null}
                onClick={() => window.confirm(t("do.dropConfirm")) && call("drop", { op: "drop", id: p.id })}
              >
                {t("do.drop")}
              </button>
            ) : (
              <p className="vck-meta">{p.confirmedAt ? t("do.confirmedOn", { date: date(p.confirmedAt) }) : null}</p>
            )}
            {p.stage === "under_way" &&
              (showInstall ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span>{t("do.installedOn")}</span>
                    <input type="date" className="vck-input rounded-md border border-[var(--vc-rule)] bg-transparent px-3 py-2 text-sm" value={installedOn} max={today} onChange={(e) => setInstalledOn(e.target.value)} />
                  </label>
                  <button type="button" className="vck-btn vck-btn-primary" disabled={busy !== null || !installedOn} onClick={() => call("installed", { op: "installed", id: p.id, installedOn }, t("do.installedDone"), "being_checked")}>
                    {t("do.confirmInstalled")}
                  </button>
                </div>
              ) : (
                <button type="button" className="vck-btn vck-btn-primary" onClick={() => setShowInstall(true)}>{t("do.installed")}</button>
              ))}
          </footer>
        </>
      )}
    </article>
  );
}
