"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useWorkspaceResource } from "@/components/app/console/workspace-store";
import { Section } from "@/components/app/console/kit";

/** Short pointer from the Action plan to verified offsets and experts. */
export function ExpertsPanel() {
  const t = useTranslations("dashboard.actions");
  const list = useWorkspaceResource<{ projects?: unknown[] }>("/api/marketplace/projects");
  const count = list.data?.projects?.length ?? 0;

  return (
    <Section title={t("expertsTitle")} description={t("expertsBody")}>
      <div className="vck-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium">{list.loading ? "…" : t("expertsCount", { count })}</p>
          {!list.loading && count === 0 && <p className="vck-meta mt-1 break-words">{t("expertsEmpty")}</p>}
        </div>
        <Link href="/app/marketplace" className="vck-btn shrink-0">{t("expertsOpen")}</Link>
      </div>
    </Section>
  );
}
