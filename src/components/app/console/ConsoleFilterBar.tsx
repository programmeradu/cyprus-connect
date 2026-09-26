"use client";

/**
 * Period and site filter for the console overview.
 *
 * Native selects: they work with a keyboard and a screen reader, and on a
 * phone they open the system picker. The site control only offers sites
 * the readings actually name; with none, it says so instead of showing an
 * empty list.
 */

import { ALL_SITES, isDefaultFilter, periodLabel, type ConsoleFilter, type PeriodKey } from "./filters";

interface Props {
  filter: ConsoleFilter;
  onChange: (next: ConsoleFilter) => void;
  years: number[];
  sites: string[];
  /** Readings left in view after filtering, for the status line. */
  readingsInView: number;
}

const RELATIVE: PeriodKey[] = ["all", "ytd", "12m", "6m", "3m"];

export function ConsoleFilterBar({ filter, onChange, years, sites, readingsInView }: Props) {
  const noSites = sites.length === 0;
  return (
    <div className="vc-filter-bar" role="group" aria-label="Filter the console">
      <label className="vc-filter">
        <span>Period</span>
        <select
          value={filter.period}
          onChange={(e) => onChange({ ...filter, period: e.target.value as PeriodKey })}
        >
          {RELATIVE.map((p) => (
            <option key={p} value={p}>
              {periodLabel(p)}
            </option>
          ))}
          {years.length > 0 && (
            <optgroup label="Calendar year">
              {years.map((y) => (
                <option key={y} value={`y${y}`}>
                  {y}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>

      <label className="vc-filter">
        <span>Site</span>
        <select
          value={filter.site}
          disabled={noSites}
          title={noSites ? "Your readings are not split by site yet." : undefined}
          onChange={(e) => onChange({ ...filter, site: e.target.value })}
        >
          <option value={ALL_SITES}>{noSites ? "Whole workspace" : "All sites"}</option>
          {sites.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <p className="vc-filter-note" aria-live="polite">
        {isDefaultFilter(filter)
          ? noSites
            ? "Showing every reading. Readings are not split by site yet."
            : "Showing every reading across all sites."
          : `${readingsInView} reading${readingsInView === 1 ? "" : "s"} in view. Period also applies to agent runs and the audit trail; obligations always show in full.`}
      </p>

      {!isDefaultFilter(filter) && (
        <button type="button" className="vc-filter-reset" onClick={() => onChange({ period: "all", site: ALL_SITES })}>
          Clear filters
        </button>
      )}
    </div>
  );
}
