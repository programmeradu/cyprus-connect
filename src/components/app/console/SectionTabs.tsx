"use client";

/**
 * Section tabs. Shown under the top bar on every page that belongs to
 * Measure, Act or Report, so the pages of one tab read as one place.
 */

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { bare, onPage, sectionFor } from "./nav-sections";

export function SectionTabs() {
  const path = bare(usePathname());
  const lang = useLocale() === "el" ? "el" : "en";
  const section = sectionFor(path);
  if (!section) return null;

  return (
    <div className="vck-section-nav">
      <nav className="vck-tabs-strip" aria-label={lang === "el" ? "Ενότητες" : "Sections"}>
        {section.pages.map((page) => {
          const active = onPage(path, page.href);
          return (
            <Link
              key={page.href}
              href={page.href as never}
              data-active={active}
              aria-current={active ? "page" : undefined}
            >
              {page.label[lang]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
