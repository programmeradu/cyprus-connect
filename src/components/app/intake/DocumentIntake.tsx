"use client";

/**
 * "Add data": drop any document, see what it is, check what it says, then add it.
 *
 * Each file gets its own card. The server reads it and either refuses it with
 * a reason or proposes figures, each with the line it came from. Figures read
 * by code, or quoted word for word, start ticked; anything the reader could not
 * prove starts unticked. Nothing is saved until the person presses the button.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { invalidateWorkspace, useWorkspaceResource, workspaceRequest } from "@/components/app/console/workspace-store";
import { FOOTPRINT_KEYS, type FootprintKey } from "@/lib/emissions/footprint";
import type { IntakeProposal, RejectCode, MonthShare } from "@/lib/documents/intake";
import { ACCEPT, takeStashedFiles, type PendingFile } from "./pending-files";

const EMISSIONS = "/api/console/emissions";
const INVALIDATES = [EMISSIONS, "/api/console/insights", "/api/console/overview", "/api/emissions", "/api/dashboard", "/api/analytics", "/api/actions", "/api/studio", "/api/console/integrations"];
const MAX_FILES = 10;

interface RecordedMonth {
  year: number;
  month: number;
  electricity: number;
  gas: number;
  water: number;
  waste: number;
  transport: number;
}

type IntakeAnswer =
  | { id: number; fileName: string; proposal: IntakeProposal }
  | { rejected: { code: RejectCode; detail: string | null }; fileName: string };

interface Item {
  key: string;
  file: File;
  taskId?: number;
}

type Group = "needs" | "reading" | "done" | "rejected";
const GROUPS: Group[] = ["needs", "reading", "done", "rejected"];
function groupOf(phase: Phase["name"]): Group {
  if (phase === "review" || phase === "saving") return "needs";
  if (phase === "reading") return "reading";
  if (phase === "saved" || phase === "discarded") return "done";
  return "rejected";
}

export function DocumentIntake() {
  const t = useTranslations("dashboard.intake");
  const [items, setItems] = useState<Item[]>([]);
  const [phases, setPhases] = useState<Record<string, Phase["name"]>>({});
  const [dragging, setDragging] = useState(false);
  const [pageDrag, setPageDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  const add = useCallback((files: PendingFile[]) => {
    if (files.length === 0) return;
    setItems((cur) => {
      const room = Math.max(0, MAX_FILES - cur.length);
      if (files.length > room) toast.info(t("tooMany", { max: MAX_FILES }));
      return [...files.slice(0, room).map((f) => ({ key: `f${++seq.current}`, file: f.file, taskId: f.taskId })), ...cur];
    });
  }, [t]);

  useEffect(() => {
    add(takeStashedFiles());
  }, [add]);

  // The whole page takes a drop, not just the box.
  useEffect(() => {
    let depth = 0;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth += 1;
      setPageDrag(true);
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setPageDrag(false);
    };
    const over = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setPageDrag(false);
      setDragging(false);
      add(Array.from(e.dataTransfer?.files ?? []).map((file) => ({ file })));
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop);
    };
  }, [add]);

  const report = useCallback((key: string, name: Phase["name"]) => {
    setPhases((cur) => (cur[key] === name ? cur : { ...cur, [key]: name }));
  }, []);
  const remove = (key: string) => setItems((cur) => cur.filter((x) => x.key !== key));

  const counts = useMemo(() => {
    const c: Record<Group, number> = { needs: 0, reading: 0, done: 0, rejected: 0 };
    for (const it of items) c[groupOf(phases[it.key] ?? "reading")] += 1;
    return c;
  }, [items, phases]);
  const finished = counts.done + counts.rejected;
  const compact = items.length > 0;

  return (
    <div className="vck-intake">
      {pageDrag && (
        <div className="vck-intake-overlay" aria-hidden="true">
          <p>{t("overlay")}</p>
        </div>
      )}
      <div
        className="vck-intake-drop"
        data-dragging={dragging || undefined}
        data-compact={compact || undefined}
        onDragOver={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
      >
        <div className="vck-intake-drop-copy">
          <p className="vck-intake-drop-title">{compact ? t("dropCompact") : t("drop.title")}</p>
          <p className="vck-meta">{compact ? t("drop.types") : t("drop.body")}</p>
        </div>
        <button type="button" className="vck-btn vck-btn-primary" onClick={() => input.current?.click()}>
          {compact ? t("chooseMore") : t("drop.choose")}
        </button>
        {!compact && <p className="vck-meta vck-intake-drop-types">{t("drop.types")}</p>}
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          aria-label={t("drop.choose")}
          onChange={(e) => {
            add(Array.from(e.target.files ?? []).map((file) => ({ file })));
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <>
          <div className="vck-intake-summary">
            <p aria-live="polite">
              {GROUPS.filter((g) => counts[g] > 0)
                .map((g) => t(`summary.${g}`, { count: counts[g] }))
                .join(" · ")}
            </p>
            {finished > 0 && (
              <button
                type="button"
                className="vck-btn"
                onClick={() => setItems((cur) => cur.filter((x) => !["done", "rejected"].includes(groupOf(phases[x.key] ?? "reading"))))}
              >
                {t("clearFinished")}
              </button>
            )}
          </div>
          <ul className="vck-intake-list">
            {GROUPS.map((g, gi) =>
              counts[g] > 0 ? (
                <li key={`h-${g}`} className="vck-intake-group" style={{ order: gi * 2 }} aria-hidden="true">
                  {t(`queue.${g}`)} <span>{counts[g]}</span>
                </li>
              ) : null,
            )}
            {items.map((it) => (
              <IntakeCard
                key={it.key}
                item={it}
                order={GROUPS.indexOf(groupOf(phases[it.key] ?? "reading")) * 2 + 1}
                onPhase={(name) => report(it.key, name)}
                onRemove={() => remove(it.key)}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ card */

