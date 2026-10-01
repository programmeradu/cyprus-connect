/**
 * Agent run notes in plain words. Models write markdown, internal fact keys
 * ("key **cbam_supplier_contacts_found**") and section labels; people only
 * need what was found and what is waiting. Pure, so it is tested directly.
 */

const SECTION = /\b(What I found|What I recorded|What['’]s waiting|What is waiting|Summary|Next steps?)\s*:\s*/gi;
const RUN_LABEL = /^Run #\d+$/;

/** Markdown, internal keys and section labels removed; sentences kept whole. */
export function plainText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\(\s*(fact\s+)?key\s+[^)]*\)/gi, " ")
    .replace(/\b(fact\s+)?key\s+\*{0,2}`?[a-z0-9]+(?:_[a-z0-9]+)+`?\*{0,2}/gi, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/^\s*(?:[*\-•]|\d+[.)])\s+/gm, "")
    .replace(/\s+[*\-•]\s+/g, " ")
    .replace(/^#+\s*/gm, "")
    .replace(SECTION, "")
    .replace(/\b[a-z]+(?:_[a-z0-9]+)+\b/g, (m) => m.replace(/_/g, " "))
    .replace(/\s*(Everything read and recorded|Partial work) is in the step ledger\.?/gi, "")
    .replace(/\bI (also )?recorded (this|that|a|the) (fact|finding)( for other agents)?\.?/gi, "")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** The first sentences that fit in `max` characters, never cut mid-sentence unless one sentence is longer. */
export function shortSummary(text: string | null | undefined, max = 200): string {
  const plain = plainText(text);
  if (plain.length <= max) return plain;
  const sentences = plain.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [plain];
  let out = "";
  for (const s of sentences) {
    if ((out + s).trim().length > max) break;
    out += s;
  }
  out = out.trim();
  if (out) return out;
  const cut = plain.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6)).trim()}…`;
}

/** "Run #51" is an internal number; the run is described by its summary. */
export function isRunLabel(object: string | null | undefined): boolean {
  return Boolean(object && RUN_LABEL.test(object.trim()));
}
