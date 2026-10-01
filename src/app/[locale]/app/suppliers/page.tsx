"use client";

/**
 * Suppliers: one list for every supplier the business works with.
 * Rows come from saved suppliers, CBAM import lines and bank payments.
 * Every figure is read from a stored record; checks re-read their source.
 * Nothing is sent from here. CBAM emails wait for approval on the CBAM page.
 */

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Btn, ConsolePage, Empty, Plate, State } from "@/components/app/console/kit";
import { invalidateWorkspace, useWorkspaceResource, workspaceRequest } from "@/components/app/console/workspace-store";

import { CompanyLogo } from "@/components/app/console/CompanyLogo";
import { logoDomain } from "@/lib/company-logo";

const PATH = "/api/console/suppliers";

interface Supplier {
  name: string;
  saved: boolean;
  email: string | null;
  contactName: string | null;
  notes: string | null;
  source: string;
  bankPayee: string | null;
  registrationNo: string | null;
  registryName: string | null;
  registryStatus: string | null;
  registryCheckedAt: string | null;
  wikirateUrl: string | null;
  wikirateCheckedAt: string | null;
  sanctionsCheckedAt: string | null;
  sanctionsStatus: "clear" | "possible_match" | null;
  sanctionsHits: { id: string; name: string; score: number; countries: string[]; url: string }[];
  spend12m: number;
  payments12m: number;
  lastPaid: string | null;
  cbamLines: number;
  cbamNeedsData: boolean;
  lastRequest: { sentAt: string; approvedBy: string } | null;
  pendingTaskId: number | null;
}
interface Payee { key: string; label: string; total: number; count: number; lastPaid: string }
type Suggestion =
  | { kind: "review_email"; supplier: string; taskId: number }
  | { kind: "add_email_cbam"; supplier: string }
  | { kind: "add_payee"; payee: string; label: string; total: number; count: number }
  | { kind: "check_registry"; supplier: string; spend12m: number };
interface Data {
  suppliers: Supplier[];
  untracked: Payee[];
  untrackedCount: number;
  suggestions: Suggestion[];
  bankPayments12m: number;
  cbamYear: number | null;
}
interface RegistryHit { name: string; displayNo: string; registrationNo: string; status: string; active: boolean; typeLabel: string }

function errText(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

function useFmt() {
  const loc = useLocale() === "el" ? "el-CY" : "en-GB";
  const money = (n: number) => new Intl.NumberFormat(loc, { style: "currency", currency: "EUR", maximumFractionDigits: n >= 1000 ? 0 : 2 }).format(n);
  const day = (iso: string) => new Date(iso).toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" });
  return { money, day };
}

function AddSupplier({ onDone }: { onDone: (msg: string) => void }) {
  const t = useTranslations("dashboard.suppliers");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", contactName: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!open) return <Btn variant="primary" onClick={() => setOpen(true)}>{t("add")}</Btn>;
  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      await workspaceRequest(PATH, { method: "PUT", body: { name: f.name, email: f.email || null, contactName: f.contactName || null, source: "manual" } });
      invalidateWorkspace([PATH, "/api/console/cbam"]);
      onDone(t("addedMsg", { name: f.name.trim() }));
      setF({ name: "", email: "", contactName: "" });
      setOpen(false);
    } catch (e) {
      setErr(errText(e, t("saveFailed")));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="vck-sup-add">
      <div className="vck-cbam-fields">
        <label><span>{t("name")}</span><input className="vck-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus autoComplete="organization" /></label>
        <label><span>{t("email")}</span><input type="email" className="vck-input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder={t("optional")} autoComplete="off" /></label>
        <label><span>{t("contactName")}</span><input className="vck-input" value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} placeholder={t("optional")} autoComplete="off" /></label>
      </div>
      <div className="vck-cbam-actions">
        <Btn variant="primary" onClick={save} disabled={busy || !f.name.trim()}>{busy ? t("saving") : t("save")}</Btn>
        <Btn variant="quiet" onClick={() => setOpen(false)} disabled={busy}>{t("cancel")}</Btn>
      </div>
      {err && <p className="vck-cbam-note" data-tone="warn" role="alert">{err}</p>}
    </div>
  );
}

