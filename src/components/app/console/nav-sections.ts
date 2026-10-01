/**
 * The workspace map. One list feeds the top bar, the phone dock and the
 * section tabs, so a page can never be in one menu and missing from another.
 *
 * Measure, Act and Report each group several pages under one tab. The pages
 * keep their own address; the section tabs move between them.
 */

export interface SectionPage {
  href: string;
  label: { en: string; el: string };
}

export interface Section {
  key: "measure" | "act" | "report";
  pages: SectionPage[];
}

export const SECTIONS: Section[] = [
  {
    key: "measure",
    pages: [
      { href: "/app/analytics", label: { en: "Footprint", el: "Αποτύπωμα" } },
      { href: "/app/calculator", label: { en: "Add data", el: "Προσθήκη δεδομένων" } },
    ],
  },
  {
    key: "act",
    pages: [
      { href: "/app/actions", label: { en: "Action plan", el: "Σχέδιο δράσης" } },
      { href: "/app/suppliers", label: { en: "Suppliers", el: "Προμηθευτές" } },
      { href: "/app/marketplace", label: { en: "Experts and offsets", el: "Ειδικοί και αντισταθμίσεις" } },
    ],
  },
  {
    key: "report",
    pages: [
      { href: "/app/compliance", label: { en: "Deadlines", el: "Προθεσμίες" } },
      { href: "/app/cbam", label: { en: "CBAM", el: "CBAM" } },
      { href: "/app/studio", label: { en: "Drafting studio", el: "Στούντιο συντάκτη" } },
    ],
  },
];

/** True when `path` is `href` or a page below it. */
export function onPage(path: string, href: string): boolean {
  if (href === "/app") return path === "/app";
  return path === href || path.startsWith(href + "/");
}

export function sectionFor(path: string): Section | null {
  return SECTIONS.find((s) => s.pages.some((p) => onPage(path, p.href))) ?? null;
}

/** Strip the locale prefix the i18n router keeps on the path. */
export function bare(pathname: string): string {
  return pathname.replace(/^\/(en|el)(?=\/|$)/, "") || "/";
}

/** Greek labels for the workspace navigation; English is the source text. */
const NAV_EL: Record<string, string> = {
  Home: "Αρχική",
  Measure: "Μέτρηση",
  Act: "Δράση",
  Report: "Αναφορές",
  Agents: "Πράκτορες",
  Connect: "Σύνδεση",
  More: "Περισσότερα",
  Deliverables: "Παραδοτέα",
  Benchmarks: "Συγκρίσεις",
  "Every document an agent drafted": "Κάθε έγγραφο που συνέταξε ένας πράκτορας",
  "Compare with similar companies": "Σύγκριση με παρόμοιες εταιρείες",
  "Data sources and tariffs": "Πηγές δεδομένων και τιμολόγια",
  "All of the workspace": "Όλος ο χώρος εργασίας",
};

export const navText = (text: string, locale: string) =>
  locale === "el" ? NAV_EL[text] ?? text : text;
