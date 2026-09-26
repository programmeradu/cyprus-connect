"use client";

/**
 * Integrations: every source a figure in the workspace can come from, with
 * its real state. Live feeds show their latest measured reading; account
 * links show whether they are set up and made. One view, no guessed numbers.
 */

import { Suspense, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ConsolePage, Plate, Reading, ReadingRail, Btn, Bar } from "@/components/app/console/kit";
import { useWorkspaceAction, useWorkspaceResource } from "@/components/app/console/workspace-store";
import { ConnectorTile } from "@/components/app/integrations/ConnectorTile";
import {
  CONNECTORS,
  CATEGORY_LABEL,
  CATEGORY_NOTE,
  CATEGORY_ORDER,
  type Connector,
} from "@/components/app/integrations/catalog";
import type { IntegrationsData } from "@/app/api/console/integrations/route";

const PATH = "/api/console/integrations";
const QB_TOKENS = "/api/oauth/quickbooks/tokens";

function IntegrationsContent() {
  const t = useTranslations("dashboard.integrations");
  const locale = (useLocale() === "el" ? "el" : "en") as "en" | "el";
  const loc = locale === "el" ? "el-CY" : "en-GB";
  const L = (en: string, el: string) => (locale === "el" ? el : en);
  const router = useRouter();
  const searchParams = useSearchParams();
  const res = useWorkspaceResource<IntegrationsData>(PATH);
  const qbAction = useWorkspaceAction();
  const d = res.data;

  const time = useMemo(() => new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }), [loc]);
  const date = useMemo(() => new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric" }), [loc]);

  // Result of the QuickBooks sign-in round trip.
  useEffect(() => {
    const ok = searchParams.get("qb_success");
    const err = searchParams.get("qb_error");
    if (!ok && !err) return;
    if (ok === "true") {
      toast.success(t("toasts.qbConnected"));
      res.reload();
    } else if (err) {
      const known = ["missing_parameters", "invalid_state", "missing_user", "token_exchange_failed", "storage_failed", "callback_failed"];
      toast.error(known.includes(err) ? t(`toasts.qbErrors.${err}` as never) : t("toasts.qbErrors.default"));
    }
    router.replace("/app/integrations");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (qbAction.error) toast.error(qbAction.error);
  }, [qbAction.error]);

  const connectQb = async () => {
    const r = await qbAction.run<{ authUrl?: string }>("/api/oauth/quickbooks/authorize", { method: "GET", invalidates: [] });
    if (r?.authUrl) window.location.href = r.authUrl;
  };
  const disconnectQb = async () => {
    const r = await qbAction.run(QB_TOKENS, { method: "DELETE", invalidates: [PATH] });
    if (r) toast.success(t("toasts.qbDisconnected"));
  };

  const qb = d?.quickbooks;
  const liveCount = CONNECTORS.filter((c) => c.state === "live").length;
  const linkableCount = CONNECTORS.filter((c) => c.state === "oauth").length;
  const linkedCount = qb?.connected ? 1 : 0;
  const scheduledCount = CONNECTORS.filter((c) => c.state === "scheduled").length;
  const inUse = liveCount + linkedCount;
  const coverage = Math.round((inUse / CONNECTORS.length) * 100);

  const statusFor = (c: Connector) => {
    if (c.id === "quickbooks" && qb) {
      if (qb.connected) return qb.expired ? { word: L("Link expired", "Η σύνδεση έληξε"), tone: "bad" as const } : { word: t("quickbooks.connected"), tone: "good" as const };
      if (!qb.configured) return { word: L("Not set up yet", "Δεν έχει ρυθμιστεί"), tone: "idle" as const };
    }
    if (c.id === "energy-charts" && d && !d.grid) return { word: L("No answer today", "Χωρίς απάντηση σήμερα"), tone: "warn" as const };
    return undefined;
  };

  const actionFor = (c: Connector) => {
    if (c.id === "quickbooks") {
      if (!qb || !qb.configured) return null;
      return qb.connected ? (
        <Btn onClick={disconnectQb} disabled={qbAction.busy}>
          {qbAction.busy ? t("quickbooks.disconnecting") : t("quickbooks.disconnect")}
        </Btn>
      ) : (
        <Btn variant="primary" onClick={connectQb} disabled={qbAction.busy}>
          {qbAction.busy ? t("quickbooks.connecting") : t("quickbooks.connect")}
        </Btn>
      );
    }
    if (c.id === "energy-charts" && d?.grid) {
      return <Link href="/app/insights" className="vck-btn vck-btn-quiet">{L("Open today's grid", "Το σημερινό δίκτυο")}</Link>;
    }
    return null;
  };

  const detailFor = (c: Connector) => {
    if (c.id === "quickbooks" && qb) {
      if (!qb.configured) {
        return <p className="vci-tile-note">{L("QuickBooks linking opens once the workspace owner adds the QuickBooks app keys. Until then, upload bills or enter figures.", "Η σύνδεση QuickBooks ανοίγει όταν ο ιδιοκτήτης προσθέσει τα κλειδιά της εφαρμογής. Μέχρι τότε, ανεβάστε λογαριασμούς ή καταχωρίστε αριθμούς.")}</p>;
      }
      if (!qb.connected) return null;
      return (
        <div className="vci-tile-detail">
          <div>
            <span>{t("quickbooks.environment")}</span>
            <strong className="capitalize">{qb.environment}</strong>
          </div>
          <div>
            <span>{t("quickbooks.lastSync")}</span>
            <strong className="vck-num">{qb.lastSyncedAt ? date.format(new Date(qb.lastSyncedAt)) : L("Not yet", "Όχι ακόμη")}</strong>
          </div>
          {qb.expired && <div>{t("quickbooks.tokenExpired")}</div>}
        </div>
      );
    }
    if (c.id === "energy-charts" && d) {
      if (!d.grid) {
        return (
          <p className="vci-tile-note">
            {d.gridReason === "unsupported"
              ? L(`Energy-Charts does not publish hourly data for ${d.country}.`, `Το Energy-Charts δεν δημοσιεύει ωριαία δεδομένα για ${d.country}.`)
              : L("The feed did not answer just now. Nothing is shown in its place; it is tried again on the next visit.", "Η ροή δεν απάντησε. Τίποτα δεν εμφανίζεται στη θέση της· ξαναδοκιμάζεται στην επόμενη επίσκεψη.")}
          </p>
        );
      }
      return (
        <div className="vci-tile-detail">
          <div>
            <span>{L("Latest measured hour", "Τελευταία μετρημένη ώρα")}</span>
            <strong className="vck-num">{time.format(new Date(d.grid.latestAt))}</strong>
          </div>
          <div>
            <span>{L("Carbon intensity", "Ένταση άνθρακα")}</span>
            <strong className="vck-num">{Math.round(d.grid.latestGrams)} g CO₂/kWh</strong>
          </div>
          {d.grid.renewableShare !== null && (
            <div>
              <span>{L("Renewable share", "Μερίδιο ανανεώσιμων")}</span>
              <strong className="vck-num">{d.grid.renewableShare.toFixed(1)}%</strong>
            </div>
          )}
          <div>
            <span>{L("Hours received today", "Ώρες που λήφθηκαν σήμερα")}</span>
            <strong className="vck-num">{d.grid.hours}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ConsolePage
      title={t("title")}
      purpose={L("Every figure in the workspace comes from one of these sources.", "Κάθε αριθμός στην πλατφόρμα προέρχεται από μία από αυτές τις πηγές.")}
      loading={res.loading}
      error={res.error}
      onRetry={res.reload}
    >
      <ReadingRail>
        <Reading label={L("Live feeds", "Ενεργές ροές")} value={liveCount} note={L("no account needed", "χωρίς σύνδεση λογαριασμού")} />
        <Reading
          label={L("Linked accounts", "Συνδεδεμένοι λογαριασμοί")}
          value={`${linkedCount} / ${linkableCount}`}
          note={qb && !qb.configured ? L("linking not set up yet", "η σύνδεση δεν έχει ρυθμιστεί") : L("accounts you can link", "λογαριασμοί προς σύνδεση")}
        />
        <Reading label={L("Planned", "Προγραμματισμένες")} value={scheduledCount} note={L("no controls until they work", "χωρίς κουμπιά μέχρι να λειτουργούν")} />
        <Reading label={L("Sources in use", "Πηγές σε χρήση")} value={`${coverage}%`} note={<Bar pct={coverage} />} />
      </ReadingRail>

      {CATEGORY_ORDER.map((cat) => {
        const items = CONNECTORS.filter((c) => c.category === cat);
        if (items.length === 0) return null;
        return (
          <Plate key={cat} label={CATEGORY_LABEL[cat][locale]} meta={`${items.length}`}>
            <p className="vci-group-note">{CATEGORY_NOTE[cat][locale]}</p>
            <div className="vci-grid">
              {items.map((c) => (
                <ConnectorTile key={c.id} connector={c} locale={locale} status={statusFor(c)} action={actionFor(c)} detail={detailFor(c)} />
              ))}
            </div>
          </Plate>
        );
      })}
    </ConsolePage>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <ConsolePage title="Integrations" loading>
          <div />
        </ConsolePage>
      }
    >
      <IntegrationsContent />
    </Suspense>
  );
}
