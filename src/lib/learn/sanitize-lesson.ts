import sanitizeHtml from "sanitize-html";

/**
 * Lesson text is written by an AI model and shown as HTML, so it is cleaned
 * both when saved and when read (older rows were saved before this existed).
 * Only reading markup survives: headings, paragraphs, lists, emphasis, tables,
 * links (https/mailto, opened safely) and https images. No scripts, styles,
 * event handlers or iframes.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h2", "h3", "h4", "p", "br", "hr", "ul", "ol", "li", "strong", "b", "em", "i", "u",
    "blockquote", "code", "pre", "table", "thead", "tbody", "tr", "th", "td", "a", "img", "figure", "figcaption",
  ],
  allowedAttributes: {
    a: ["href", "title"],
    img: ["src", "alt", "width", "height", "loading"],
    th: ["scope"],
  },
  allowedSchemes: ["https", "mailto"],
  allowedSchemesByTag: { img: ["https", "data"] },
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer nofollow" }),
    img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }),
  },
};

export function sanitizeLessonHtml(html: unknown): string {
  if (typeof html !== "string" || !html) return "";
  return sanitizeHtml(html, OPTIONS);
}

/** Cleans every HTML-bearing field of a lesson's content object. */
export function sanitizeLessonContent<T>(content: T): T {
  if (!content || typeof content !== "object") return content;
  const out: Record<string, unknown> = { ...(content as Record<string, unknown>) };
  for (const key of ["text", "instructions", "body"]) {
    if (typeof out[key] === "string") out[key] = sanitizeLessonHtml(out[key]);
  }
  return out as T;
}
