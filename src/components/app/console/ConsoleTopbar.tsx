"use client";

/**
 * Console top bar. Every control here does work: the navigation marks the
 * open route, the search opens a palette over live workspace records, the
 * bell opens the real approval queue and the avatar opens an account menu.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { VuneliWordmark } from "@/components/brand/VuneliWordmark";
import {
  IcoBell,
  IcoClose,
  IcoDoc,
  IcoGrid,
  IcoLeaf,
  IcoPlug,
  IcoPulse, IcoMeasure, IcoAct,
  IcoSearch,
  IcoVuneliAi,
} from "./icons";
import { ConsoleAvatar } from "./ConsoleAvatar";
import { navText, onPage, sectionFor } from "./nav-sections";
import { useLocale } from "next-intl";
import { useConsole } from "./ConsoleData";
import { daysUntil, relativeTime, type ConsoleOverviewData } from "./types";

export const NAV_ITEMS = [
  { href: "/app", label: "Home", icon: IcoGrid },
  { href: "/app/analytics", label: "Measure", icon: IcoMeasure, section: "measure" },
  { href: "/app/actions", label: "Act", icon: IcoAct, section: "act" },
  { href: "/app/compliance", label: "Report", icon: IcoDoc, section: "report" },
  { href: "/app/agents", label: "Agents", icon: IcoVuneliAi },
  { href: "/app/integrations", label: "Connect", icon: IcoPlug },
];

/**
 * The rest of the workspace. These routes exist and read live records, but
 * six items is the most the bar can hold without wrapping, so they open from
 * one menu instead of disappearing from the product.
 */
export const MORE_ITEMS = [
  { href: "/app/reports", label: "Deliverables", detail: "Every document an agent drafted" },
  { href: "/app/leaderboard", label: "Benchmarks", detail: "Compare with similar companies" },
];

/** A top tab is open on its own page and on every page of its section. */
export function navActive(item: { href: string; section?: string }, path: string): boolean {
  if (item.section) return sectionFor(path)?.key === item.section;
  return onPage(path, item.href);
}


interface Entry {
  href: string;
  group: string;
  title: string;
  detail: string;
}

/**
 * `data` is null while the workspace read is in flight. The bar still
 * renders: navigation must never disappear between pages.
 */
