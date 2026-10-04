"use client";

/**
 * The cards Verde draws inside an answer. One card per tool result, in our
 * own design, so the AI never invents layout or styling: it only chooses
 * which card to show and the records fill it.
 */

import Link from "next/link";
import { useState } from "react";
import { IcoArrowUpRight, IcoCheck, IcoCoin } from "./icons";

export type Lang = "en" | "el";

const T = {
  en: {
    footprint: "Footprint figures",
    deadlines: "Deadlines that apply",
    suppliers: "Suppliers",
    funding: "Funding you may qualify for",
    bills: "Utility bills",
    activity: "Recent changes",
    facts: "Verde needs a few facts",
    proposal: "Proposed change",
    document: "Ready to download",
    none: "Nothing recorded yet.",
    prev: "previous",
    source: "Source",
    might: "might apply",
    applies: "applies",
    review: "under review",
    strong: "strong fit",
    oneAway: "one answer away",
    missing: "Missing",
    noEmail: "no email",
    sanctionsClear: "sanctions clear",
    sanctionsHit: "sanctions match, review",
    notChecked: "not checked",
    kwh: "kWh",
    save: "Save to company record",
    saving: "Saving",
    saved: "Saved. Ask Verde to continue.",
    yes: "Yes",
    no: "No",
    approve: "Approve",
    decline: "Decline",
    working: "Working",
    download: "Download PDF",
    preparing: "Preparing",
    open: "Open",
    ran: "Checked",
    checking: "Checking",
    failed: "Could not read",
    upgrade: "Upgrade plan",
    planUpgrade: "Subscription plan",
    upgradeTo: "Upgrade to",
    checkingStatus: "Checking status...",
    checkStatus: "Check status",
    planActive: "Active",
    upgradeSuccess: "Your plan is upgraded and active!",
    checkoutFail: "Could not open Stripe Checkout. Please try again.",
    monthly: "month",
    yearly: "year",
    billedMonthly: "per month",
    billedYearly: "per year (2 months free)",
  },
  el: {
    footprint: "Στοιχεία αποτυπώματος",
    deadlines: "Προθεσμίες που ισχύουν",
    suppliers: "Προμηθευτές",
    funding: "Χρηματοδοτήσεις για εσάς",
    bills: "Λογαριασμοί",
    activity: "Πρόσφατες αλλαγές",
    facts: "Η Verde χρειάζεται μερικά στοιχεία",
    proposal: "Προτεινόμενη αλλαγή",
    document: "Έτοιμο για λήψη",
    none: "Δεν υπάρχουν ακόμη στοιχεία.",
    prev: "προηγούμενο",
    source: "Πηγή",
    might: "ίσως ισχύει",
    applies: "ισχύει",
    review: "υπό έλεγχο",
    strong: "ισχυρή αντιστοίχιση",
    oneAway: "μία απάντηση μακριά",
    missing: "Λείπει",
    noEmail: "χωρίς email",
    sanctionsClear: "χωρίς κυρώσεις",
    sanctionsHit: "πιθανή κύρωση, ελέγξτε",
    notChecked: "δεν ελέγχθηκε",
    kwh: "kWh",
    save: "Αποθήκευση στην εταιρεία",
    saving: "Αποθήκευση",
    saved: "Αποθηκεύτηκε. Ζητήστε από τη Verde να συνεχίσει.",
    yes: "Ναι",
    no: "Όχι",
    approve: "Έγκριση",
    decline: "Απόρριψη",
    working: "Σε εξέλιξη",
    download: "Λήψη PDF",
    preparing: "Προετοιμασία",
    open: "Άνοιγμα",
    ran: "Έλεγξε",
    checking: "Ελέγχει",
    failed: "Δεν διαβάστηκε",
    upgrade: "Αναβάθμιση πλάνου",
    planUpgrade: "Συνδρομητικό πλάνο",
    upgradeTo: "Αναβάθμιση σε",
    checkingStatus: "Έλεγχος κατάστασης...",
    checkStatus: "Έλεγχος κατάστασης",
    planActive: "Ενεργό",
    upgradeSuccess: "Το πλάνο σας αναβαθμίστηκε επιτυχώς!",
    checkoutFail: "Δεν ήταν δυνατό το άνοιγμα του Stripe Checkout. Δοκιμάστε ξανά.",
    monthly: "μήνα",
    yearly: "έτος",
    billedMonthly: "ανά μήνα",
    billedYearly: "ανά έτος (2 μήνες δωρεάν)",
  },
} as const;

