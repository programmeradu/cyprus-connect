"use client";

/**
 * Supplier contacts and the Registry export panel for the CBAM page.
 * Saving a contact sends nothing: Border drafts the email on its next run and
 * it waits in the review queue until a person approves that exact text.
 */

import { workspaceRequest } from "./workspace-store";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Btn, Plate, State } from "@/components/app/console/kit";

export interface SupplierContact { supplierName: string; email: string; contactName: string | null }
export interface SentRequest { supplierName: string; email: string; sentAt: string; approvedBy: string }
export interface Declarant { legalName: string | null; eori: string | null; accountNumber: string | null; replyToEmail: string | null }

async function put(body: unknown, fallback: string): Promise<string | null> {
  try {
    await workspaceRequest("/api/console/cbam/contacts", { method: "PUT", body });
    return null;
  } catch (e) {
    return e instanceof Error && e.message ? e.message : fallback;
  }
}

function useCbamText() {
  const t = useTranslations("dashboard.cbam.c");
  const loc = useLocale() === "el" ? "el-CY" : "en-GB";
  return { t, loc };
}

function SupplierRow({ name, contact, lastSent, needsData, waiting, onSaved }: {
  name: string; contact?: SupplierContact; lastSent?: SentRequest; needsData: boolean; waiting: boolean; onSaved: () => void;
}) {
  const { t, loc } = useCbamText();
  const when = (iso: string) => new Date(iso).toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" });
  const [email, setEmail] = useState(contact?.email ?? "");
  const [person, setPerson] = useState(contact?.contactName ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setEmail(contact?.email ?? "");
    setPerson(contact?.contactName ?? "");
  }, [contact?.email, contact?.contactName]);

  const dirty = email.trim() !== (contact?.email ?? "") || person.trim() !== (contact?.contactName ?? "");

  const save = async () => {
    setBusy(true);
    setMsg(null);
    const err = await put({ kind: "supplier", supplierName: name, email, contactName: person || null }, t("saveFailed"));
    setBusy(false);
    setMsg(err ?? t("savedSupplier"));
    if (!err) onSaved();
  };

  return (
    <li className="vck-cbam-contact">
      <div className="vck-cbam-contact-head">
        <strong>{name}</strong>
        {waiting ? (
          <State tone="live">{t("waiting")}</State>
        ) : lastSent ? (
          <State tone="good">{t("emailed", { date: when(lastSent.sentAt) })}</State>
        ) : needsData ? (
          <State tone={contact ? "live" : "warn"}>{contact ? t("nextRun") : t("needsEmail")}</State>
        ) : (
          <State tone="idle">{t("complete")}</State>
        )}
      </div>
      <div className="vck-cbam-fields">
        <label>
          <span>{t("email")}</span>
          <input type="email" className="vck-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="emissions@supplier.com" autoComplete="off" />
        </label>
        <label>
          <span>{t("contactName")}</span>
          <input type="text" className="vck-input" value={person} onChange={(e) => setPerson(e.target.value)} placeholder={t("personPh")} autoComplete="off" />
        </label>
        <Btn variant="quiet" onClick={save} disabled={busy || !dirty || !email.trim()}>{busy ? t("saving") : t("save")}</Btn>
      </div>
      {msg && <p className="vck-cbam-note" role="status">{msg}</p>}
      {lastSent && <p className="vck-cbam-note vck-quiet">{t("lastSent", { email: lastSent.email, by: lastSent.approvedBy })}</p>}
    </li>
  );
}

export function SupplierContactsPlate({ supplierNames, needing, waiting, contacts, requests, onSaved }: {
  supplierNames: string[]; needing: Set<string>; waiting: Set<string>; contacts: SupplierContact[]; requests: SentRequest[]; onSaved: () => void;
}) {
  const { t } = useCbamText();
  if (supplierNames.length === 0) return null;
  const byName = new Map(contacts.map((c) => [c.supplierName, c]));
  const last = new Map<string, SentRequest>();
  for (const r of requests) if (!last.has(r.supplierName)) last.set(r.supplierName, r);
  const missing = supplierNames.filter((n) => needing.has(n) && !byName.has(n)).length;
  return (
    <Plate
      label={t("plate")}
      meta={missing ? t("missing", { count: missing }) : t("set")}
      metaTone={missing ? "warn" : "good"}
      foot={t("plateFoot")}
    >
      <ul className="vck-cbam-contacts">
        {supplierNames.map((n) => (
          <SupplierRow key={`${n}|${byName.get(n)?.email ?? ""}`} name={n} contact={byName.get(n)} lastSent={last.get(n)} needsData={needing.has(n)} waiting={waiting.has(n)} onSaved={onSaved} />
        ))}
      </ul>
    </Plate>
  );
}

