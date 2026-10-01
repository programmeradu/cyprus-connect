import type { ReactElement } from "react";
import { pdf, type DocumentProps } from "@react-pdf/renderer";

/** Render a document in the browser and hand it to the user as a download. */
export async function savePdf(doc: ReactElement<DocumentProps>, fileName: string) {
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.replace(/[^\w.\-]+/g, "-");
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export const assetBase = () => (typeof window === "undefined" ? "" : window.location.origin);
