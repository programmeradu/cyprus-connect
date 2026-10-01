/**
 * Search-result descriptions read best between ~110 and 158 characters.
 * Long text is cut at the last full sentence that fits (else the last whole
 * word plus an ellipsis); short text gets a plain closing line so the
 * snippet is never thin. Used by every public page's metadata.
 */
const MAX = 158;
const MIN = 110;

const PAD: Record<string, string> = {
  en: "A practical Vuneli guide for small businesses in Cyprus and the EU.",
  el: "Πρακτικός οδηγός Vuneli για μικρές επιχειρήσεις στην Κύπρο και την ΕΕ.",
};

export function seoDescription(text: string, locale: string = "en", pad?: string): string {
  let t = text.replace(/\s+/g, " ").trim();
  if (t.length > MAX) {
    const head = t.slice(0, MAX);
    const lastStop = Math.max(head.lastIndexOf(". "), head.lastIndexOf("; "), head.endsWith(".") ? head.length - 1 : -1);
    if (lastStop >= MIN - 20) {
      t = head.slice(0, lastStop + 1);
    } else {
      const cut = head.slice(0, MAX - 1);
      t = `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\-–—]+$/, "")}…`;
    }
  }
  if (t.length < MIN) {
    const extra = pad ?? PAD[locale === "el" ? "el" : "en"];
    const joined = `${/[.!?…]$/.test(t) ? t : `${t}.`} ${extra}`;
    if (joined.length <= MAX) t = joined;
  }
  return t;
}