type Phase =
  | { name: "reading" }
  | { name: "rejected"; code: RejectCode; detail: string | null }
  | { name: "error"; message: string }
  | { name: "review"; id: number; proposal: IntakeProposal }
  | { name: "saving"; id: number; proposal: IntakeProposal }
  | { name: "saved"; months: number; evidenceOnly: boolean; duplicate: boolean }
  | { name: "discarded" };

interface Row {
  id: string;
  key: FootprintKey;
  year: number;
  month: number;
  value: string;
  include: boolean;
  mode: "add" | "replace";
  partial: boolean;
  figureIndexes: number[];
}

function rowsFrom(p: IntakeProposal, existing: (y: number, m: number, k: FootprintKey) => number): Row[] {
  const grouped = new Map<string, { share: MonthShare; value: number; partial: boolean; idx: Set<number> }>();
  for (const s of p.shares) {
    const id = `${s.year}-${s.month}-${s.key}`;
    const g = grouped.get(id) ?? { share: s, value: 0, partial: false, idx: new Set<number>() };
    g.value += s.value;
    g.partial = g.partial || s.days < s.monthDays;
    g.idx.add(s.figureIndex);
    grouped.set(id, g);
  }
  const duplicate = p.warnings.includes("already_uploaded");
  return [...grouped.entries()]
    .map(([id, g]) => {
      const verified = [...g.idx].every((i) => p.figures[i]?.verified);
      const has = existing(g.share.year, g.share.month, g.share.key) > 0;
      return {
        id,
        key: g.share.key,
        year: g.share.year,
        month: g.share.month,
        value: String(Math.round(g.value * 100) / 100),
        include: verified && !duplicate,
        // Part of a month usually sits next to another bill's part, so it is added; a whole month replaces.
        mode: has && g.partial ? "add" : "replace",
        partial: g.partial,
        figureIndexes: [...g.idx],
      } satisfies Row;
    })
    .sort((a, b) => a.year - b.year || a.month - b.month || FOOTPRINT_KEYS.indexOf(a.key) - FOOTPRINT_KEYS.indexOf(b.key));
}