export function verdeText(lang: Lang) {
  return T[lang];
}

export const TOOL_LABEL: Record<string, { en: string; el: string }> = {
  read_footprint: { en: "footprint figures", el: "στοιχεία αποτυπώματος" },
  read_deadlines: { en: "deadlines", el: "προθεσμίες" },
  read_suppliers: { en: "supplier list", el: "λίστα προμηθευτών" },
  read_funding: { en: "Grant scout matches", el: "αντιστοιχίσεις Grant scout" },
  read_bills: { en: "utility bills", el: "λογαριασμούς" },
  read_activity: { en: "recent activity", el: "πρόσφατη δραστηριότητα" },
  ask_for_facts: { en: "what is missing", el: "τι λείπει" },
  propose_change: { en: "a change for your approval", el: "μια αλλαγή για έγκριση" },
  prepare_document: { en: "a document", el: "ένα έγγραφο" },
  upgrade_plan: { en: "plan upgrade", el: "αναβάθμιση πλάνου" },
};

const FACT_LABEL: Record<string, { en: string; el: string; type: "number" | "text" | "bool" }> = {
  revenueEur: { en: "Yearly revenue (EUR)", el: "Ετήσιος κύκλος εργασιών (EUR)", type: "number" },
  employees: { en: "Number of employees", el: "Αριθμός εργαζομένων", type: "number" },
  sites: { en: "Number of sites or shops", el: "Αριθμός χώρων ή καταστημάτων", type: "number" },
  industry: { en: "Industry", el: "Κλάδος", type: "text" },
  website: { en: "Company website", el: "Ιστοσελίδα εταιρείας", type: "text" },
  importsCbamGoods: { en: "Do you import steel, aluminium, cement, fertiliser or hydrogen from outside the EU?", el: "Εισάγετε χάλυβα, αλουμίνιο, τσιμέντο, λιπάσματα ή υδρογόνο εκτός ΕΕ;", type: "bool" },
  eudrCommodities: { en: "Do you trade cattle, cocoa, coffee, palm oil, rubber, soy or wood?", el: "Εμπορεύεστε βοοειδή, κακάο, καφέ, φοινικέλαιο, καουτσούκ, σόγια ή ξύλο;", type: "bool" },
  consumerClaims: { en: "Do you make green claims to consumers (for example 'eco-friendly')?", el: "Κάνετε περιβαλλοντικούς ισχυρισμούς σε καταναλωτές;", type: "bool" },
};

const fmt = (n: number, lang: Lang) => n.toLocaleString(lang === "el" ? "el-GR" : "en-GB", { maximumFractionDigits: 2 });
const date = (d: string | null | undefined, lang: Lang) =>
  d ? new Date(d).toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

function Card({ title, source, children }: { title: string; source?: string; children: React.ReactNode }) {
  return (
    <section className="vv-card">
      <header className="vv-card-head">
        <strong>{title}</strong>
        {source && <span className="vv-card-source">{source}</span>}
      </header>
      {children}
    </section>
  );
}

/* ---------------------------------------------------------------- read cards */

type Out = Record<string, unknown>;

