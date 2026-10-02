"use client";

/**
 * The account's private bill-forwarding address, shown at the top of Add data.
 * Hidden when bill forwarding isn't set up on this site.
 */

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useWorkspaceAction, useWorkspaceResource } from "@/components/app/console/workspace-store";
import type { BillInboxSummary } from "@/lib/integrations/bill-inbox.server";

const PATH = "/api/console/integrations";

export function InboxAddress() {
  const t = useTranslations("dashboard.intake.inbox");
  const data = useWorkspaceResource<{ billInbox?: BillInboxSummary }>(PATH);
  const action = useWorkspaceAction();
  const [copied, setCopied] = useState(false);
  const inbox = data.data?.billInbox;
  if (!inbox?.ready) return null;

  const copy = async () => {
    if (!inbox.address) return;
    try {
      await navigator.clipboard.writeText(inbox.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the address stays selectable */
    }
  };

  return (
    <div className="vck-inbox">
      <p className="vck-inbox-label">{t("title")}</p>
      {inbox.address ? (
        <>
          <div className="vck-inbox-addr">
            <code>{inbox.address}</code>
            <button type="button" className="vck-btn" onClick={() => void copy()}>
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
          <p className="vck-meta">{t("body")}</p>
          <LastEmail inbox={inbox} />
        </>
      ) : (
        <>
          <p className="vck-meta">{t("intro")}</p>
          <div>
            <button
              type="button"
              className="vck-btn"
              disabled={action.busy}
              onClick={() => void action.run(PATH + "/bill-inbox", { body: { rotate: false }, invalidates: [PATH] })}
            >
              {action.busy ? t("getting") : t("get")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** What happened to the last forwarded email, so people can see it arrived. */
function LastEmail({ inbox }: { inbox: BillInboxSummary }) {
  const el = useLocale().startsWith("el");
  const L = (en: string, gr: string) => (el ? gr : en);
  if (!inbox.lastMessageAt) {
    return <p className="vck-meta">{L("No email has arrived yet.", "Δεν έχει φτάσει ακόμη κανένα email.")}</p>;
  }
  const when = new Intl.DateTimeFormat(el ? "el-CY" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(inbox.lastMessageAt));
  if (inbox.confirmation) {
    return (
      <p className="vck-meta" style={{ overflowWrap: "anywhere" }}>
        {L(`Last email ${when}: Gmail asked to confirm this address.`, `Τελευταίο email ${when}: το Gmail ζήτησε επιβεβαίωση.`)}{" "}
        {inbox.confirmation.code && <>{L("Code: ", "Κωδικός: ")}<strong className="vck-num">{inbox.confirmation.code}</strong>. </>}
        {inbox.confirmation.link && (
          <a href={inbox.confirmation.link} target="_blank" rel="noopener noreferrer">{L("Open the confirmation", "Άνοιγμα επιβεβαίωσης")}</a>
        )}
      </p>
    );
  }
  const added = inbox.lastResult.filter((r) => r.ok && !r.duplicate && !r.pending).length;
  const waiting = inbox.lastResult.filter((r) => r.pending).length;
  const from = inbox.lastMessageFrom ? L(` from ${inbox.lastMessageFrom}`, ` από ${inbox.lastMessageFrom}`) : "";
  return (
    <div className="vck-meta" style={{ overflowWrap: "anywhere" }} role="status">
      <p style={{ margin: 0 }}>
        <strong>{L(`Last email ${when}${from}: `, `Τελευταίο email ${when}${from}: `)}</strong>
        {waiting > 0
          ? waiting === 1
            ? L("1 bill read and waiting for your check below.", "1 λογαριασμός διαβάστηκε και περιμένει τον έλεγχό σας παρακάτω.")
            : L(`${waiting} bills read and waiting for your check below.`, `${waiting} λογαριασμοί διαβάστηκαν και περιμένουν τον έλεγχό σας παρακάτω.`)
          : added === 1 ? L("1 bill added.", "προστέθηκε 1 λογαριασμός.") : L(`${added} bills added.`, `προστέθηκαν ${added} λογαριασμοί.`)}
      </p>
      {inbox.lastResult.filter((r) => !r.ok || r.duplicate).map((r, i) => (
        <p key={i} style={{ margin: "2px 0 0" }}>
          {r.file === "—" ? "" : `${r.file}: `}{r.duplicate ? L("already added", "υπάρχει ήδη") : r.reason}
        </p>
      ))}
    </div>
  );
}
