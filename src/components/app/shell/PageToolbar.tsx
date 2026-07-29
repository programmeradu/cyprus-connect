"use client";

import { ReactNode } from "react";

interface PageToolbarProps {
  /** Filters, range pickers, search — left aligned. */
  children?: ReactNode;
  /** Result counts or last-updated stamps — right aligned. */
  meta?: ReactNode;
  className?: string;
}

/**
 * Optional row between the page header and the first section. Sits on a
 * hairline and wraps cleanly at 390px rather than scrolling horizontally.
 */
export const PageToolbar = ({ children, meta, className = "" }: PageToolbarProps) => {
  return (
    <div
      className={`mb-6 flex flex-col gap-3 border-b border-[var(--app-rule)] pb-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {meta && <div className="app-meta shrink-0">{meta}</div>}
    </div>
  );
};

interface ToolbarTabsProps<T extends string> {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

/**
 * Rectangular bordered tabs. Never rounded-full pill chips.
 */
export function ToolbarTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel = "Filter"
}: ToolbarTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex flex-wrap items-center gap-1.5"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`rounded-[0.25rem] border px-2.5 py-1.5 text-[0.8125rem] font-medium leading-none transition-colors ${
              active
                ? "border-[var(--app-rule-strong)] bg-[var(--app-surface-3)] text-foreground"
                : "border-[var(--app-rule)] text-muted-foreground hover:text-foreground hover:bg-[var(--app-surface-2)]"
            }`}
          >
            {option.label}
            {typeof option.count === "number" && (
              <span className="app-num ml-1.5 text-muted-foreground">
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
