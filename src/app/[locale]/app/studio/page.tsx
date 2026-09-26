"use client";

import { useMemo, useState } from "react";
import NextImage from "next/image";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import { useWorkspaceAction, useWorkspaceResource } from "@/components/app/console/workspace-store";
import { PageShell, PageHeader, PageToolbar, ToolbarTabs, Section, Empty } from "@/components/app/console/kit";

/**
 * Report Visuals. One step: pick what the image is about, describe it, make
 * it. The server reads the company's real records for that topic, so every
 * figure in the image comes from the workspace. Images are stored and shared
 * through the workspace store.
 */

type Topic = "custom" | "company_data" | "progress" | "insights" | "recommendations";
type Ratio = "16:9" | "1:1" | "9:16" | "4:3";
type View = "recent" | "library";

interface Generation {
  id: number;
  type: "image" | "video";
  url: string;
  prompt: string;
  contextType: string | null;
  aspectRatio: string | null;
  saved: boolean;
  createdAt: string;
}

const LIST = "/api/studio/generations?limit=60";
const TOPICS: Topic[] = ["custom", "company_data", "progress", "insights", "recommendations"];
const RATIOS: Ratio[] = ["16:9", "1:1", "9:16", "4:3"];
const field =
  "w-full rounded-[0.375rem] border border-[var(--vc-rule-soft)] bg-[var(--vc-well)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vc-rule)]";

