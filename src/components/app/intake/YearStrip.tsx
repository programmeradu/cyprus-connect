"use client";

/**
 * Twelve months of one year at a glance: recorded, partly recorded or empty.
 * Choosing a month opens the typing form on it.
 */

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FOOTPRINT_KEYS, isFutureMonth, type FootprintKey } from "@/lib/emissions/footprint";

type Month = { year: number; month: number } & Record<FootprintKey, number>;

export function YearStrip({
  months,
  selected,
  onPick,
}: {
  months: Month[];
  selected: { year: number; month: number };
  onPick: (year: number, month: number) => void;
}) {
  const t = useTranslations("dashboard.calculator.strip");
  const locale = useLocale();
  const nowYear = new Date().getUTCFullYear();
  const [year, setYear] = useState(selected.year);
  const short = useMemo(() => new Intl.DateTimeFormat(locale === "el" ? "el-CY" : "en-GB", { month: "short", timeZone: "UTC" }), [locale]);

  const stateOf = (m: number): "full" | "part" | "empty" | "future" => {
    if (isFutureMonth(year, m)) return "future";
    const r = months.find((x) => x.year === year && x.month === m);
    if (!r) return "empty";
    const filled = FOOTPRINT_KEYS.filter((k) => r[k] > 0).length;
    return filled >= 3 ? "full" : filled > 0 ? "part" : "empty";
  };
  const states = Array.from({ length: 12 }, (_, i) => stateOf(i + 1));
  const recorded = states.filter((s) => s === "full" || s === "part").length;
  const open = states.filter((s) => s !== "future").length;

  return (
    <div className="vck-strip">
      <div className="vck-strip-head">
        <p className="vck-strip-title">{t("title")}</p>
        <div className="vck-strip-year">
          <button type="button" className="vck-btn" aria-label={t("prev")} disabled={year <= nowYear - 3} onClick={() => setYear((y) => y - 1)}>
            ‹
          </button>
          <span>{year}</span>
          <button type="button" className="vck-btn" aria-label={t("next")} disabled={year >= nowYear} onClick={() => setYear((y) => y + 1)}>
            ›
          </button>
        </div>
      </div>
      <p className="vck-meta">{t("count", { recorded, open })}</p>
      <ol className="vck-strip-grid">
        {states.map((s, i) => {
          const m = i + 1;
          const label = short.format(new Date(Date.UTC(2020, i, 1)));
          return (
            <li key={m}>
              <button
                type="button"
                data-state={s}
                aria-current={selected.year === year && selected.month === m ? "true" : undefined}
                disabled={s === "future"}
                onClick={() => onPick(year, m)}
                aria-label={`${label} ${year}: ${t(`state.${s}`)}`}
              >
                <span className="vck-strip-m">{label}</span>
                <span className="vck-strip-s">{t(`state.${s}`)}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="vck-meta">{t("hint")}</p>
    </div>
  );
}
