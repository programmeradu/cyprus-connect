"use client";

import type { ReactNode } from "react";

export interface TabItem {
  key: string;
  label: string;
  /** A count shown after the label. Reads from data, never invented. */
  count?: number;
}

/** The section strip inside a page. Same geometry as the overview deck. */
export function ConsoleTabs({
  items,
  value,
  onChange,
  trailing,
}: {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="vck-tabs">
      <div className="vck-tabs-strip" role="tablist">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={value === item.key}
            data-active={value === item.key}
            onClick={() => onChange(item.key)}
          >
            {item.label}
            {typeof item.count === "number" && <span>{item.count}</span>}
          </button>
        ))}
      </div>
      {trailing && <div className="vck-tabs-trailing">{trailing}</div>}
    </div>
  );
}
