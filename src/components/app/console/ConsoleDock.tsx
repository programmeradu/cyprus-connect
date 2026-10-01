"use client";

/**
 * Mobile dock.
 *
 * On a phone the workspace navigation moves off the top bar and into a
 * floating glass dock at the bottom of the screen, the way the concept
 * shows it. The dock holds the five surfaces a person opens most; the sixth
 * button opens the rest of the workspace in a sheet.
 */

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { IcoClose, IcoGrid, IcoDoc, IcoLeaf, IcoPulse, IcoVuneliAi, IcoMenu } from "./icons";
import { MORE_ITEMS, navActive } from "./ConsoleTopbar";
import { navText, onPage } from "./nav-sections";
import { useLocale } from "next-intl";

const DOCK_ITEMS = [
  { href: "/app", label: "Home", icon: IcoGrid },
  { href: "/app/analytics", label: "Measure", icon: IcoPulse, section: "measure" },
  { href: "/app/actions", label: "Act", icon: IcoLeaf, section: "act" },
  { href: "/app/compliance", label: "Report", icon: IcoDoc, section: "report" },
  { href: "/app/agents", label: "Agents", icon: IcoVuneliAi },
];

const SHEET_ITEMS = [
  { href: "/app/integrations", label: "Connect", detail: "Data sources and tariffs" },
  ...MORE_ITEMS,
];

export function ConsoleDock() {
  const locale = useLocale();
  const pathname = usePathname();
  const path = pathname.replace(/^\/(en|el)(?=\/|$)/, "") || "/";
  const [sheet, setSheet] = useState(false);

  // The sheet must never survive a route change.
  useEffect(() => {
    setSheet(false);
  }, [path]);

  // A phone keyboard or a background scroll behind the sheet reads as broken.
  useEffect(() => {
    if (!sheet) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheet]);

  const sheetActive = SHEET_ITEMS.some((item) => onPage(path, item.href));

  return (
    <>
      {sheet && (
        <div className="vc-sheet-scrim" role="presentation" onClick={() => setSheet(false)}>
          <div
            className="vc-sheet"
            role="dialog"
            aria-label="More of the workspace"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <span>{navText("All of the workspace", locale)}</span>
              <button type="button" onClick={() => setSheet(false)} aria-label="Close the menu">
                <IcoClose size={14} />
              </button>
            </header>
            <ul>
              {SHEET_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href as never}
                    data-active={onPage(path, item.href)}
                    onClick={() => setSheet(false)}
                  >
                    <strong>{navText(item.label, locale)}</strong>
                    <span>{navText(item.detail, locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <nav className="vc-dock" aria-label="Workspace navigation">
        {DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = navActive(item, path);
          return (
            <Link
              key={item.href}
              href={item.href as never}
              data-active={active}
              aria-current={active ? "page" : undefined}
              aria-label={navText(item.label, locale)}
            >
              <Icon size={16} />
              <em>{navText(item.label, locale)}</em>
            </Link>
          );
        })}

        <button
          type="button"
          data-active={sheetActive || sheet}
          aria-expanded={sheet}
          aria-label="More of the workspace"
          onClick={() => setSheet((v) => !v)}
        >
          <IcoMenu size={16} />
          <em>More</em>
        </button>
      </nav>
    </>
  );
}