function RegistryPicker({ name, onDone }: { name: string; onDone: (msg: string, tone?: "good" | "warn") => void }) {
  const t = useTranslations("dashboard.suppliers");
  const [q, setQ] = useState(name);
  const [hits, setHits] = useState<RegistryHit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const search = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await workspaceRequest<{ results: RegistryHit[] }>(`/api/console/company/registry?q=${encodeURIComponent(q.trim())}`);
      setHits(r.results.slice(0, 6));
    } catch (e) {
      setErr(errText(e, t("checkFailed")));
    } finally {
      setBusy(false);
    }
  };
  const pick = async (h: RegistryHit) => {
    setBusy(true);
    try {
      await workspaceRequest(PATH, { method: "POST", body: { action: "link_registry", name, registrationNo: h.displayNo } });
      invalidateWorkspace([PATH]);
      onDone(t("linkedMsg", { name, entry: `${h.name} (${h.displayNo})` }));
    } catch (e) {
      setErr(errText(e, t("checkFailed")));
      setBusy(false);
    }
  };
  return (
    <div className="vck-sup-reg">
      <div className="vck-cbam-fields vck-sup-search">
        <label><span>{t("registrySearch")}</span><input className="vck-input" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && q.trim().length >= 3 && search()} /></label>
        <Btn variant="quiet" onClick={search} disabled={busy || q.trim().length < 3}>{busy && !hits ? t("working") : t("search")}</Btn>
      </div>
      {err && <p className="vck-cbam-note" data-tone="warn">{err}</p>}
      {hits && hits.length === 0 && <p className="vck-cbam-note">{t("registryNone")}</p>}
      {hits && hits.length > 0 && (
        <ul className="vck-sup-hits">
          {hits.map((h) => (
            <li key={`${h.displayNo}|${h.name}`}>
              <div className="min-w-0">
                <strong>{h.name}</strong>
                <span className="vck-cbam-note">{h.displayNo} · {h.typeLabel} · {h.status}</span>
              </div>
              <Btn variant="quiet" onClick={() => pick(h)} disabled={busy}>{t("thisOne")}</Btn>
            </li>
          ))}
        </ul>
      )}
      <p className="vck-cbam-note vck-quiet">{t("registrySource")}</p>
    </div>
  );
}

