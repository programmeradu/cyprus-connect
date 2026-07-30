"use client";

/**
 * The console rail. Slim, quiet, always shows where you are.
 * Collapses to a sheet under lg.
 */

import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  IcoGrid,
  IcoPulse,
  IcoAgents,
  IcoShield,
  IcoLeaf,
  IcoPlug,
  IcoDoc,
  IcoSpark,
  IcoGear,
  IcoMenu,
  IcoClose,
} from "./icons";

type Item = {
  href: string;
  label: string;
  icon: (p: { size?: number }) => React.ReactNode;
};

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Console",
    items: [
      { href: "/app", label: "Overview", icon: IcoGrid },
      { href: "/app/analytics", label: "Measure", icon: IcoPulse },
      { href: "/app/compliance", label: "Report", icon: IcoDoc },
      { href: "/app/actions", label: "Reduce", icon: IcoLeaf },
    ],
  },
  {
    title: "Autonomy",
    items: [
      { href: "/app/insights", label: "Agents", icon: IcoAgents },
      { href: "/app/integrations", label: "Connections", icon: IcoPlug },
      { href: "/app/studio", label: "Studio", icon: IcoSpark },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/app/billing", label: "Plan", icon: IcoShield },
      { href: "/app/settings", label: "Settings", icon: IcoGear },
    ],
  },
];

export const ConsoleRail = ({
  workspaceName,
  ownerName,
  ownerRole,
}: {
  workspaceName?: string;
  ownerName?: string;
  ownerRole?: string;
}) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const body = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span
          className="grid h-8 w-8 flex-none place-items-center rounded-[11px]"
          style={{ background: "var(--vc-lime)", color: "var(--vc-lime-ink)" }}
        >
          <IcoLeaf size={17} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-extrabold leading-tight tracking-[-0.2px]">
            {workspaceName ?? "Vuneli"}
          </span>
          <span className="block truncate text-[10px] font-semibold opacity-50">Cyprus workspace</span>
        </span>
      </div>

      <nav className="vc-scroll flex-1 overflow-y-auto px-2.5 pb-3">
        {GROUPS.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="px-2.5 pb-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.5px] opacity-40">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href as never}
                    data-active={active}
                    className="vc-railitem"
                    onClick={() => setOpen(false)}
                  >
                    <span className="opacity-70">{item.icon({ size: 16 })}</span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t px-3 py-3" style={{ borderColor: "var(--vc-rail-rule)" }}>
        <div className="mb-2.5 flex items-center gap-2.5">
          <span
            className="grid h-8 w-8 flex-none place-items-center rounded-full text-[12px] font-extrabold"
            style={{ background: "var(--vc-rail-active)" }}
          >
            {(ownerName ?? "V").slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[12px] font-bold leading-tight">
              {ownerName ?? "Signed in"}
            </span>
            <span className="block truncate text-[10px] font-semibold opacity-50">
              {ownerRole ?? "Workspace member"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* mobile bar */}
      <div
        className="vc-rail sticky top-0 z-40 flex items-center justify-between px-4 py-2.5 lg:hidden"
        style={{ borderRight: "none", borderBottom: "1px solid var(--vc-rail-rule)" }}
      >
        <span className="flex items-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center rounded-[10px]"
            style={{ background: "var(--vc-lime)", color: "var(--vc-lime-ink)" }}
          >
            <IcoLeaf size={15} />
          </span>
          <span className="text-[13px] font-extrabold">{workspaceName ?? "Vuneli"}</span>
        </span>
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
          className="vc-iconbtn"
          style={{ color: "var(--vc-ink-2)" }}
        >
          <IcoMenu size={16} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/45"
            onClick={() => setOpen(false)}
          />
          <div className="vc-rail absolute inset-y-0 left-0 w-[248px]">
            <button
              type="button"
              aria-label="Close navigation"
              className="vc-iconbtn absolute right-3 top-3"
              onClick={() => setOpen(false)}
              style={{ color: "var(--vc-ink-2)" }}
            >
              <IcoClose size={15} />
            </button>
            {body}
          </div>
        </div>
      )}

      <aside className="vc-rail fixed inset-y-0 left-0 z-30 hidden w-[212px] lg:block">{body}</aside>
    </>
  );
};