function IntakeCard({ item, onRemove }: { item: Item; onRemove: () => void }) {
  const t = useTranslations("dashboard.intake");
  const tc = useTranslations("dashboard.calculator");
  const locale = useLocale();
  const history = useWorkspaceResource<{ months: RecordedMonth[] }>(EMISSIONS);
  const [phase, setPhase] = useState<Phase>({ name: "reading" });
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const started = useRef(false);

  const loc = locale === "el" ? "el-CY" : "en-GB";
  const number = useMemo(() => new Intl.NumberFormat(loc, { maximumFractionDigits: 2 }), [loc]);
  const money = useMemo(() => new Intl.NumberFormat(loc, { style: "currency", currency: "EUR" }), [loc]);
  const monthFmt = useMemo(() => new Intl.DateTimeFormat(loc, { month: "long", year: "numeric", timeZone: "UTC" }), [loc]);
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }), [loc]);
  const monthLabel = (y: number, m: number) => monthFmt.format(new Date(Date.UTC(y, m - 1, 1)));
  const dateLabel = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00Z`));

  const months = history.data?.months;
  const existing = useCallback(
    (y: number, m: number, k: FootprintKey) => months?.find((r) => r.year === y && r.month === m)?.[k] ?? 0,
    [months],
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const form = new FormData();
    form.append("file", item.file);
    workspaceRequest<IntakeAnswer>("/api/console/documents/intake", { method: "POST", body: form })
      .then((a) => {
        if ("rejected" in a) setPhase({ name: "rejected", code: a.rejected.code, detail: a.rejected.detail });
        else setPhase({ name: "review", id: a.id, proposal: a.proposal });
      })
      .catch((e: unknown) => setPhase({ name: "error", message: e instanceof Error ? e.message : t("errors.generic") }));
  }, [item.file, t]);

  // Rows are built once the reading and the recorded months are both in.
  useEffect(() => {
    if (phase.name === "review" && rows === null && months !== undefined) setRows(rowsFrom(phase.proposal, existing));
  }, [phase, rows, months, existing]);

  const proposal = phase.name === "review" || phase.name === "saving" ? phase.proposal : null;
  const chosen = (rows ?? []).filter((r) => r.include && Number(r.value.replace(",", ".")) > 0);

  const confirm = async () => {
    if (!proposal || (phase.name !== "review")) return;
    setFailure(null);
    setPhase({ name: "saving", id: phase.id, proposal });
    try {
      const byMonth = new Map<string, Row[]>();
      for (const r of chosen) byMonth.set(`${r.year}-${r.month}`, [...(byMonth.get(`${r.year}-${r.month}`) ?? []), r]);
      for (const list of byMonth.values()) {
        const { year, month } = list[0];
        const base = months?.find((m) => m.year === year && m.month === month);
        const body: Record<string, number> = { year, month };
        for (const k of FOOTPRINT_KEYS) body[k] = base?.[k] ?? 0;
        for (const r of list) {
          const v = Number(r.value.replace(",", "."));
          body[r.key] = Math.round((r.mode === "add" ? body[r.key] + v : v) * 100) / 100;
        }
        await workspaceRequest(EMISSIONS, { method: "POST", body });
      }
      const kept = await workspaceRequest<{ duplicate?: boolean }>(`/api/console/documents/intake/${phase.id}`, { method: "POST", body: { decision: "accept" } });
      if (item.taskId) {
        await workspaceRequest(`/api/console/tasks/${item.taskId}`, { method: "POST", body: { decision: "approve" } }).catch(() => undefined);
      }
      invalidateWorkspace([...INVALIDATES, "/api/console/agents"]);
      setPhase({ name: "saved", months: byMonth.size, evidenceOnly: byMonth.size === 0, duplicate: Boolean(kept.duplicate) });
      toast.success(byMonth.size ? t("toasts.added", { count: byMonth.size }) : t("toasts.kept"));
    } catch (e) {
      invalidateWorkspace(INVALIDATES);
      setFailure(e instanceof Error ? e.message : t("errors.generic"));
      setPhase({ name: "review", id: phase.id, proposal });
    }
  };

  const discard = async () => {
    if (phase.name !== "review") return;
    await workspaceRequest(`/api/console/documents/intake/${phase.id}`, { method: "POST", body: { decision: "discard" } }).catch(() => undefined);
    setPhase({ name: "discarded" });
  };

  const status =
    phase.name === "reading" ? t("status.reading")
      : phase.name === "rejected" ? t("status.rejected")
      : phase.name === "error" ? t("status.error")
      : phase.name === "saved" ? t("status.saved")
      : phase.name === "discarded" ? t("status.discarded")
      : t(`kinds.${(proposal as IntakeProposal).kind}`);

  const update = (id: string, patch: Partial<Row>) => setRows((cur) => (cur ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <li className="vck-card vck-intake-card" data-phase={phase.name}>
      <header className="vck-intake-head">
        <div className="min-w-0">
          <p className="vck-intake-file">{item.file.name}</p>
          <p className="vck-meta">
            <span className="vck-tag" data-tone={phase.name === "saved" ? "positive" : phase.name === "rejected" || phase.name === "error" ? "negative" : undefined}>
              {status}
            </span>
            {proposal && (
              <span className="vck-intake-by">
                {proposal.recognisedBy === "code" ? t("by.code") : t("by.ai")}
                {proposal.description ? ` · ${proposal.description}` : ""}
              </span>
            )}
          </p>
        </div>
        {(phase.name === "rejected" || phase.name === "error" || phase.name === "saved" || phase.name === "discarded") && (
          <button type="button" className="vck-btn" onClick={onRemove}>
            {t("actions.clear")}
          </button>
        )}
      </header>

      {phase.name === "reading" && <p className="vck-meta vck-intake-reading">{t("readingBody")}</p>}

      {phase.name === "rejected" && (
        <div className="vck-intake-body">
          <p className="break-words">{t(`reject.${phase.code}`)}</p>
          {phase.detail && <p className="vck-meta break-words">{t("reject.seen", { detail: phase.detail })}</p>}
        </div>
      )}

      {phase.name === "error" && <p className="vck-intake-body break-words" role="alert">{phase.message}</p>}

      {phase.name === "saved" && (
        <div className="vck-intake-body">
          <p className="break-words">
            {phase.duplicate ? t("saved.duplicate") : phase.evidenceOnly ? t("saved.evidence") : t("saved.figures", { count: phase.months })}
          </p>
          <div className="vck-intake-actions">
            <Link href="/app" className="vck-btn">{t("saved.home")}</Link>
            {!phase.evidenceOnly && <Link href="/app/analytics" className="vck-btn">{t("saved.footprint")}</Link>}
          </div>
        </div>
      )}

      {phase.name === "discarded" && <p className="vck-meta vck-intake-body">{t("discardedBody")}</p>}

      {proposal && (
        <div className="vck-intake-body">
          {proposal.warnings.length > 0 && (
            <ul className="vck-intake-warnings">
              {proposal.warnings.map((w) => (
                <li key={w} className="vck-inset break-words">{t(`warnings.${w}`)}</li>
              ))}
            </ul>
          )}

          {proposal.figures.length > 0 && (
            <div className="vck-intake-sources">
              <p className="vck-label">{t("review.readFrom")}</p>
              <ul>
                {proposal.figures.map((f, i) => (
                  <li key={i} className="break-words">
                    <strong>
                      {tc(`fields.${f.key}`)}: {number.format(f.value)} {tc(`units.${f.key}`)}
                    </strong>{" "}
                    <span className="vck-meta">
                      {dateLabel(f.periodStart)} – {dateLabel(f.periodEnd)}
                    </span>
                    {f.quote && <q className="vck-intake-quote">{f.quote}</q>}
                    <span className="vck-meta vck-intake-check">{f.verified ? (f.quote ? t("review.quoteFound") : t("review.readByCode")) : t("review.checkByEye")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {rows && rows.length > 0 && (
            <fieldset className="vck-intake-rows" disabled={phase.name === "saving"}>
              <legend className="vck-label">{t("review.toAdd")}</legend>
              {rows.map((r) => {
                const has = existing(r.year, r.month, r.key);
                return (
                  <div key={r.id} className="vck-intake-row">
                    <label className="vck-intake-tick">
                      <input type="checkbox" checked={r.include} onChange={(e) => update(r.id, { include: e.target.checked })} />
                      <span className="break-words">
                        <strong>{monthLabel(r.year, r.month)}</strong> · {tc(`fields.${r.key}`)}
                        {r.partial && <span className="vck-meta"> · {t("review.partMonth")}</span>}
                      </span>
                    </label>
                    <div className="vck-intake-value">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={r.value}
                        aria-label={t("review.valueFor", { field: tc(`fields.${r.key}`), month: monthLabel(r.year, r.month) })}
                        onChange={(e) => update(r.id, { value: e.target.value.replace(/[^\d.,]/g, "").slice(0, 14) })}
                      />
                      <span className="vck-inset">{tc(`units.${r.key}`)}</span>
                    </div>
                    {has > 0 && (
                      <label className="vck-intake-mode">
                        <span className="vck-meta">{t("review.already", { value: `${number.format(has)} ${tc(`units.${r.key}`)}` })}</span>
                        <select value={r.mode} onChange={(e) => update(r.id, { mode: e.target.value as Row["mode"] })}>
                          <option value="add">{t("review.modeAdd")}</option>
                          <option value="replace">{t("review.modeReplace")}</option>
                        </select>
                      </label>
                    )}
                  </div>
                );
              })}
            </fieldset>
          )}

          {proposal.shares.length === 0 && proposal.figures.length > 0 && <p className="vck-meta">{t("review.noClosedMonth")}</p>}

          {proposal.bank && <BankView bank={proposal.bank} money={money} dateLabel={dateLabel} />}

          {failure && <p className="vck-intake-error break-words" role="alert">{failure}</p>}

          <div className="vck-intake-actions">
            <button
              type="button"
              className="vck-btn vck-btn-primary"
              disabled={phase.name === "saving" || rows === null || (proposal.figures.length > 0 && chosen.length === 0)}
              onClick={() => void confirm()}
            >
              {phase.name === "saving" ? t("actions.saving") : chosen.length > 0 ? t("actions.add", { count: chosen.length }) : t("actions.keep")}
            </button>
            <button type="button" className="vck-btn" disabled={phase.name === "saving"} onClick={() => void discard()}>
              {t("actions.discard")}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function BankView({
  bank,
  money,
  dateLabel,
}: {
  bank: NonNullable<IntakeProposal["bank"]>;
  money: Intl.NumberFormat;
  dateLabel: (iso: string) => string;
}) {
  const t = useTranslations("dashboard.intake");
  const cats = Object.entries(bank.totals) as [keyof typeof bank.totals, number][];
  return (
    <div className="vck-intake-bank">
      <p className="vck-meta break-words">
        {bank.periodStart && bank.periodEnd
          ? t("bank.period", { from: dateLabel(bank.periodStart), to: dateLabel(bank.periodEnd), count: bank.debitCount })
          : t("bank.count", { count: bank.debitCount })}
      </p>
      {cats.length === 0 ? (
        <p className="break-words">{t("bank.none")}</p>
      ) : (
        <>
          <dl className="vck-intake-totals">
            {cats.map(([c, v]) => (
              <div key={c} className="vck-inset">
                <dt className="vck-meta">{t(`bank.cat.${c}`)}</dt>
                <dd>{money.format(v)}</dd>
              </div>
            ))}
          </dl>
          <p className="vck-label">{t("bank.payees")}</p>
          <ul className="vck-intake-payees">
            {bank.payees.map((p) => (
              <li key={`${p.category}-${p.name}`}>
                <span className="break-words">{p.name}</span>
                <span className="vck-meta">{t(`bank.cat.${p.category}`)} · {t("bank.times", { count: p.count })}</span>
                <span>{money.format(p.amount)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
