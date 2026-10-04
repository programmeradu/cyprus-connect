import type { PdfSection } from "./report";

/** Turns a drafted markdown report into the sections the designed report PDF expects. */
export function markdownToSections(md: string): { summary: string | null; sections: PdfSection[] } {
  const clean = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/(^|\s)\*(.+?)\*/g, "$1$2")
      .replace(/^\s*[-*]\s+/gm, "• ")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  const sections: PdfSection[] = [];
  const intro: string[] = [];
  let current: { title: string; lines: string[] } | null = null;
  for (const line of md.split(/\r?\n/)) {
    const h = line.match(/^#{1,3}\s+(.+)$/) ?? line.match(/^\*\*(\d+\.\s.+?)\*\*\s*$/);
    if (h) {
      if (current) sections.push({ code: "", title: clean(current.title), body: clean(current.lines.join("\n")), figures: [], gaps: [] });
      current = { title: h[1].replace(/^\d+[.)]\s*/, ""), lines: [] };
    } else (current ? current.lines : intro).push(line);
  }
  if (current) sections.push({ code: "", title: clean(current.title), body: clean(current.lines.join("\n")), figures: [], gaps: [] });
  const summary = clean(intro.join("\n")) || null;
  if (sections.length === 0) return { summary: null, sections: [{ code: "", title: "Report", body: summary ?? "", figures: [], gaps: [] }] };
  return { summary, sections: sections.filter((s) => s.title || s.body) };
}
