"use client";

/**
 * Find your company in the Cyprus Registrar of Companies and link it. The
 * link fills the legal name, registration number, status and registered
 * office from the register itself, so every page and every agent reads the
 * same verified record. Reads and writes go through the shared store.
 */

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useWorkspaceAction, workspaceRequest } from "@/components/app/console/workspace-store";
import type { CompanyRecord } from "@/app/api/console/company/route";

interface Hit {
  name: string;
  displayNo: string;
  typeLabel: string;
  status: string;
  active: boolean;
  registeredOn: string | null;
}

export function RegistryLink({ registry, companyName }: { registry: CompanyRecord["registry"]; companyName: string }) {
  const t = useTranslations("dashboard.settings.registry");
  const writer = useWorkspaceAction();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useName, setUseName] = useState(true);
  const seq = useRef(0);

  // Search as the person types, after a short pause; stale answers are dropped.
  useEffect(() => {
    const text = q.trim();
    if (text.length < 3 && !/\d/.test(text)) {
      setHits(null);
      setError(null);
      return;
    }
    const id = ++seq.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const body = await workspaceRequest<{ results: Hit[] }>(`/api/console/company/registry?q=${encodeURIComponent(text)}`);
        if (id === seq.current) { setHits(body.results); setError(null); }
      } catch (e) {
        if (id === seq.current) { setHits(null); setError(e instanceof Error ? e.message : t("failed")); }
      } finally {
        if (id === seq.current) setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [q, t]);

  const link = async (hit: Hit) => {
    const ok = await writer.run(`/api/console/company/registry`, {
      method: "POST",
      body: { registrationNo: hit.displayNo, useLegalName: useName && hit.name !== companyName },
      invalidates: ["/api/console", "/api/users"],
    });
    if (ok) { setQ(""); setHits(null); }
  };

  const unlink = async () => {
    await writer.run(`/api/console/company/registry`, { method: "DELETE", invalidates: ["/api/console"] });
  };

  if (registry) {
    const active = registry.status === "Registered";
    return (
      <div className="vck-card p-4 grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="vck-label">{t("linkedTitle")}</p>
            <p className="text-base font-semibold break-words">{registry.legalName}</p>
            <p className="vck-meta break-words">
              {registry.registrationNo}
              {registry.registeredOn ? ` · ${t("registeredOn", { date: registry.registeredOn })}` : ""}
            </p>
          </div>
          <span className="vck-state" data-tone={active ? "good" : "warn"}>
            <i aria-hidden="true" />
            {active ? t("statusActive") : registry.status}
          </span>
        </div>
        {registry.address && <p className="text-sm break-words">{registry.address}</p>}
        <p className="vck-meta">
          {t("source")}
          {registry.checkedAt ? ` · ${t("checked", { date: new Date(registry.checkedAt).toLocaleDateString() })}` : ""}
        </p>
        {writer.error && <p role="alert" className="text-sm text-destructive break-words">{writer.error}</p>}
        <div>
          <button type="button" className="vck-btn vck-btn-quiet" disabled={writer.busy} onClick={unlink}>
            {writer.busy ? t("working") : t("unlink")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vck-card p-4 grid gap-3">
      <div>
        <label className="vck-label block mb-1.5" htmlFor="registry-search">{t("title")}</label>
        <input
          id="registry-search"
          type="search"
          value={q}
          autoComplete="off"
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("placeholder")}
          className="w-full h-11 px-3 rounded-[0.375rem] border border-[var(--vc-rule)] bg-[var(--vc-well)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="vck-meta mt-1.5">{t("hint")}</p>
      </div>
      {searching && <p className="vck-meta" role="status">{t("searching")}</p>}
      {error && <p role="alert" className="text-sm text-destructive break-words">{error}</p>}
      {writer.error && <p role="alert" className="text-sm text-destructive break-words">{writer.error}</p>}
      {hits && !searching && hits.length === 0 && <p className="vck-meta">{t("none")}</p>}
      {hits && hits.length > 0 && (
        <>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={useName} onChange={(e) => setUseName(e.target.checked)} />
            <span>{t("useName")}</span>
          </label>
          <ul className="grid gap-2" aria-label={t("results")}>
            {hits.map((h) => (
              <li key={`${h.displayNo}-${h.name}`}>
                <button
                  type="button"
                  disabled={writer.busy}
                  onClick={() => link(h)}
                  className="w-full text-left rounded-[0.5rem] border border-[var(--vc-rule)] px-3 py-2.5 hover:bg-[var(--vc-well)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
                >
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <strong className="text-sm break-words min-w-0">{h.name}</strong>
                    <span className="vck-state" data-tone={h.active ? "good" : "warn"}>
                      <i aria-hidden="true" />
                      {h.active ? t("statusActive") : h.status}
                    </span>
                  </span>
                  <span className="vck-meta block mt-0.5 break-words">
                    {h.displayNo} · {h.typeLabel}
                    {h.registeredOn ? ` · ${t("registeredOn", { date: h.registeredOn })}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
