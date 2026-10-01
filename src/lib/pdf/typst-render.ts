/**
 * Typst typesetting in the browser. Templates, artwork and fonts are static
 * files under /pdf-typst and /fonts/pdf/typst; the compiler (WebAssembly,
 * ~7 MB compressed) is fetched once on the first download and then reused.
 *
 * Every document is: one template + one data.json + a QR code for the
 * public check page. The template never computes figures; it prints the
 * data it is given, so the fingerprint covers exactly what is on paper.
 */

import QRCode from "qrcode";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler@0.6.0/pkg/typst_ts_web_compiler_bg.wasm";

const FONT_FILES = [
  "IBMPlexSans-400", "IBMPlexSans-400i", "IBMPlexSans-500", "IBMPlexSans-500i",
  "IBMPlexSans-600", "IBMPlexSans-600i", "IBMPlexSans-700", "IBMPlexSans-700i",
  "SourceSerif4-400", "SourceSerif4-400i", "SourceSerif4-600", "SourceSerif4-600i",
  "SourceSerif4-700", "SourceSerif4-700i", "IBMPlexMono-400",
];

/** Static files every template may reference by bare name. */
const SHARED_ASSETS = ["logo.svg", "logo-white.svg", "contours-soft.png", "contours-ondark.png"];

export type TypstTemplate = "board.typ" | "report.typ" | "cbam.typ";

type Compiler = Awaited<ReturnType<typeof makeCompiler>>;
let compilerPromise: Promise<Compiler> | null = null;

async function makeCompiler(base: string, wasm?: Uint8Array | ArrayBuffer) {
  // Sub-path imports: the package root also pulls in the renderer, which we do not use.
  const { createTypstCompiler } = await import("@myriaddreamin/typst.ts/compiler");
  const { preloadRemoteFonts, disableDefaultFontAssets } = await import("@myriaddreamin/typst.ts/dist/esm/options.init.mjs");
  const compiler = createTypstCompiler();
  const fonts = await Promise.all(
    FONT_FILES.map(async (f) => new Uint8Array(await (await fetchOk(`${base}/fonts/pdf/typst/${f}.ttf`)).arrayBuffer())),
  );
  await compiler.init({
    getModule: () => wasm ?? WASM_URL,
    beforeBuild: [disableDefaultFontAssets(), preloadRemoteFonts(fonts)],
  });
  const enc = new TextEncoder();
  const assets = new Map<string, Uint8Array>();
  for (const name of [...SHARED_ASSETS, "board.typ", "report.typ", "cbam.typ"]) {
    assets.set(name, new Uint8Array(await (await fetchOk(`${base}/pdf-typst/${name}`)).arrayBuffer()));
  }
  for (const [name, bytes] of assets) {
    if (name.endsWith(".typ")) compiler.addSource(`/${name}`, new TextDecoder().decode(bytes));
    else compiler.mapShadow(`/${name}`, bytes);
  }
  return { compiler, enc };
}

async function fetchOk(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Could not load ${url} (${r.status})`);
  return r;
}

export const verifyUrl = (hash: string) => `https://vuneli.com/verify/${hash.slice(0, 16)}`;

/**
 * Compile `template` with `data` to PDF bytes. `base` is where static files
 * are served from (the site origin in the browser, a file server in tests).
 */
export async function renderTypst(template: TypstTemplate, data: Record<string, unknown> & { hash: string }, opts: { base: string; wasm?: Uint8Array | ArrayBuffer }) {
  compilerPromise ??= makeCompiler(opts.base, opts.wasm).catch((e) => {
    compilerPromise = null;
    throw e;
  });
  const { compiler, enc } = await compilerPromise;
  const qr = await QRCode.toString(verifyUrl(data.hash), { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#16201A", light: "#0000" } });
  compiler.mapShadow("/data.json", enc.encode(JSON.stringify(data)));
  compiler.mapShadow("/qr.svg", enc.encode(qr));
  const out = await compiler.compile({ mainFilePath: `/${template}`, format: "pdf", diagnostics: "full" });
  if (!out.result) {
    const msg = (out.diagnostics ?? []).map((d) => (typeof d === "string" ? d : JSON.stringify(d))).join("\n");
    throw new Error(`PDF layout failed: ${msg.slice(0, 600)}`);
  }
  return out.result;
}

/** Hand PDF bytes to the user as a download. */
export function downloadBytes(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.replace(/[^\w.\-]+/g, "-");
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export const siteBase = () => (typeof window === "undefined" ? "" : window.location.origin);
