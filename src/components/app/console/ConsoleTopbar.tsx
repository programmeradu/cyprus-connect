"use client";

/**
 * Console top bar. Every control here does work: the navigation marks the
 * open route, the search opens a palette over live workspace records, the
 * bell opens the real approval queue and the avatar opens an account menu.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  IcoBell,
  IcoClose,
  IcoDoc,
  IcoGrid,
  IcoLeaf,
  IcoPlug,
  IcoPulse,
  IcoSearch,
  IcoSpark,
} from "./icons";
import { ConsoleAvatar } from "./ConsoleAvatar";
import { daysUntil, relativeTime, type ConsoleOverviewData } from "./types";

export const NAV_ITEMS = [
  { href: "/app", label: "Home", icon: IcoGrid },
  { href: "/app/analytics", label: "Measure", icon: IcoPulse },
  { href: "/app/compliance", label: "Report", icon: IcoDoc },
  { href: "/app/actions", label: "Reduce", icon: IcoLeaf },
  { href: "/app/insights", label: "Agents", icon: IcoSpark },
  { href: "/app/integrations", label: "Connect", icon: IcoPlug },
];

/**
 * The rest of the workspace. These routes exist and read live records, but
 * six items is the most the bar can hold without wrapping, so they open from
 * one menu instead of disappearing from the product.
 */
export const MORE_ITEMS = [
  { href: "/app/studio", label: "Studio", detail: "Draft disclosures and briefs" },
  { href: "/app/learn", label: "Learn", detail: "Courses and guidance" },
  { href: "/app/marketplace", label: "Marketplace", detail: "Consultants, providers and offsets" },
  { href: "/app/calculator", label: "Calculator", detail: "Manual emission entries" },
  { href: "/app/grant-alerts", label: "Grant alerts", detail: "EU and Cyprus funding" },
  { href: "/app/leaderboard", label: "Benchmarks", detail: "Sector comparison" },
  { href: "/app/billing", label: "Plan and usage", detail: "Subscription and credits" },
  { href: "/app/settings", label: "Settings", detail: "Workspace and profile" },
];


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
  const pathname = usePathname();
  const router = useRouter();
  const path = pathname.replace(/^\/(en|el)(?=\/|$)/, "") || "/";

  const [palette, setPalette] = useState(false);
  const [queue, setQueue] = useState(false);
  const [account, setAccount] = useState(false);
  const [more, setMore] = useState(false);
  const [query, setQuery] = useState("");
  const field = useRef<HTMLInputElement>(null);
  const bar = useRef<HTMLElement>(null);

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
    ];

    if (!data) return list;
    for (const agent of data.agents) {
      list.push({ href: "/app/insights", group: "Agents", title: agent.name, detail: agent.role });
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

  const tasks = data?.tasks ?? [];
  const workspace = data?.workspace ?? null;
  const avatarSeed = workspace?.ownerName ?? workspace?.name ?? "Vuneli";
  const open = (href: string) => {
    setPalette(false);
    router.push(href as never);
  };
  const moreActive = MORE_ITEMS.some((item) => path.startsWith(item.href));

  return (
    <header className="vc-nav" ref={bar}>
      <Link href={"/app" as never} className="vc-brand" aria-label="Vuneli console home">
        Vuneli
      </Link>

      <nav className="vc-mainnav" aria-label="Workspace navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/app" ? path === "/app" : path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href as never}
              data-active={active}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={13} />
              <span>{item.label}</span>
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
            <span>More</span>
            <i aria-hidden="true">▾</i>
          </button>

          {more && (
            <div className="vc-pop vc-pop-menu" role="menu" aria-label="More of the workspace">
              {MORE_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href as never}
                  role="menuitem"
                  data-active={path.startsWith(item.href)}
                  onClick={() => setMore(false)}
                >
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
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
          aria-label="Search the workspace"
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
                ? "Approval queue, nothing waiting"
                : `Approval queue, ${tasks.length} waiting`
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
            <div className="vc-pop vc-pop-queue" role="dialog" aria-label="Approval queue">
              <header>
                <span className="vc-pop-title">
                  <strong>Waiting on a person</strong>
                  <b className="vc-pop-count" data-empty={tasks.length === 0}>
                    {tasks.length}
                  </b>
                </span>
                <button type="button" onClick={() => setQueue(false)} aria-label="Close queue">
                  <IcoClose size={13} />
                </button>
              </header>
              {tasks.length === 0 ? (
                <p className="vc-pop-empty">The queue is clear. Agents have nothing to escalate.</p>
              ) : (
                <>
                  <ul>
                    {tasks.slice(0, 6).map((task) => (
                      <li key={task.id} data-severity={task.severity}>
                        <i aria-hidden="true" className="vc-pop-dot" />
                        <strong>{task.title}</strong>
                        <span>{task.detail}</span>
                        <em>
                          {task.kind} · raised {relativeTime(task.createdAt)}
                        </em>
                      </li>
                    ))}
                  </ul>
                  {tasks.length > 6 && (
                    <p className="vc-pop-more">{tasks.length - 6} more in the queue</p>
                  )}
                </>
              )}
              <Link href={"/app/compliance" as never} className="vc-pop-cta" onClick={() => setQueue(false)}>
                Open the full queue
              </Link>
            </div>
          )}
        </div>


        <div className="vc-pop-anchor">
          <button
            type="button"
            className="vc-avatar"
            aria-label="Account menu"
            aria-expanded={account}
            onClick={() => {
              setAccount((v) => !v);
              setQueue(false);
            }}
          >
            <ConsoleAvatar seed={avatarSeed} size={26} alt="" />
          </button>

          {account && (
            <div className="vc-pop vc-pop-narrow" role="menu" aria-label="Account">
              <header className="vc-pop-identity">
                <ConsoleAvatar seed={avatarSeed} size={30} alt="" />
                <strong>{workspace?.ownerName ?? "Signed in"}</strong>
              </header>
              <p className="vc-pop-empty">
                {workspace ? `${workspace.name} · ${workspace.sector} · ${workspace.sites} sites` : "Loading the workspace"}
              </p>
              <Link href={"/app/settings" as never} role="menuitem" onClick={() => setAccount(false)}>
                Workspace settings
              </Link>
              <Link href={"/app/billing" as never} role="menuitem" onClick={() => setAccount(false)}>
                Plan and usage
              </Link>
              <Link href={"/" as never} role="menuitem" onClick={() => setAccount(false)}>
                Leave the console
              </Link>
            </div>
          )}
        </div>
      </div>

      {palette && (
        <div className="vc-palette-scrim" role="presentation" onClick={() => setPalette(false)}>
          <div
            className="vc-palette"
            role="dialog"
            aria-label="Search the workspace"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="vc-palette-field">
              <IcoSearch size={15} />
              <input
                ref={field}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search agents, obligations, connections, metrics"
                aria-label="Search the workspace"
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
        </div>
      )}
    </header>
  );
}
