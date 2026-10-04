"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Section, DataTable, Empty } from "@/components/app/console/kit";
import type { DataTableColumn as Column } from "@/components/app/console/kit";
import { FRAMEWORKS } from "@/lib/compliance/frameworks";
import { useUser } from "@/lib/user-context";
import { markdownToSections } from "@/lib/pdf/markdown-sections";
import type { ComplianceDocument } from "./types";

export function DocumentsTab({
  documents,
  onGenerate,
  generating
}: {
  documents: ComplianceDocument[];
  onGenerate: (framework: string) => void;
  generating: boolean;
}) {
  const t = useTranslations("dashboard.compliance");
  const { user } = useUser();
  const companyName = user?.companyName ?? "";
  const [busyId, setBusyId] = useState<number | null>(null);
  const statusLabel = (s: string) =>
    s === "submitted" ? t("status.submitted") : s === "ready" ? t("status.ready") : t("status.draft");
  const statusTone = (s: string) => (s === "submitted" ? "positive" : s === "ready" ? "caution" : undefined);

  const columns: Column<ComplianceDocument>[] = [
    {
      key: "title",
      header: t("columns.document"),
      render: (doc) => (
        <div>
          <p className="font-medium break-words">{doc.title}</p>
          <p className="vck-meta">{doc.framework}</p>
        </div>
      )
    },
    {
      key: "status",
      header: t("columns.status"),
      render: (doc) => (
        <span className="vck-tag" data-tone={statusTone(doc.status)}>
          {statusLabel(doc.status)}
        </span>
      )
    },
    {
      key: "dueDate",
      header: t("documents.dueDate"),
      hideOnMobile: true,
      render: (doc) => new Date(doc.dueDate).toLocaleDateString()
    },
    {
      key: "actions",
      header: "",
      render: (doc) => (
        <button
          type="button"
          className="vck-btn"
          disabled={!doc.content || busyId === doc.id}
          aria-busy={busyId === doc.id}
          onClick={async () => {
            if (!doc.content) return;
            setBusyId(doc.id);
            try {
              const { downloadReport } = await import("@/lib/pdf/report");
              const { summary, sections } = markdownToSections(doc.content);
              await downloadReport(
                {
                  title: doc.title,
                  framework: doc.framework,
                  periodLabel: String(new Date(doc.generatedAt).getFullYear()),
                  status: doc.status,
                  workspaceName: companyName || doc.title,
                  agentName: null,
                  summary,
                  sections,
                },
                `${doc.title.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "")}.pdf`,
              );
              toast.success(t("toasts.downloaded"));
            } catch {
              toast.error(t("toasts.generateFailed"));
            } finally {
              setBusyId(null);
            }
          }}
        >
          {busyId === doc.id ? "…" : t("documents.download")}
        </button>
      )
    }
  ];

  return (
    <>
      <Section title={t("documents.aiTitle")} description={t("documents.aiDescription")}>
        <div className="vck-card flex flex-wrap gap-2 p-4">
          {FRAMEWORKS.map((f) => f.label).map((framework) => (
            <button
              key={framework}
              type="button"
              className="vck-btn"
              onClick={() => onGenerate(framework)}
              disabled={generating}
            >
              {generating ? t("documents.generating") : t("documents.generatePrefix", { framework })}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t("tabs.documents")}>
        <DataTable
          columns={columns}
          rows={documents}
          rowKey={(d) => String(d.id)}
          empty={
            <Empty
              title={t("documents.noDocuments")}
              body={t("documents.noDocumentsHint")}
            />
          }
        />
      </Section>
    </>
  );
}
