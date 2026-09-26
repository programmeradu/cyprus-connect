"use client";

/**
 * Supplier contacts and the Registry export panel for the CBAM page.
 * Saving a contact sends nothing: Border drafts the email on its next run and
 * it waits in the review queue until a person approves that exact text.
 */

import { useState } from "react";
import { Btn, Plate, State } from "@/components/app/console/kit";

export interface SupplierContact { supplierName: string; email: string; contactName: string | null }
export interface SentRequest { supplierName: string; email: string; sentAt: string; approvedBy: string }
export interface Declarant { legalName: string | null; eori: string | null; accountNumber: string | null; replyToEmail: string | null }

async function put(body: unknown): Promise<string | null> {
  const res = await fetch("/api/console/cbam/contacts", {
    method: "PUT",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) return null;
  const b = await res.json().catch(() => ({}));
  return b.message ?? "Could not save.";
}

const when = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function SupplierRow({ name, contact, lastSent, needsData, waiting, onSaved }: {
  name: string; contact?: SupplierContact; lastSent?: SentRequest; needsData: boolean; waiting: boolean; onSaved: () => void;
}) {
  const [email, setEmail] = useState(contact?.email ?? "");
  const [person, setPerson] = useState(contact?.contactName ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const dirty = email.trim() !== (contact?.email ?? "") || person.trim() !== (contact?.contactName ?? "");

  const save = async () => {
    setBusy(true);
    setMsg(null);
    const err = await put({ kind: "supplier", supplierName: name, email, contactName: person || null });
    setBusy(false);
    setMsg(err ?? "Saved. Border drafts the email on its next run.");
    if (!err) onSaved();
  };

  return (
    <li className="vck-cbam-contact">
      <div className="vck-cbam-contact-head">
        <strong>{name}</strong>
        {waiting ? (
          <State tone="live">Email waiting for approval</State>
        ) : lastSent ? (
          <State tone="good">Emailed {when(lastSent.sentAt)}</State>
        ) : needsData ? (
          <State tone={contact ? "live" : "warn"}>{contact ? "Email drafted on next run" : "Needs an email"}</State>
        ) : (
          <State tone="idle">Data complete</State>
        )}
      </div>
      <div className="vck-cbam-fields">
        <label>
          <span>Email</span>
          <input type="email" className="vck-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="emissions@supplier.com" autoComplete="off" />
        </label>
        <label>
          <span>Contact name (optional)</span>
          <input type="text" className="vck-input" value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Name of the person" autoComplete="off" />
        </label>
        <Btn variant="quiet" onClick={save} disabled={busy || !dirty || !email.trim()}>{busy ? "Saving…" : "Save"}</Btn>
      </div>
      {msg && <p className="vck-cbam-note" role="status">{msg}</p>}
      {lastSent && <p className="vck-cbam-note vck-quiet">Last request to {lastSent.email}, approved by {lastSent.approvedBy}.</p>}
    </li>
  );
}

export function SupplierContactsPlate({ supplierNames, needing, waiting, contacts, requests, onSaved }: {
  supplierNames: string[]; needing: Set<string>; waiting: Set<string>; contacts: SupplierContact[]; requests: SentRequest[]; onSaved: () => void;
}) {
  if (supplierNames.length === 0) return null;
  const byName = new Map(contacts.map((c) => [c.supplierName, c]));
  const last = new Map<string, SentRequest>();
  for (const r of requests) if (!last.has(r.supplierName)) last.set(r.supplierName, r);
  const missing = supplierNames.filter((n) => needing.has(n) && !byName.has(n)).length;
  return (
    <Plate
      label="Supplier data requests"
      meta={missing ? `${missing} need an email` : "Contacts set"}
      metaTone={missing ? "warn" : "good"}
      foot="Border writes each email from your import lines. It waits in your review queue; nothing is sent until you approve that exact text. Suppliers reply to your reply-to address."
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
    const err = await put({ kind: "declarant", ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim() || null])) });
    setBusy(false);
    setMsg(err ? { tone: "warn", text: err } : { tone: "good", text: "Saved." });
    if (!err) onSaved();
  };

  const final = gaps !== null && gaps.length === 0;
  return (
    <Plate
      label="EU CBAM Registry file"
      meta={<State tone={final ? "good" : "warn"}>{final ? "Final" : "Draft only"}</State>}
      foot="The file follows the declaration's fields but is not yet checked against the Commission's official format. Check it in the Registry before you submit. Submission stays in your own declarant account."
    >
      <div className="vck-cbam-fields vck-cbam-fields-2">
        <label><span>Declarant legal name</span><input type="text" className="vck-input" value={f.legalName} onChange={set("legalName")} autoComplete="organization" /></label>
        <label><span>EORI number</span><input type="text" className="vck-input" value={f.eori} onChange={set("eori")} placeholder="CY12345678X" autoComplete="off" /></label>
        <label><span>CBAM account number</span><input type="text" className="vck-input" value={f.accountNumber} onChange={set("accountNumber")} autoComplete="off" /></label>
        <label><span>Reply-to email for suppliers</span><input type="email" className="vck-input" value={f.replyToEmail} onChange={set("replyToEmail")} placeholder="compliance@yourcompany.cy" autoComplete="email" /></label>
      </div>
      <div className="vck-cbam-actions">
        <Btn variant="quiet" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save details"}</Btn>
        {hasDraft ? (
          <a className={`vck-btn ${final ? "vck-btn-primary" : "vck-btn-quiet"}`} href={`/api/console/cbam/export?year=${year}`} download>
            {final ? `Download ${year} Registry file` : `Download ${year} draft file`}
          </a>
        ) : (
          <span className="vck-cbam-note">Run the agent to create the draft first.</span>
        )}
      </div>
      {msg && <p className="vck-cbam-note" role="status" data-tone={msg.tone}>{msg.text}</p>}
      {gaps && gaps.length > 0 && (
        <p className="vck-cbam-note" data-tone="warn">Still needed for a final file: {gaps.join(", ")}.</p>
      )}
    </Plate>
  );
}

