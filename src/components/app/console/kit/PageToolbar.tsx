"use client";

import { ReactNode } from "react";

interface PageToolbarProps {
  /** Filters, range pickers, search. Left aligned. */
  children?: ReactNode;
  /** Result counts or last-read stamps. Right aligned. */
  meta?: ReactNode;
  className?: string;
}

/** The row between the header and the deck. Wraps; never scrolls sideways. */
export const PageToolbar = ({ children, meta, className = "" }: PageToolbarProps) => {
  return (
    <div className={`vck-tabs ${className}`}>
      <div className="vck-toolbar-slot">{children}</div>
      {meta && <div className="vck-tabs-trailing">{meta}</div>}
    </div>
  );
};

interface ToolbarTabsProps<T extends string> {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

/** The console section strip. */
export function ToolbarTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel = "Filter"
}: ToolbarTabsProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="vck-tabs-strip">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={active}
            data-active={active}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {typeof option.count === "number" && <span>{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
