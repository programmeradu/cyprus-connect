"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Horizontal scroll-snap rail for mobile with a hairline progress indicator.
 * Above the `sm` breakpoint the rail unwraps into the grid classes passed in
 * via `gridClassName`, and the indicator is hidden.
 */
export function SnapRail({
  count,
  children,
  as = "ul",
  gridClassName,
  labelledBy,
}: {
  count: number;
  children: React.ReactNode;
  as?: "ul" | "ol";
  gridClassName: string;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);
  const [isRail, setIsRail] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    const onChange = () => setIsRail(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    if (children.length === 0) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    children.forEach((child, i) => {
      const mid = child.offsetLeft + child.offsetWidth / 2;
      const d = Math.abs(mid - center);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setActive(nearest);
  }, []);

  const goTo = (i: number) => {
    const el = ref.current;
    const child = el?.children[i] as HTMLElement | undefined;
    if (!el || !child) return;
    el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: "smooth" });
  };

  const Tag = as as "ul";

  return (
    <div>
      <Tag
        ref={ref as React.Ref<HTMLUListElement>}
        onScroll={onScroll}
        aria-labelledby={labelledBy}
        className={`flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${gridClassName}`}
      >
        {children}
      </Tag>

      {isRail && count > 1 && (
        <div className="mt-6 flex items-center gap-2 px-4 sm:hidden">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to item ${i + 1} of ${count}`}
              aria-current={i === active}
              className="group h-6 flex-1"
            >
              <span
                className={`block h-px w-full transition-colors ${
                  i === active ? "bg-foreground/70" : "bg-border"
                }`}
              />
            </button>
          ))}
          <span className="ml-2 shrink-0 text-[13px] font-medium tabular-nums text-foreground/60">
            {active + 1}/{count}
          </span>
        </div>
      )}
    </div>
  );
}
