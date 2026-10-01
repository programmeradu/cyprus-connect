"use client";

/**
 * The account's private bill-forwarding address, shown at the top of Add data.
 * Hidden when bill forwarding isn't set up on this site.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
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
