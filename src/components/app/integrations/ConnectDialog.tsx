"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

type Locale = "en" | "el";

/**
 * Shared frame for "link an account" dialogs. It carries the console tokens
 * (the dialog renders outside the console tree), puts the real provider mark
 * in the header, and keeps the footer pinned while the list scrolls.
 */
export function ConnectDialog({
  open,
  onOpenChange,
  locale,
  title,
  description,
  provider,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
  title: string;
  description: string;
  provider: { name: string; light: string; dark: string; height: number };
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="vc vcm">
        <header className="vcm-head">
          <div className="vcm-head-row">
            <p className="vcm-by">
              <span>{locale === "el" ? "Σύνδεση μέσω" : "Connection by"}</span>
              <span className="vcm-by-mark">
                <img src={provider.light} alt={provider.name} data-mode="light" style={{ height: provider.height }} />
                <img src={provider.dark} alt="" aria-hidden="true" data-mode="dark" style={{ height: provider.height }} />
              </span>
            </p>
            <DialogClose className="vcm-close" aria-label={locale === "el" ? "Κλείσιμο" : "Close"}>
              <X aria-hidden="true" strokeWidth={1.75} />
            </DialogClose>
          </div>
          <DialogTitle className="vcm-title">{title}</DialogTitle>
          <DialogDescription className="vcm-desc">{description}</DialogDescription>
        </header>

        <div className="vcm-body">{children}</div>

        <footer className="vcm-foot">{footer}</footer>
      </DialogContent>
    </Dialog>
  );
}

/** Plain-language terms of the link: what is read, what is never possible. */
export function ConnectTerms({ label, rows }: { label: string; rows: Array<[string, string]> }) {
  return (
    <section className="vcm-terms" aria-label={label}>
      <h3 className="vcm-label">{label}</h3>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Light and dark cuts of a vendor mark, one shown per colour mode. */
export function DualMark({ light, dark, alt, height }: { light: string; dark: string; alt: string; height: number }) {
  return (
    <>
      <img src={light} alt={alt} data-mode="light" style={{ height }} />
      <img src={dark} alt="" aria-hidden="true" data-mode="dark" style={{ height }} />
    </>
  );
}
