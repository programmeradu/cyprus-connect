/**
 * Structured server logging.
 *
 * One JSON line per event, so Cloudflare's log search can filter by `scope`,
 * `level` or `ref`. Errors get a short reference that the route returns to
 * the caller; a person reporting "ref 7f3a2c" leads straight to the line.
 * Secrets and personal data are never logged: known-sensitive keys are
 * redacted and error messages are cut to a bounded length.
 */

type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const SENSITIVE = /pass(word)?|secret|token|authorization|cookie|api[-_]?key|email|iban|card/i;
const MAX_STRING = 500;

export function redact(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (typeof value === "string") return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  if (typeof value !== "object") return value;
  if (depth > 4) return "[depth]";
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  const out: Fields = {};
  for (const [k, v] of Object.entries(value as Fields)) {
    out[k] = SENSITIVE.test(k) ? "[redacted]" : redact(v, depth + 1);
  }
  return out;
}

export function errorFields(error: unknown): Fields {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: redact(error.message),
      stack: error.stack?.split("\n").slice(0, 6).join("\n"),
    };
  }
  return { errorMessage: redact(String(error)) };
}

export function newRef(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function emit(level: Level, scope: string, message: string, fields?: Fields) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    scope,
    message,
    ...(fields ? (redact(fields) as Fields) : {}),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export interface Logger {
  debug(message: string, fields?: Fields): void;
  info(message: string, fields?: Fields): void;
  warn(message: string, fields?: Fields): void;
  /** Logs and returns a short reference to show the user. */
  error(message: string, error?: unknown, fields?: Fields): string;
}

export function logger(scope: string): Logger {
  return {
    debug: (m, f) => {
      if (process.env.NODE_ENV !== "production") emit("debug", scope, m, f);
    },
    info: (m, f) => emit("info", scope, m, f),
    warn: (m, f) => emit("warn", scope, m, f),
    error: (m, e, f) => {
      const ref = newRef();
      emit("error", scope, m, { ref, ...(e === undefined ? {} : errorFields(e)), ...f });
      return ref;
    },
  };
}