export function FootprintCard({ out, lang }: { out: Out; lang: Lang }) {
  const t = T[lang];
  const metrics = (out.metrics as Array<{ key: string; label: string; unit: string; value: number; period: string; previous: { value: number; period: string } | null; betterWhen: string }>) ?? [];
  return (
    <Card title={t.footprint} source={`${t.source}: metric_readings`}>
      {metrics.length === 0 ? (
        <p className="vv-empty">{t.none}</p>
      ) : (
        <ul className="vv-metrics">
          {metrics.slice(0, 6).map((m) => {
            const delta = m.previous && m.previous.value !== 0 ? ((m.value - m.previous.value) / m.previous.value) * 100 : null;
            const good = delta === null ? null : m.betterWhen === "down" ? delta <= 0 : delta >= 0;
            return (
              <li key={m.key}>
                <span className="vv-metric-label">{m.label}</span>
                <span className="vv-metric-value">
                  {fmt(m.value, lang)} <small>{m.unit}</small>
                </span>
                <span className="vv-metric-meta">
                  {m.period}
                  {delta !== null && (
                    <em data-good={good ? "yes" : "no"}>
                      {delta > 0 ? "+" : ""}
                      {fmt(delta, lang)}% {t.prev} {m.previous!.period}
                    </em>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function DeadlinesCard({ out, lang }: { out: Out; lang: Lang }) {
  const t = T[lang];
  const items = (out.items as Array<{ id: string; framework: string; title: string; dueDate: string; match: string | null; reason: string | null; sourceLabel: string | null; sourceUrl: string | null; underReview: boolean }>) ?? [];
  return (
    <Card title={t.deadlines} source={`${t.source}: ${lang === "el" ? "κανονισμοί ΕΕ και Κύπρου" : "EU and Cyprus law"}`}>
      {items.length === 0 ? (
        <p className="vv-empty">{t.none}</p>
      ) : (
        <ul className="vv-rows">
          {items.slice(0, 5).map((o) => (
            <li key={o.id}>
              <span className="vv-row-date">{date(o.dueDate, lang)}</span>
              <span className="vv-row-main">
                <strong>{o.title}</strong>
                <span>
                  {o.framework} · {o.match === "might" ? t.might : t.applies}
                  {o.underReview ? ` · ${t.review}` : ""}
                </span>
              </span>
              {o.sourceUrl && (
                <a className="vv-row-link" href={o.sourceUrl} target="_blank" rel="noreferrer">
                  {o.sourceLabel ?? t.source}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      <Link className="vv-card-more" href={"/app/compliance" as never}>{t.open}</Link>
    </Card>
  );
}

export function SuppliersCard({ out, lang }: { out: Out; lang: Lang }) {
  const t = T[lang];
  const items = (out.items as Array<{ id: number; name: string; hasEmail: boolean; sanctionsStatus: string | null; registryStatus: string | null }>) ?? [];
  return (
    <Card title={t.suppliers} source={`${t.source}: ${lang === "el" ? "λίστα προμηθευτών" : "supplier list"}`}>
      {items.length === 0 ? (
        <p className="vv-empty">{t.none}</p>
      ) : (
        <ul className="vv-rows">
          {items.slice(0, 6).map((s) => (
            <li key={s.id}>
              <span className="vv-row-main">
                <strong>{s.name}</strong>
                <span>
                  {s.hasEmail ? "" : `${t.noEmail} · `}
                  {s.sanctionsStatus === "clear" ? t.sanctionsClear : s.sanctionsStatus === "possible_match" ? t.sanctionsHit : t.notChecked}
                  {s.registryStatus ? ` · ${s.registryStatus}` : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link className="vv-card-more" href={"/app/suppliers" as never}>{t.open}</Link>
    </Card>
  );
}

export function FundingCard({ out, lang }: { out: Out; lang: Lang }) {
  const t = T[lang];
  const items = (out.items as Array<{ id: number; title: string; url: string; program: string | null; deadline: string | null; verdict: string; missing: string[] }>) ?? [];
  return (
    <Card title={t.funding} source={`${t.source}: Grant scout`}>
      {items.length === 0 ? (
        <p className="vv-empty">{t.none}</p>
      ) : (
        <ul className="vv-rows">
          {items.slice(0, 4).map((c) => (
            <li key={c.id}>
              <span className="vv-row-main">
                <a href={c.url} target="_blank" rel="noreferrer"><strong>{c.title}</strong></a>
                <span>
                  {c.verdict === "strong" ? t.strong : t.oneAway}
                  {c.deadline ? ` · ${date(c.deadline, lang)}` : ""}
                </span>
                {c.missing.length > 0 && <span className="vv-row-note">{t.missing}: {c.missing.join("; ")}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function BillsCard({ out, lang }: { out: Out; lang: Lang }) {
  const t = T[lang];
  const e = out.electricity as { bills: Array<{ periodStart: string; periodEnd: string; kwh: number; kgCo2e: number }>; totalKwh: number; totalKgCo2e: number; factor: { kgPerKwh: number; source: string } };
  return (
    <Card title={t.bills} source={`${t.source}: ${e?.factor?.source ?? "EAC"}`}>
      {!e || e.bills.length === 0 ? (
        <p className="vv-empty">{t.none}</p>
      ) : (
        <>
          <p className="vv-big">
            {fmt(e.totalKwh, lang)} <small>{t.kwh}</small> · {fmt(e.totalKgCo2e, lang)} <small>kg CO₂e</small>
          </p>
          <ul className="vv-rows">
            {e.bills.slice(0, 4).map((b) => (
              <li key={b.periodEnd}>
                <span className="vv-row-main">
                  <strong>{date(b.periodStart, lang)} – {date(b.periodEnd, lang)}</strong>
                  <span>{fmt(b.kwh, lang)} {t.kwh} · {fmt(b.kgCo2e, lang)} kg CO₂e</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

export function ActivityCard({ out, lang }: { out: Out; lang: Lang }) {
  const t = T[lang];
  const items = (out.items as Array<{ who: string; did: string; on: string | null }>) ?? [];
  return (
    <Card title={t.activity}>
      {items.length === 0 ? (
        <p className="vv-empty">{t.none}</p>
      ) : (
        <ul className="vv-rows">
          {items.slice(0, 6).map((a, i) => (
            <li key={i}>
              <span className="vv-row-main">
                <strong>{a.who}</strong>
                <span>{a.did}{a.on ? ` · ${date(a.on, lang)}` : ""}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* --------------------------------------------------------------- act cards */

export function FactsCard({
  out,
  lang,
  onSaved,
  authHeaders,
}: {
  out: Out;
  lang: Lang;
  onSaved: () => void;
  authHeaders: () => Record<string, string>;
}) {
  const t = T[lang];
  const facts = (out.facts as Array<{ key: string; current: unknown }>) ?? [];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(facts.map((f) => [f.key, f.current === null || f.current === undefined ? "" : String(f.current)])),
  );
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const body: Record<string, unknown> = {};
    for (const f of facts) {
      const def = FACT_LABEL[f.key];
      const v = (values[f.key] ?? "").trim();
      if (!def || v === "") continue;
      if (def.type === "number") {
        const n = Number(v.replace(/[,\s€]/g, ""));
        if (!Number.isFinite(n) || n < 0) {
          setError(lang === "el" ? `Ελέγξτε: ${def.el}` : `Check: ${def.en}`);
          return;
        }
        body[f.key] = f.key === "revenueEur" ? n : Math.round(n);
      } else if (def.type === "bool") {
        body[f.key] = v === "true";
      } else body[f.key] = v;
    }
    if (Object.keys(body).length === 0) return;
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/console/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const msg = ((await res.json().catch(() => ({}))) as { message?: string }).message;
        throw new Error(msg ?? "save failed");
      }
      setState("saved");
      onSaved();
    } catch (e) {
      setState("idle");
      setError(e instanceof Error && e.message !== "save failed" ? e.message : lang === "el" ? "Δεν αποθηκεύτηκε." : "Could not save.");
    }
  }

  return (
    <Card title={t.facts}>
      <p className="vv-reason">{String(out.reason ?? "")}</p>
      {state === "saved" ? (
        <p className="vv-done"><IcoCheck size={12} /> {t.saved}</p>
      ) : (
        <form
          className="vv-form"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          {facts.map((f) => {
            const def = FACT_LABEL[f.key];
            if (!def) return null;
            const id = `vv-fact-${f.key}`;
            return (
              <div key={f.key} className="vv-field">
                <label htmlFor={id}>{def[lang]}</label>
                {def.type === "bool" ? (
                  <div className="vv-choice" role="radiogroup" aria-labelledby={id}>
                    {(["true", "false"] as const).map((v) => (
                      <button
                        key={v}
                        id={v === "true" ? id : undefined}
                        type="button"
                        role="radio"
                        aria-checked={values[f.key] === v}
                        onClick={() => setValues((p) => ({ ...p, [f.key]: v }))}
                      >
                        {v === "true" ? t.yes : t.no}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    id={id}
                    inputMode={def.type === "number" ? "decimal" : "text"}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            );
          })}
          {error && <p className="vv-error" role="alert">{error}</p>}
          <button type="submit" className="vv-primary" disabled={state === "saving"}>
            {state === "saving" ? t.saving : t.save}
          </button>
        </form>
      )}
    </Card>
  );
}

export interface ProposalState {
  id: number;
  kind: string;
  title: string;
  summary: string;
  status: "pending" | "approved" | "rejected" | "failed";
  resultNote: string | null;
  decidedBy: string | null;
  deliverableHref?: string | null;
  deliverableTitle?: string | null;
}

export function ProposalCard({
  proposal,
  lang,
  busy,
  onDecide,
}: {
  proposal: ProposalState;
  lang: Lang;
  busy: boolean;
  onDecide: (id: number, decision: "approve" | "reject") => void;
}) {
  const t = T[lang];
  const settled = proposal.status !== "pending";
  return (
    <section className="vv-card vv-proposal" data-status={proposal.status}>
      <header className="vv-card-head">
        <strong>{t.proposal}</strong>
        {settled && <span className="vv-card-source">{proposal.status}</span>}
      </header>
      <p className="vv-prop-title">{proposal.title}</p>
      <p className="vv-reason">{proposal.summary}</p>
      {settled ? (
        <>
          {proposal.resultNote && <p className="vv-row-note">{proposal.resultNote}{proposal.decidedBy ? ` (${proposal.decidedBy})` : ""}</p>}
          {proposal.status === "approved" && proposal.deliverableHref && (
            <Link href={proposal.deliverableHref as never} className="vv-card-more">
              {proposal.deliverableTitle ?? t.open}
            </Link>
          )}
        </>
      ) : (
        <div className="vv-actions">
          <button type="button" className="vv-primary" disabled={busy} onClick={() => onDecide(proposal.id, "approve")}>
            <IcoCheck size={12} /> {busy ? t.working : t.approve}
          </button>
          <button type="button" className="vv-secondary" disabled={busy} onClick={() => onDecide(proposal.id, "reject")}>
            {t.decline}
          </button>
        </div>
      )}
    </section>
  );
}

export function DocumentCard({ out, lang, onDownload }: { out: Out; lang: Lang; onDownload: () => Promise<void> }) {
  const t = T[lang];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <section className="vv-card vv-doc">
      <header className="vv-card-head">
        <strong>{t.document}</strong>
        <span className="vv-card-source">PDF · {lang === "el" ? "με αποτύπωμα επαλήθευσης" : "with verification fingerprint"}</span>
      </header>
      <p className="vv-prop-title">Board Summary</p>
      <p className="vv-reason">{String(out.note ?? "")}</p>
      {error && <p className="vv-error" role="alert">{error}</p>}
      <div className="vv-actions">
        <button
          type="button"
          className="vv-primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await onDownload();
            } catch {
              setError(lang === "el" ? "Η λήψη απέτυχε. Δοκιμάστε ξανά." : "The download failed. Please try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? t.preparing : t.download}
        </button>
      </div>
    </section>
  );
}

export function UpgradePlanCard({
  out,
  lang,
  onUpgraded,
}: {
  out: Out;
  lang: Lang;
  onUpgraded?: () => void;
}) {
  const t = T[lang];
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>(String(out.currentPlanId ?? "free"));

  const targetPlanId = String(out.targetPlanId ?? "pro") as "pro" | "enterprise";
  const targetPlanName = String(out.targetPlanName ?? (targetPlanId === "enterprise" ? "Enterprise" : "Pro"));
  const interval = (out.interval === "year" ? "year" : "month") as "month" | "year";
  const priceEur = Number(out.priceEur ?? (targetPlanId === "enterprise" ? (interval === "year" ? 1850 : 185) : interval === "year" ? 450 : 45));
  const features = Array.isArray(out.features) ? (out.features as string[]) : [];
  const reason = String(out.reason ?? "");

  const isAlreadyTarget = currentPlan.toLowerCase() === targetPlanId.toLowerCase();

  const handleCheckout = async () => {
    setBusy(true);
    setError(null);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "subscription",
          planId: targetPlanId,
          interval,
          locale: lang,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || t.checkoutFail);
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t.checkoutFail);
      setBusy(false);
    }
  };

  const checkStatus = async () => {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/subscription", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Could not check status");
      const data = (await res.json()) as { subscription?: { planId?: string; status?: string } };
      const activePlan = data.subscription?.planId ?? "free";
      setCurrentPlan(activePlan);
      if (activePlan.toLowerCase() === targetPlanId.toLowerCase()) {
        setStatusMessage(t.upgradeSuccess);
        onUpgraded?.();
      } else {
        setStatusMessage(
          lang === "el"
            ? `Τρέχον πλάνο: ${activePlan.toUpperCase()} (${data.subscription?.status ?? "active"})`
            : `Current plan: ${activePlan.toUpperCase()} (${data.subscription?.status ?? "active"})`,
        );
      }
    } catch {
      setError(lang === "el" ? "Αποτυχία ελέγχου κατάστασης." : "Status check failed.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <section className="vv-card vv-upgrade-card">
      <header className="vv-card-head">
        <strong>{t.planUpgrade}</strong>
        <span className="vv-card-source">
          Stripe · {interval === "year" ? t.billedYearly : t.billedMonthly}
        </span>
      </header>

      <div className="vv-plan-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <p className="vv-prop-title" style={{ fontSize: "1.05rem", fontWeight: 700 }}>
          {targetPlanName}
        </p>
        <span className="vv-plan-price" style={{ fontSize: "1.2rem", fontWeight: 750, fontVariantNumeric: "tabular-nums" }}>
          €{priceEur} <small style={{ fontSize: "0.78rem", fontWeight: 500, opacity: 0.8 }}>/{interval === "year" ? t.yearly : t.monthly}</small>
        </span>
      </div>

      {reason && <p className="vv-reason">{reason}</p>}

      {features.length > 0 && (
        <ul className="vv-plan-features" style={{ listStyle: "none", margin: "4px 0", padding: 0, display: "flex", flexDirection: "column", gap: 5 }}>
          {features.slice(0, 5).map((f, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: "0.82rem", lineHeight: 1.35 }}>
              <span style={{ color: "var(--vc-good-text, #10b981)", flexShrink: 0, marginTop: 1 }}>
                <IcoCheck size={13} />
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="vv-error" role="alert">
          {error}
        </p>
      )}

      {statusMessage && (
        <p className="vv-done" role="status">
          <IcoCheck size={14} /> {statusMessage}
        </p>
      )}

      <div className="vv-actions" style={{ marginTop: 4 }}>
        {!isAlreadyTarget ? (
          <button
            type="button"
            className="vv-primary"
            disabled={busy || checking}
            onClick={handleCheckout}
          >
            <IcoCoin size={14} /> {busy ? t.working : `${t.upgradeTo} ${targetPlanName}`}
            <IcoArrowUpRight size={13} />
          </button>
        ) : (
          <span className="vv-done" style={{ alignSelf: "center" }}>
            <IcoCheck size={14} /> {t.planActive}
          </span>
        )}

        <button
          type="button"
          className="vv-secondary"
          disabled={checking || busy}
          onClick={checkStatus}
        >
          {checking ? t.checkingStatus : t.checkStatus}
        </button>
      </div>
    </section>
  );
}