function SupplierRow({ s, onMsg }: { s: Supplier; onMsg: (msg: string, tone?: "good" | "warn") => void }) {
  const t = useTranslations("dashboard.suppliers");
  const { money, day } = useFmt();
  const [edit, setEdit] = useState(false);
  const [reg, setReg] = useState(false);
  const [f, setF] = useState({ email: s.email ?? "", contactName: s.contactName ?? "", notes: s.notes ?? "" });
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<string>) => {
    setBusy(key);
    try {
      onMsg(await fn(), "good");
    } catch (e) {
      onMsg(errText(e, t("saveFailed")), "warn");
    } finally {
      setBusy(null);
    }
  };
  const save = () =>
    run("save", async () => {
      await workspaceRequest(PATH, { method: "PUT", body: { name: s.name, email: f.email || null, contactName: f.contactName || null, notes: f.notes || null, source: s.saved ? undefined : "cbam" } });
      invalidateWorkspace([PATH, "/api/console/cbam"]);
      setEdit(false);
      return t("savedMsg", { name: s.name });
    });
  const wiki = () =>
    run("wiki", async () => {
      const r = await workspaceRequest<{ found: boolean }>(PATH, { method: "POST", body: { action: "check_wikirate", name: s.name } });
      invalidateWorkspace([PATH]);
      return r.found ? t("wikiFound", { name: s.name }) : t("wikiNone", { name: s.name });
    });
  const screen = () =>
    run("sanctions", async () => {
      const r = await workspaceRequest<{ status: "clear" | "possible_match" }>(PATH, { method: "POST", body: { action: "check_sanctions", name: s.name } }).catch((e: unknown) => {
        // The server answers in English; show the not-connected case in the page language.
        throw new Error(errText(e, "").includes("could not be downloaded") ? t("sanNotConnected") : errText(e, t("saveFailed")));
      });
      invalidateWorkspace([PATH]);
      return r.status === "clear" ? t("sanClearMsg", { name: s.name }) : t("sanMatchMsg", { name: s.name });
    });
  const unlink = () =>
    run("unlink", async () => {
      await workspaceRequest(PATH, { method: "POST", body: { action: "unlink_registry", name: s.name } });
      invalidateWorkspace([PATH]);
      return t("unlinkedMsg", { name: s.name });
    });
  const remove = () => {
    if (!window.confirm(t("removeConfirm", { name: s.name }))) return;
    void run("remove", async () => {
      await workspaceRequest(`${PATH}?name=${encodeURIComponent(s.name)}`, { method: "DELETE" });
      invalidateWorkspace([PATH, "/api/console/cbam"]);
      return t("removedMsg", { name: s.name });
    });
  };

  const status = s.pendingTaskId !== null
    ? <State tone="live">{t("stEmailWaiting")}</State>
    : s.cbamNeedsData && !s.email
      ? <State tone="warn">{t("stNeedsEmail")}</State>
      : s.cbamNeedsData
        ? <State tone="live">{s.lastRequest ? t("stEmailed", { date: day(s.lastRequest.sentAt) }) : t("stNextRun")}</State>
        : s.cbamLines > 0
          ? <State tone="good">{t("stCbamComplete")}</State>
          : <State tone="idle">{t("stTracked")}</State>;

  return (
    <li className="vck-cbam-contact vck-sup-anchor" id={`sup-${encodeURIComponent(s.name)}`}>
      <div className="vck-cbam-contact-head">
        <span className="flex min-w-0 items-center gap-2.5">
          <CompanyLogo name={s.name} domain={logoDomain(null, s.email)} size={28} />
          <strong className="min-w-0 break-words">{s.name}</strong>
        </span>
        {status}
      </div>
      <dl className="vck-sup-facts">
        <div><dt>{t("spend")}</dt><dd>{s.payments12m > 0 ? `${money(s.spend12m)} · ${t("payments", { count: s.payments12m })}` : t("noPayments")}</dd></div>
        <div><dt>{t("contact")}</dt><dd>{s.email ? [s.contactName, s.email].filter(Boolean).join(" · ") : t("noEmail")}</dd></div>
        <div>
          <dt>{t("registry")}</dt>
          <dd>{s.registryName ? `${s.registryName} · ${s.registrationNo} · ${s.registryStatus}` : t("notChecked")}</dd>
        </div>
        <div>
          <dt>WikiRate</dt>
          <dd>
            {s.wikirateUrl ? <a href={s.wikirateUrl} target="_blank" rel="noreferrer" className="vck-link">{t("wikiOpen")}</a>
              : s.wikirateCheckedAt ? t("wikiNotListed", { date: day(s.wikirateCheckedAt) }) : t("notChecked")}
          </dd>
        </div>
        <div className={s.sanctionsStatus === "possible_match" ? "vck-sup-wide" : undefined}>
          <dt>{t("sanctions")}</dt>
          <dd>
            {s.sanctionsStatus === "clear" && t("sanClear", { date: day(s.sanctionsCheckedAt!) })}
            {s.sanctionsStatus === "possible_match" && (
              <>
                <span className="vck-warn-text">{t("sanReview", { count: s.sanctionsHits.length, date: day(s.sanctionsCheckedAt!) })}</span>
                <ul className="vck-sup-hits">
                  {s.sanctionsHits.map((h) => (
                    <li key={h.id}>
                      <a href={h.url} target="_blank" rel="noreferrer" className="vck-link break-words">{h.name}</a>
                      {h.countries.length > 0 && ` · ${h.countries.join(", ").toUpperCase()}`} · {t("sanScore", { pct: Math.round(h.score * 100) })}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {!s.sanctionsStatus && t("notChecked")}
          </dd>
        </div>
        {s.cbamLines > 0 && <div><dt>CBAM</dt><dd>{t("cbamLines", { count: s.cbamLines })}</dd></div>}
        {s.notes && <div className="vck-sup-wide"><dt>{t("notes")}</dt><dd>{s.notes}</dd></div>}
      </dl>

      {edit && (
        <div className="vck-sup-edit">
          <div className="vck-cbam-fields vck-cbam-fields-2">
            <label><span>{t("email")}</span><input type="email" className="vck-input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="off" /></label>
            <label><span>{t("contactName")}</span><input className="vck-input" value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} autoComplete="off" /></label>
          </div>
          <label className="vck-sup-notes"><span>{t("notes")}</span><textarea className="vck-input" rows={3} maxLength={1000} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></label>
        </div>
      )}
      {reg && <RegistryPicker name={s.name} onDone={(m) => { setReg(false); onMsg(m, "good"); }} />}

      <div className="vck-cbam-actions">
        {edit ? (
          <>
            <Btn variant="primary" onClick={save} disabled={busy !== null}>{busy === "save" ? t("saving") : t("save")}</Btn>
            <Btn variant="quiet" onClick={() => setEdit(false)} disabled={busy !== null}>{t("cancel")}</Btn>
          </>
        ) : (
          <Btn variant="quiet" onClick={() => setEdit(true)}>{t("edit")}</Btn>
        )}
        {s.pendingTaskId !== null && <Link href="/app/cbam" className="vck-btn vck-btn-primary">{t("reviewEmail")}</Link>}
        {s.registryName
          ? <Btn variant="text" onClick={unlink} disabled={busy !== null}>{t("unlink")}</Btn>
          : <Btn variant="quiet" onClick={() => setReg(!reg)}>{reg ? t("close") : t("checkRegistry")}</Btn>}
        <Btn variant="quiet" onClick={wiki} disabled={busy !== null}>{busy === "wiki" ? t("working") : s.wikirateCheckedAt ? t("wikiAgain") : t("checkWiki")}</Btn>
        <Btn variant="quiet" onClick={screen} disabled={busy !== null}>{busy === "sanctions" ? t("working") : s.sanctionsCheckedAt ? t("sanAgain") : t("checkSanctions")}</Btn>
        {s.saved && s.cbamLines === 0 && <Btn variant="text" onClick={remove} disabled={busy !== null}>{t("remove")}</Btn>}
      </div>
      {s.lastPaid && <p className="vck-cbam-note vck-quiet">{t("lastPaid", { date: day(s.lastPaid) })}</p>}
    </li>
  );
}

export default function SuppliersPage() {
  const t = useTranslations("dashboard.suppliers");
  const { money, day } = useFmt();
  const res = useWorkspaceResource<Data>(PATH);
  const [msg, setMsg] = useState<{ text: string; tone: "good" | "warn" } | null>(null);
  const [filter, setFilter] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const d = res.data;
  const say = (text: string, tone: "good" | "warn" = "good") => setMsg({ text, tone });

  const list = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const all = d?.suppliers ?? [];
    return q ? all.filter((s) => s.name.toLowerCase().includes(q) || (s.email ?? "").includes(q)) : all;
  }, [d?.suppliers, filter]);

  const addPayee = async (p: { key: string; label: string }) => {
    setAdding(p.key);
    try {
      await workspaceRequest(PATH, { method: "PUT", body: { name: p.label, bankPayee: p.key, source: "bank" } });
      invalidateWorkspace([PATH]);
      say(t("addedMsg", { name: p.label }));
    } catch (e) {
      say(errText(e, t("saveFailed")), "warn");
    } finally {
      setAdding(null);
    }
  };

  const suggestionText = (s: Suggestion) => {
    switch (s.kind) {
      case "review_email": return t("sgReview", { name: s.supplier });
      case "add_email_cbam": return t("sgEmail", { name: s.supplier });
      case "add_payee": return t("sgPayee", { name: s.label, total: money(s.total), count: s.count });
      case "check_registry": return s.spend12m > 0 ? t("sgRegistrySpend", { name: s.supplier, total: money(s.spend12m) }) : t("sgRegistry", { name: s.supplier });
    }
  };

  return (
    <ConsolePage
      title={t("title")}
      purpose={t("purpose")}
      actions={<AddSupplier onDone={(m) => say(m)} />}
      loading={res.loading && !d}
      error={res.error ? t("loadFailed") : null}
      onRetry={res.reload}
    >
      {msg && <p className="vck-cbam-note vck-sup-msg" role="status" data-tone={msg.tone}>{msg.text}</p>}

      {d && d.suggestions.length > 0 && (
        <Plate label={t("nextSteps")} meta={String(d.suggestions.length)} foot={t("nextStepsFoot")}>
          <ul className="vck-sup-steps">
            {d.suggestions.map((s, i) => (
              <li key={i}>
                <p>{suggestionText(s)}</p>
                {s.kind === "review_email" && <Link href="/app/cbam" className="vck-btn vck-btn-primary">{t("reviewEmail")}</Link>}
                {s.kind === "add_payee" && <Btn variant="quiet" disabled={adding !== null} onClick={() => addPayee({ key: s.payee, label: s.label })}>{adding === s.payee ? t("saving") : t("addThis")}</Btn>}
                {(s.kind === "add_email_cbam" || s.kind === "check_registry") && (
                  <a className="vck-btn vck-btn-quiet" href={`#sup-${encodeURIComponent(s.supplier)}`}>{t("goTo")}</a>
                )}
              </li>
            ))}
          </ul>
        </Plate>
      )}

      {d && d.suppliers.length === 0 ? (
        <Empty title={t("emptyTitle")} body={d.bankPayments12m > 0 ? t("emptyBodyBank") : t("emptyBody")}>
          {d.bankPayments12m === 0 && <Link href="/app/integrations" className="vck-btn">{t("connectBank")}</Link>}
        </Empty>
      ) : d ? (
        <Plate
          label={t("list")}
          meta={String(d.suppliers.length)}
          action={d.suppliers.length > 6 ? (
            <input className="vck-input vck-sup-filter" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t("filter")} aria-label={t("filter")} />
          ) : undefined}
          foot={t("listFoot")}
        >
          {list.length === 0 ? (
            <p className="vck-cbam-note">{t("noMatch")}</p>
          ) : (
            <ul className="vck-cbam-contacts">
              {list.map((s) => (
                <SupplierRow key={`${s.name}|${s.email ?? ""}|${s.notes ?? ""}`} s={s} onMsg={say} />
              ))}
            </ul>
          )}
        </Plate>
      ) : null}

      {d && d.untracked.length > 0 && (
        <Plate label={t("payees")} meta={String(d.untrackedCount)} foot={t("payeesFoot")}>
          <ul className="vck-sup-hits">
            {d.untracked.map((p) => (
              <li key={p.key}>
                <div className="min-w-0">
                  <strong>{p.label}</strong>
                  <span className="vck-cbam-note">{money(p.total)} · {t("payments", { count: p.count })} · {t("lastPaid", { date: day(p.lastPaid) })}</span>
                </div>
                <Btn variant="quiet" disabled={adding !== null} onClick={() => addPayee(p)}>{adding === p.key ? t("saving") : t("addThis")}</Btn>
              </li>
            ))}
          </ul>
        </Plate>
      )}
    </ConsolePage>
  );
}