export interface PendingEmail { taskId: number; supplierName: string; to: string; replyTo: string | null; subject: string; body: string; lastError: string | null }

/** The exact emails waiting for a person. Approve sends this text and nothing else. */
export function PendingEmailsPlate({ emails, onDecided }: { emails: PendingEmail[]; onDecided: (text: string, tone: "good" | "warn") => void }) {
  const [busy, setBusy] = useState<number | null>(null);
  if (emails.length === 0) return null;
  const decide = async (e: PendingEmail, decision: "approve" | "reject") => {
    setBusy(e.taskId);
    try {
      const res = await fetch(`/api/console/tasks/${e.taskId}`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) onDecided(b.error ?? "The decision was not saved.", "warn");
      else onDecided(decision === "approve" ? `Sent to ${e.to}.` : `Email to ${e.supplierName} rejected. Border will not send it.`, decision === "approve" ? "good" : "warn");
    } finally {
      setBusy(null);
    }
  };
  return (
    <Plate label="Emails waiting for your approval" meta={String(emails.length)} metaTone="warn"
      foot="Approving sends exactly this text. If the import lines change, Border withdraws this email and drafts a new one.">
      <ul className="vck-cbam-contacts">
        {emails.map((e) => (
          <li key={e.taskId} className="vck-cbam-contact">
            <div className="vck-cbam-contact-head"><strong>{e.subject}</strong></div>
            <p className="vck-cbam-note">To {e.to}{e.replyTo ? ` · replies go to ${e.replyTo}` : " · no reply-to set, replies go to the sender address"}</p>
            <pre className="vck-cbam-mail">{e.body}</pre>
            {e.lastError && <p className="vck-cbam-note" data-tone="warn">{e.lastError}</p>}
            <div className="vck-cbam-actions">
              <Btn variant="primary" disabled={busy !== null} onClick={() => decide(e, "approve")}>{busy === e.taskId ? "Working…" : "Approve and send"}</Btn>
              <Btn variant="quiet" disabled={busy !== null} onClick={() => decide(e, "reject")}>Reject</Btn>
            </div>
          </li>
        ))}
      </ul>
    </Plate>
  );
}