export default function StudioPage() {
  const t = useTranslations("dashboard.studio");
  const { data: session, isPending } = useSession();
  const signedIn = !!session?.user || APP_OPEN_ACCESS;

  const list = useWorkspaceResource<Generation[]>(signedIn ? LIST : null);
  const make = useWorkspaceAction();
  const edit = useWorkspaceAction();
  const change = useWorkspaceAction();

  const [view, setView] = useState<View>("recent");
  const [topic, setTopic] = useState<Topic>("progress");
  const [ratio, setRatio] = useState<Ratio>("16:9");
  const [brief, setBrief] = useState("");
  const [editBrief, setEditBrief] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [usedFacts, setUsedFacts] = useState<string[]>([]);

  const items = useMemo(() => list.data ?? [], [list.data]);
  const shown = view === "library" ? items.filter((g) => g.saved) : items;
  const savedCount = items.filter((g) => g.saved).length;
  const selected = items.find((g) => g.id === selectedId) ?? items[0] ?? null;

  const create = async () => {
    const res = await make.run<{ generation: Generation; facts: string[] }>("/api/studio/create", {
      body: { brief, context: topic, aspectRatio: ratio },
      invalidates: ["/api/studio"],
    });
    if (res) {
      setSelectedId(res.generation.id);
      setUsedFacts(res.facts);
      setView("recent");
    }
  };

  const applyEdit = async () => {
    if (!selected) return;
    const res = await edit.run<{ generation: Generation }>("/api/studio/create", {
      body: { brief: editBrief, sourceId: selected.id, aspectRatio: (selected.aspectRatio as Ratio) ?? "16:9" },
      invalidates: ["/api/studio"],
    });
    if (res) {
      setSelectedId(res.generation.id);
      setUsedFacts([]);
      setEditBrief("");
    }
  };

  const toggleSaved = (g: Generation) =>
    change.run(`/api/studio/generations/${g.id}`, { method: "PATCH", body: { saved: !g.saved }, invalidates: ["/api/studio"] });

  const remove = async (g: Generation) => {
    if (!window.confirm(t("confirmDelete"))) return;
    const ok = await change.run(`/api/studio/generations/${g.id}`, { method: "DELETE", invalidates: ["/api/studio"] });
    if (ok && selectedId === g.id) setSelectedId(null);
  };

  return (
    <PageShell
      signedOut={!isPending && !signedIn}
      loading={isPending || list.loading}
      error={list.error}
      onRetry={list.reload}
      header={<PageHeader title={t("title")} purpose={t("subtitle")} />}
      toolbar={
        <PageToolbar meta={t("itemCount", { count: shown.length })}>
          <ToolbarTabs
            ariaLabel={t("galleryLabel")}
            value={view}
            onChange={setView}
            options={[
              { value: "recent", label: t("recent") },
              { value: "library", label: t("library"), count: savedCount },
            ]}
          />
        </PageToolbar>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Section title={t("creator.title")} description={t("creator.subtitle")}>
          <form
            className="vck-card space-y-4 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (brief.trim().length >= 3 && !make.busy) void create();
            }}
          >
            <div>
              <label htmlFor="studio-topic" className="vck-label mb-1.5 block">{t("creator.topic")}</label>
              <select id="studio-topic" value={topic} onChange={(e) => setTopic(e.target.value as Topic)} className={field}>
                {TOPICS.map((k) => (
                  <option key={k} value={k}>{t(`topics.${k}`)}</option>
                ))}
              </select>
              <p className="vck-meta mt-1.5 leading-relaxed">{t(`topicHints.${topic}`)}</p>
            </div>

            <div>
              <label htmlFor="studio-brief" className="vck-label mb-1.5 block">{t("creator.brief")}</label>
              <textarea
                id="studio-brief"
                value={brief}
                maxLength={1000}
                onChange={(e) => setBrief(e.target.value)}
                placeholder={t(`placeholders.${topic}`)}
                className={`${field} min-h-[104px] resize-y`}
              />
            </div>

            <div>
              <span className="vck-label mb-1.5 block">{t("creator.shape")}</span>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("creator.shape")}>
                {RATIOS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={ratio === r}
                    onClick={() => setRatio(r)}
                    className={`vck-btn ${ratio === r ? "vck-btn-primary" : ""}`}
                  >
                    {t(`ratios.${r.replace(":", "x")}`)}
                  </button>
                ))}
              </div>
            </div>

            {make.error && <p role="alert" className="text-sm text-destructive break-words">{make.error}</p>}

            <button
              type="submit"
              disabled={make.busy || brief.trim().length < 3}
              className="vck-btn vck-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {make.busy ? t("creator.making") : t("creator.make")}
            </button>
            <p className="vck-meta leading-relaxed">{t("creator.cost")}</p>
          </form>
        </Section>

        <Section title={t("preview.title")}>
          {selected ? (
            <div className="vck-card space-y-4 p-4">
              <div className="overflow-hidden rounded-[0.5rem] border border-[var(--vc-rule-soft)] bg-[var(--vc-well)]">
                {selected.type === "image" ? (
                  <NextImage src={selected.url} alt={selected.prompt} width={1200} height={675} unoptimized className="h-auto w-full" />
                ) : (
                  <video src={selected.url} controls playsInline className="h-auto w-full" />
                )}
              </div>

              <p className="text-sm leading-relaxed break-words">{selected.prompt}</p>

              {selected.id === selectedId && usedFacts.length > 0 && (
                <div>
                  <p className="vck-label mb-1">{t("preview.facts")}</p>
                  <ul className="vck-meta list-disc space-y-0.5 pl-5">
                    {usedFacts.map((f) => <li key={f} className="break-words">{f}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={change.busy} onClick={() => toggleSaved(selected)} className={`vck-btn ${selected.saved ? "vck-btn-primary" : ""}`}>
                  {selected.saved ? t("preview.inLibrary") : t("preview.addToLibrary")}
                </button>
                <a href={selected.url} download={`vuneli-visual-${selected.id}.png`} target="_blank" rel="noopener noreferrer" className="vck-btn">
                  {t("preview.download")}
                </a>
                <button type="button" disabled={change.busy} onClick={() => remove(selected)} className="vck-btn">
                  {t("preview.delete")}
                </button>
              </div>
              {change.error && <p role="alert" className="text-sm text-destructive break-words">{change.error}</p>}

              {selected.type === "image" && (
                <form
                  className="border-t border-[var(--vc-rule-soft)] pt-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editBrief.trim().length >= 3 && !edit.busy) void applyEdit();
                  }}
                >
                  <label htmlFor="studio-edit" className="vck-label mb-1.5 block">{t("editing.title")}</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id="studio-edit"
                      value={editBrief}
                      maxLength={1000}
                      onChange={(e) => setEditBrief(e.target.value)}
                      placeholder={t("editing.placeholder")}
                      disabled={edit.busy}
                      className={`${field} flex-1`}
                    />
                    <button type="submit" disabled={edit.busy || editBrief.trim().length < 3} className="vck-btn vck-btn-primary disabled:cursor-not-allowed disabled:opacity-50">
                      {edit.busy ? t("creator.making") : t("editing.apply")}
                    </button>
                  </div>
                  {edit.error && <p role="alert" className="mt-2 text-sm text-destructive break-words">{edit.error}</p>}
                </form>
              )}
            </div>
          ) : (
            <Empty title={t("preview.empty")} body={t("preview.emptyHint")} />
          )}
        </Section>
      </div>

      <Section title={view === "recent" ? t("recent") : t("library")}>
        {shown.length === 0 ? (
          <Empty
            title={view === "library" ? t("gallery.noSaved") : t("gallery.none")}
            body={view === "library" ? t("gallery.saveHint") : t("gallery.createHint")}
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(g.id)}
                  aria-pressed={selected?.id === g.id}
                  className={`vck-card block w-full overflow-hidden p-0 text-left ${selected?.id === g.id ? "border-[var(--vc-rule)]" : ""}`}
                >
                  {g.type === "image" ? (
                    <NextImage src={g.url} alt="" width={320} height={200} unoptimized className="h-28 w-full object-cover" />
                  ) : (
                    <span className="vck-meta flex h-28 w-full items-center justify-center bg-[var(--vc-well)]">{t("video")}</span>
                  )}
                  <span className="block space-y-1 p-2">
                    <span className="line-clamp-3 block break-words text-[0.8125rem] font-medium leading-snug" title={g.prompt}>{g.prompt}</span>
                    <span className="vck-meta block">
                      {new Date(g.createdAt).toLocaleDateString()}
                      {g.saved ? ` · ${t("preview.inLibrary")}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </PageShell>
  );
}