export function RegistryPlate({ year, declarant, gaps, hasDraft, onSaved }: {
  year: number; declarant: Declarant; gaps: string[] | null; hasDraft: boolean; onSaved: () => void;
}) {
  const { t } = useCbamText();
  const [f, setF] = useState({
    legalName: declarant.legalName ?? "",
    eori: declarant.eori ?? "",
    accountNumber: declarant.accountNumber ?? "",
    replyToEmail: declarant.replyToEmail ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "good" | "warn"; text: string } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    setBusy(true);
    setMsg(null);
    const err = await put({ kind: "declarant", ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim() || null])) }, t("saveFailed"));
    setBusy(false);
    setMsg(err ? { tone: "warn", text: err } : { tone: "good", text: t("saved") });
    if (!err) onSaved();
  };

  const final = gaps !== null && gaps.length === 0;
  return (
    <Plate
      label={t("registry")}
      meta={<State tone={final ? "good" : "warn"}>{final ? t("final") : t("draftOnly")}</State>}
      foot={t("registryFoot")}
    >
      <div className="vck-cbam-fields vck-cbam-fields-2">
        <label><span>{t("legalName")}</span><input type="text" className="vck-input" value={f.legalName} onChange={set("legalName")} autoComplete="organization" /></label>
        <label><span>{t("eori")}</span><input type="text" className="vck-input" value={f.eori} onChange={set("eori")} placeholder="CY12345678X" autoComplete="off" /></label>
        <label><span>{t("account")}</span><input type="text" className="vck-input" value={f.accountNumber} onChange={set("accountNumber")} autoComplete="off" /></label>
        <label><span>{t("replyTo")}</span><input type="email" className="vck-input" value={f.replyToEmail} onChange={set("replyToEmail")} placeholder="compliance@yourcompany.cy" autoComplete="email" /></label>
      </div>
      <div className="vck-cbam-actions">
        <Btn variant="quiet" onClick={save} disabled={busy}>{busy ? t("saving") : t("saveDetails")}</Btn>
        {hasDraft ? (
          <a className={`vck-btn ${final ? "vck-btn-primary" : "vck-btn-quiet"}`} href={`/api/console/cbam/export?year=${year}`} download>
            {final ? t("downloadFinal", { year }) : t("downloadDraft", { year })}
          </a>
        ) : (
          <span className="vck-cbam-note">{t("runFirst")}</span>
        )}
      </div>
      {msg && <p className="vck-cbam-note" role="status" data-tone={msg.tone}>{msg.text}</p>}
      {gaps && gaps.length > 0 && (
        <p className="vck-cbam-note" data-tone="warn">{t("gaps", { gaps: gaps.join(", ") })}</p>
      )}
    </Plate>
  );
}

export interface PendingEmail { taskId: number; supplierName: string; to: string; replyTo: string | null; subject: string; body: string; lastError: string | null }

/** The exact emails waiting for a person. Approve sends this text and nothing else. */
export function PendingEmailsPlate({ emails, onDecided }: { emails: PendingEmail[]; onDecided: (text: string, tone: "good" | "warn") => void }) {
  const { t, loc } = useCbamText();
  const [busy, setBusy] = useState<number | null>(null);
  if (emails.length === 0) return null;
  const decide = async (e: PendingEmail, decision: "approve" | "reject") => {
    setBusy(e.taskId);
    try {
      await workspaceRequest(`/api/console/tasks/${e.taskId}`, { method: "POST", body: { decision } });
      onDecided(decision === "approve" ? t("sent", { to: e.to }) : t("rejected", { name: e.supplierName }), decision === "approve" ? "good" : "warn");
    } catch (err) {
      onDecided(err instanceof Error && err.message ? err.message : t("notSaved"), "warn");
    } finally {
      setBusy(null);
    }
  };
  return (
    <Plate label={t("pending")} meta={String(emails.length)} metaTone="warn"
      foot={<>{t("pendingFoot")}{loc !== "en-GB" ? ` ${t("mailNote")}` : ""}</>}>
      <ul className="vck-cbam-contacts">
        {emails.map((e) => (
          <li key={e.taskId} className="vck-cbam-contact">
            <div className="vck-cbam-contact-head"><strong>{e.subject}</strong></div>
            <p className="vck-cbam-note">{t("to", { to: e.to })} · {e.replyTo ? t("repliesTo", { email: e.replyTo }) : t("noReplyTo")}</p>
            <pre className="vck-cbam-mail" tabIndex={0} aria-label={e.subject}>{e.body}</pre>
            {e.lastError && <p className="vck-cbam-note" data-tone="warn">{e.lastError}</p>}
            <div className="vck-cbam-actions">
              <Btn variant="primary" disabled={busy !== null} onClick={() => decide(e, "approve")}>{busy === e.taskId ? t("working") : t("approve")}</Btn>
              <Btn variant="quiet" disabled={busy !== null} onClick={() => decide(e, "reject")}>{t("reject")}</Btn>
            </div>
          </li>
        ))}
      </ul>
    </Plate>
  );
}
