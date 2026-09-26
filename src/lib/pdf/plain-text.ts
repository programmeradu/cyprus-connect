/**
 * The built-in PDF fonts hold Latin-1 only. Subscripts, dashes and quotes
 * outside that set print as boxes, so they are swapped for plain text.
 * Greek has no Latin-1 form; it is transliterated so a name stays readable
 * instead of vanishing.
 */

const SWAP: Record<string, string> = {
  "\u2080": "0", "\u2081": "1", "\u2082": "2", "\u2083": "3", "\u2084": "4",
  "\u2085": "5", "\u2086": "6", "\u2087": "7", "\u2088": "8", "\u2089": "9",
  "\u2070": "0", "\u00b9": "1", "\u00b2": "2", "\u00b3": "3", "\u2074": "4",
  "\u2013": "-", "\u2014": "-", "\u2212": "-", "\u2011": "-",
  "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
  "\u2026": "...", "\u00a0": " ", "\u2192": "->", "\u00b7": "-", "\u20ac": "EUR",
};

const GREEK: Record<string, string> = {
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m",
  ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps", ω: "o",
  ά: "a", έ: "e", ή: "i", ί: "i", ό: "o", ύ: "y", ώ: "o", ϊ: "i", ϋ: "y", ΐ: "i", ΰ: "y",
};

function greek(ch: string): string | null {
  const lower = ch.toLowerCase();
  const t = GREEK[lower];
  if (!t) return null;
  return ch === lower ? t : t.charAt(0).toUpperCase() + t.slice(1);
}

export function plainPdfText(value: string): string {
  let out = "";
  for (const ch of value) {
    if (SWAP[ch] !== undefined) out += SWAP[ch];
    else if (/[\x20-\x7E\u00A1-\u00FF\n]/.test(ch)) out += ch;
    else out += greek(ch) ?? "";
  }
  return out;
}