export function ConsoleTopbar({ data }: { data: ConsoleOverviewData | null }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const path = pathname.replace(/^\/(en|el)(?=\/|$)/, "") || "/";

  const [mounted, setMounted] = useState(false);
  const [palette, setPalette] = useState(false);
  const [queue, setQueue] = useState(false);
  const [account, setAccount] = useState(false);
  const [more, setMore] = useState(false);
  const [query, setQuery] = useState("");
  const field = useRef<HTMLInputElement>(null);
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /** Everything searchable is built from the loaded workspace records. */
  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [
      ...NAV_ITEMS.map((item) => ({
        href: item.href,
        group: "Go to",
        title: item.label,
        detail: item.href,
      })),
      ...MORE_ITEMS.map((item) => ({
        href: item.href,
        group: "Go to",
        title: item.label,
        detail: item.detail,
      })),
      {
        href: "/app/cbam",
        group: "Go to",
        title: "CBAM Declarations",
        detail: "Quarterly carbon border adjustment mechanism filings & goods",
      },
      {
        href: "/app/suppliers",
        group: "Go to",
        title: "Suppliers",
        detail: "Supply chain carbon accounting and EU sanctions screening",
      },
      {
        href: "/app/settings",
        group: "Go to",
        title: "Workspace Settings",
        detail: "Company profile, sector, sites and revenue facts",
      },
      {
        href: "/app/billing",
        group: "Go to",
        title: "Billing & Plan",
        detail: "Subscription tier, invoices and usage",
      },
      {
        href: "/app/calculator",
        group: "Go to",
        title: "Add Data & Footprint",
        detail: "Upload EAC bills, water bills, fuel receipts, invoices",
      },
    ];

    if (!data) return list;
    for (const task of data.tasks ?? []) {
      list.push({
        href: "/app#waiting",
        group: "Waiting for you",
        title: task.title,
        detail: `${task.kind} · ${task.detail ?? ""}`,
      });
    }
    for (const agent of data.agents) {
      list.push({ href: "/app/agents", group: "Agents", title: agent.name, detail: agent.role });
    }
    for (const obligation of data.obligations) {
      list.push({
        href: "/app/compliance",
        group: "Obligations",
        title: obligation.title,
        detail: `${obligation.framework} · due in ${daysUntil(obligation.dueDate)} days`,
      });
    }
    for (const connection of data.connections) {
      list.push({
        href: "/app/integrations",
        group: "Connections",
        title: connection.provider,
        detail: `${connection.category} · ${connection.status}`,
      });
    }
    for (const metric of data.metrics) {
      list.push({
        href: "/app/analytics",
        group: "Metrics",
        title: metric.label,
        detail: `${metric.category} · ${metric.unit}`,
      });
    }
    return list;
  }, [data]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.slice(0, 8);
    return entries
      .filter((e) => `${e.title} ${e.detail} ${e.group}`.toLowerCase().includes(q))
      .slice(0, 10);
  }, [entries, query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((open) => !open);
      }
      if (event.key === "Escape") {
        setPalette(false);
        setQueue(false);
        setAccount(false);
        setMore(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (palette) window.setTimeout(() => field.current?.focus(), 20);
  }, [palette]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (bar.current && !bar.current.contains(event.target as Node)) {
        setQueue(false);
        setAccount(false);
        setMore(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const { refresh } = useConsole();
  const [deciding, setDeciding] = useState<number | null>(null);
  const [decided, setDecided] = useState<Set<number>>(() => new Set());
  const [decideError, setDecideError] = useState<{ id: number; message: string } | null>(null);

  const decide = async (id: number, decision: "approve" | "reject") => {
    setDeciding(id);
    setDecideError(null);
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/console/tasks/${id}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ decision }),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(body?.error ?? "The decision was not saved. Try again.");
      setDecided((prev) => new Set(prev).add(id));
      refresh();
      if (decision === "reject") {
        toast.info(locale === "el" ? "Το στοιχείο απορρίφθηκε από την ουρά." : "Item dismissed from queue.");
      } else {
        toast.success(locale === "el" ? "Το στοιχείο εγκρίθηκε." : "Item approved.");
      }
    } catch (err) {
      setDecideError({ id, message: err instanceof Error ? err.message : "The decision was not saved." });
    } finally {
      setDeciding(null);
    }
  };

  const tasks = (data?.tasks ?? []).filter((task) => !decided.has(task.id));
  const workspace = data?.workspace ?? null;
  const avatarSeed = workspace?.ownerName ?? workspace?.name ?? "Vuneli";
  const open = (href: string) => {
    setPalette(false);
    if (href.startsWith("/app#")) {
      router.push("/app" as never);
      if (typeof window !== "undefined") {
        const hash = href.split("#")[1];
        window.setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: "smooth" });
          else window.location.hash = hash;
        }, 60);
      }
      return;
    }
    router.push(href as never);
  };
  const moreActive = MORE_ITEMS.some((item) => onPage(path, item.href));

  return (
    <header className="vc-nav" ref={bar} data-tour="nav">
      <Link href={"/app" as never} className="vc-brand flex items-center text-foreground transition-opacity hover:opacity-90" aria-label="Vuneli console home">
        <VuneliWordmark className="block h-5 w-auto sm:h-5.5" />
      </Link>

      <nav className="vc-mainnav" aria-label="Workspace navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = navActive(item, path);
          return (
            <Link
              key={item.href}
              href={item.href as never}
              data-active={active}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={13} />
              <span>{navText(item.label, locale)}</span>
            </Link>
          );
        })}

        <div className="vc-pop-anchor vc-navmore">
          <button
            type="button"
            data-active={moreActive || more}
            aria-expanded={more}
            aria-haspopup="menu"
            onClick={() => {
              setMore((v) => !v);
              setQueue(false);
              setAccount(false);
            }}
          >
            <span>{navText("More", locale)}</span>
            <i aria-hidden="true">▾</i>
          </button>

          {more && (
            <div className="vc-pop vc-pop-menu" role="menu" aria-label="More of the workspace">
              {MORE_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as never}
                  role="menuitem"
                  data-active={onPage(path, item.href)}
                  onClick={(e) => {
                    e.preventDefault();
                    setMore(false);
                    router.push(item.href as never);
                  }}
                >
                  <strong>{navText(item.label, locale)}</strong>
                  <span>{navText(item.detail, locale)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>


      <div className="vc-actions">
        <ThemeToggle />
        <LanguageSwitcher />

        <button
          type="button"
          className="vc-iconbtn"
          aria-label={navText("Search the workspace", locale)}
          aria-expanded={palette}
          onClick={() => setPalette(true)}
        >
          <IcoSearch size={14} />
        </button>

        <div className="vc-pop-anchor">
          <button
            type="button"
            className="vc-iconbtn vc-notify"
            data-alert={tasks.length > 0}
            aria-label={
              tasks.length === 0
                ? (locale === "el" ? "Ουρά εγκρίσεων, καμία εκκρεμότητα" : "Approval queue, nothing waiting")
                : (locale === "el" ? `Ουρά εγκρίσεων, ${tasks.length} εκκρεμούν` : `Approval queue, ${tasks.length} waiting`)
            }
            aria-expanded={queue}
            onClick={() => {
              setQueue((v) => !v);
              setAccount(false);
            }}
          >
            <IcoBell size={15} />
            {tasks.length > 0 && (
              <span aria-hidden="true" data-wide={tasks.length > 9}>
                {tasks.length > 9 ? "9+" : tasks.length}
              </span>
            )}
          </button>

          {queue && (
            <div className="vc-pop vc-pop-queue" role="dialog" aria-label={navText("Approval queue", locale)}>
              <header>
                <span className="vc-pop-title">
                  <strong>{locale === "el" ? "Αναμονή έγκρισης" : "Waiting on a person"}</strong>
                  <b className="vc-pop-count" data-empty={tasks.length === 0}>
                    {tasks.length}
                  </b>
                </span>
                <button type="button" onClick={() => setQueue(false)} aria-label={locale === "el" ? "Κλείσιμο ουράς" : "Close queue"}>
                  <IcoClose size={13} />
                </button>
              </header>
              {tasks.length === 0 ? (
                <p className="vc-pop-empty">{navText("The queue is clear. Agents have nothing to escalate.", locale)}</p>
              ) : (
                <>
                  <ul>
                    {tasks.slice(0, 6).map((task) => (
                      <li key={task.id} data-severity={task.severity}>
                        <i aria-hidden="true" className="vc-pop-dot" />
                        <strong>{task.title}</strong>
                        <span>{task.detail}</span>
                        <em>
                          {task.kind} · raised {relativeTime(task.createdAt, locale)}
                        </em>
                        <div className="vc-pop-actions">
                          <button
                            type="button"
                            data-kind="approve"
                            disabled={deciding !== null}
                            onClick={() => decide(task.id, "approve")}
                            aria-label={`${task.kind === "evidence" ? "Mark done" : "Approve"}: ${task.title}`}
                          >
                            {deciding === task.id ? "Saving…" : task.kind === "evidence" ? "Mark done" : "Approve"}
                          </button>
                          <button
                            type="button"
                            disabled={deciding !== null}
                            onClick={() => decide(task.id, "reject")}
                            aria-label={`${task.kind === "evidence" ? "Dismiss" : "Reject"}: ${task.title}`}
                          >
                            {task.kind === "evidence" ? "Dismiss" : "Reject"}
                          </button>
                        </div>
                        {decideError?.id === task.id && (
                          <p className="vc-pop-error" role="alert">{decideError.message}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                  {tasks.length > 6 && (
                    <p className="vc-pop-more">{tasks.length - 6} {navText("more in the queue", locale)}</p>
                  )}
                </>
              )}
              <Link href={"/app/agents#waiting-queue" as never} className="vc-pop-cta" onClick={() => setQueue(false)}>
                {navText("Open the full queue", locale)}
              </Link>
            </div>
          )}
        </div>


        <div className="vc-pop-anchor">
          <button
            type="button"
            className="vc-avatar"
            aria-label={navText("Account menu", locale)}
            aria-expanded={account}
            onClick={() => {
              setAccount((v) => !v);
              setQueue(false);
            }}
          >
            <ConsoleAvatar seed={avatarSeed} size={26} alt="" />
          </button>

          {account && (
            <div className="vc-pop vc-pop-narrow" role="menu" aria-label={navText("Account menu", locale)}>
              <header className="vc-pop-identity">
                <ConsoleAvatar seed={avatarSeed} size={30} alt="" />
                <strong>{workspace?.ownerName ?? navText("Signed in", locale)}</strong>
              </header>
              <p className="vc-pop-empty">
                {workspace ? `${workspace.name} · ${workspace.sector.charAt(0).toUpperCase()}${workspace.sector.slice(1)} · ${workspace.sites} ${workspace.sites === 1 ? "site" : "sites"}` : navText("Loading the workspace", locale)}
              </p>
              <Link href={"/app/settings" as never} role="menuitem" onClick={() => setAccount(false)}>
                {navText("Workspace settings", locale)}
              </Link>
              <Link href={"/app?tour=1" as never} role="menuitem" onClick={() => setAccount(false)}>
                {navText("Replay the Home tour", locale)}
              </Link>
              <Link href={"/app/billing" as never} role="menuitem" onClick={() => setAccount(false)}>
                {navText("Plan and usage", locale)}
              </Link>
              <Link href={"/" as never} role="menuitem" onClick={() => setAccount(false)}>
                {navText("Leave the console", locale)}
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={async () => {
                  setAccount(false);
                  await authClient.signOut().catch(() => {});
                  window.location.href = `/${locale}/auth`;
                }}
              >
                {navText("Sign out", locale)}
              </button>
            </div>
          )}
        </div>
      </div>

      {palette && mounted && typeof document !== "undefined" && createPortal(
        <div className="vc-palette-scrim" role="presentation" onClick={() => setPalette(false)}>
          <div
            className="vc-palette"
            role="dialog"
            aria-label={navText("Search the workspace", locale)}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="vc-palette-field">
              <IcoSearch size={15} />
              <input
                ref={field}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={navText("Search agents, obligations, connections, metrics, suppliers", locale)}
                aria-label={navText("Search the workspace", locale)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && results[0]) open(results[0].href);
                }}
              />
              <kbd>esc</kbd>
            </div>
            {results.length === 0 ? (
              <p className="vc-pop-empty">No record matches that text.</p>
            ) : (
              <ul>
                {results.map((entry, index) => (
                  <li key={`${entry.href}-${entry.title}-${index}`}>
                    <button type="button" onClick={() => open(entry.href)}>
                      <span>{entry.group}</span>
                      <strong>{entry.title}</strong>
                      <em>{entry.detail}</em>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
