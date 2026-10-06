"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Section, Metric, MetricRow, Empty } from "@/components/app/console/kit";
import { useWorkspaceAction, useWorkspaceResource } from "@/components/app/console/workspace-store";
import { daysUntil, type ComplianceDocument } from "./types";

type Match = "applies" | "might" | "not";
interface Obligation {
  id: string;
  ruleId: string | null;
  framework: string;
  title: string;
  titleEl: string | null;
  detail: string | null;
  dueDate: string;
  match: Match | null;
  reason: string | null;
  reasonEl: string | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
  checkedAt: string | null;
  underReview: string[];
  fact: string | null;
}

/** Yes/no facts answered right here, and the company field each saves to. */
const YES_NO: Record<string, string> = { cbam_goods: "importsCbamGoods", eudr_goods: "eudrCommodities", consumer_claims: "consumerClaims" };

/**
 * The Report home: legal deadlines worked out from the company's own facts.
 * What applies, what might (with the one answer that settles it), and what
 * was checked and doesn't apply. Each row names its reason and official law.
 */
export function OverviewTab({
  documents,
  onGenerate,
  generating,
  onOpenDocuments,
}: {
  documents: ComplianceDocument[];
  onGenerate: (framework: string) => void;
  generating: boolean;
  onOpenDocuments: () => void;
}) {
  const t = useTranslations("dashboard.compliance");
  const locale = useLocale();
  const el = locale === "el";
  const loc = el ? "el-CY" : "en-GB";
  const res = useWorkspaceResource<{ obligations: Obligation[]; checkedAt: string | null }>("/api/console/obligations");
  const { run, busy } = useWorkspaceAction();
  const all = res.data?.obligations ?? [];
  const applies = all.filter((o) => o.match === "applies" || o.match === null);
  const might = all.filter((o) => o.match === "might");
  const not = all.filter((o) => o.match === "not");
  const soon = applies.filter((o) => o.dueDate && daysUntil(o.dueDate) >= 0 && daysUntil(o.dueDate) <= 90).length;
  const vsmeDrafts = documents.filter((d) => d.framework.toLowerCase() === "vsme");

  const answer = async (fact: string, yes: boolean) => {
    await run("/api/console/company", { method: "PATCH", body: { [YES_NO[fact]]: yes }, invalidates: ["/api/console/obligations", "/api/console/overview", "/api/console/company"] });
  };

  const when = (o: Obligation) => {
    if (!o.dueDate) return t("deadlines.ongoing");
    const d = new Date(o.dueDate);
    const days = daysUntil(o.dueDate);
    const left = days < 0 ? t("regulations.overdue") : t("board.daysLeft", { days });
    return `${d.toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" })} · ${left}`;
  };

const FRAMEWORK_EL: Record<string, string> = {
  "Energy efficiency": "Ενεργειακή απόδοση",
  "Consumer law": "Δίκαιο καταναλωτή",
};

function translateSourceLabel(label: string | null | undefined, isGreek: boolean): string {
  if (!label) return "";
  if (!isGreek) return label;
  return label
    .replace(/\bDirective\b/g, "Οδηγία")
    .replace(/\bRegulation\b/g, "Κανονισμός")
    .replace(/\bReg\.\b/g, "Καν.")
    .replace(/\bArt\.\b/g, "Άρθρο")
    .replace(/\(EU\)/g, "(ΕΕ)")
    .replace(/\bas amended by\b/g, "όπως τροποποιήθηκε από");
}

  const frameworkLabel = (f: string) => (el && FRAMEWORK_EL[f] ? FRAMEWORK_EL[f] : f);

  const row = (o: Obligation) => (
    <div key={o.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-4 py-4">
      <div className="min-w-0 flex-1 basis-72">
        <p className="text-sm font-medium break-words">{(el && o.titleEl) || o.title}</p>
        <p className="vck-meta mt-1 break-words">{o.match === "not" ? frameworkLabel(o.framework) : when(o)}</p>
        {(o.reason || o.detail) && <p className="mt-2 text-sm leading-relaxed break-words">{(el && o.reasonEl) || o.reason || o.detail}</p>}
        <p className="vck-meta mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {o.sourceUrl && (
            <a
              href={el && o.sourceUrl.includes("/TXT/?uri=CELEX") ? o.sourceUrl.replace("/TXT/?uri=CELEX", "/TXT/EL/?uri=CELEX") : o.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 break-words"
            >
              {translateSourceLabel(o.sourceLabel ?? t("deadlines.source"), el)}
            </a>
          )}
          {o.match === null && <span>{t("deadlines.addedByPerson")}</span>}
        </p>
      </div>
      <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
        {o.underReview.length > 0 && (
          <span className="vck-tag" data-tone="caution" title={o.underReview.join(", ")}>{t("deadlines.underReview")}</span>
        )}
        {o.match === "might" && o.fact && YES_NO[o.fact] && (
          <>
            <button type="button" className="vck-btn" disabled={busy} onClick={() => answer(o.fact!, true)}>{t("deadlines.yes")}</button>
            <button type="button" className="vck-btn vck-btn-quiet" disabled={busy} onClick={() => answer(o.fact!, false)}>{t("deadlines.no")}</button>
          </>
        )}
        {o.match === "might" && (o.fact === "employees" || o.fact === "revenue") && (
          <Link href="/app/settings" className="vck-btn">{t("deadlines.addFacts")}</Link>
        )}
        {o.match === "might" && o.ruleId === "energy_audit" && (
          <Link href="/app/integrations" className="vck-btn">{t("deadlines.uploadBills")}</Link>
        )}
        {o.match === "applies" && o.framework === "CBAM" && (
          <Link href="/app/cbam" className="vck-btn">{t("board.openCbam")}</Link>
        )}
      </div>
    </div>
  );

  if (res.error) return <Empty title={t("toasts.fetchFailed")} body={res.error} />;

  return (
    <>
      <Section title={t("overview.summary")}>
        <MetricRow columns={3}>
          <Metric label={t("deadlines.appliesLabel")} value={res.loading ? "…" : applies.length} note={t("deadlines.appliesNote")} />
          <Metric label={t("deadlines.next90")} value={res.loading ? "…" : soon} note={t("overview.upcomingDeadlines")} />
          <Metric label={t("deadlines.mightLabel")} value={res.loading ? "…" : might.length} note={t("deadlines.mightNote")} />
        </MetricRow>
      </Section>

      <Section title={t("deadlines.appliesTitle")} description={t("deadlines.appliesDescription")}>
        {applies.length ? <div className="vck-ledgerbox">{applies.map(row)}</div> : !res.loading && <Empty title={t("deadlines.noneTitle")} body={t("deadlines.noneBody")} />}
      </Section>

      {might.length > 0 && (
        <Section title={t("deadlines.mightTitle")} description={t("deadlines.mightDescription")}>
          <div className="vck-ledgerbox">{might.map(row)}</div>
        </Section>
      )}

      {not.length > 0 && (
        <Section title={t("deadlines.notTitle", { count: not.length })}>
          <details className="vck-ledgerbox">
            <summary className="cursor-pointer px-4 py-3 text-sm">{t("deadlines.showWhy")}</summary>
            {not.map(row)}
          </details>
        </Section>
      )}

      <Section title={t("deadlines.voluntaryTitle")} description={t("deadlines.voluntaryDescription")}>
        <div className="vck-ledgerbox">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div className="min-w-0 flex-1 basis-64">
              <p className="text-sm font-medium">VSME</p>
              <p className="vck-meta mt-1">{vsmeDrafts.length ? t("board.drafts", { count: vsmeDrafts.length }) : t("board.noDraft")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="vck-btn" disabled={generating} onClick={() => onGenerate("VSME")}>
                {generating ? t("documents.generating") : vsmeDrafts.length ? t("board.redraft") : t("board.draft")}
              </button>
              {vsmeDrafts.length > 0 && <button type="button" className="vck-btn vck-btn-quiet" onClick={onOpenDocuments}>{t("board.openDrafts")}</button>}
            </div>
          </div>
        </div>
      </Section>

      {res.data?.checkedAt && (
        <p className="vck-meta px-1">{t("deadlines.checkedAt", { date: new Date(res.data.checkedAt).toLocaleString(loc, { dateStyle: "medium", timeStyle: "short" }).replace(/\.+$/, "") })}</p>
      )}
    </>
  );
}
