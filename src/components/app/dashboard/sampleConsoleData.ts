import type { OverviewHistoryPoint, PeerRow } from "./ConsoleOverview";

/**
 * A representative twelve-month record for a Cyprus SME office of about
 * forty staff. The console shows this data only when the account has no
 * readings of its own, and it always carries a "Sample data" mark.
 *
 * Shape of the year: summer cooling load lifts consumption between June and
 * September, rooftop solar lifts the renewable share in the same months, and
 * the last quarter shows the effect of an LED and setpoint change.
 */
export const SAMPLE_HISTORY: OverviewHistoryPoint[] = [
  { label: "Aug 25", carbon: 4.1, electricity: 6720, renewable: 21, efficiency: 58 },
  { label: "Sep 25", carbon: 3.8, electricity: 6230, renewable: 23, efficiency: 60 },
  { label: "Oct 25", carbon: 3.2, electricity: 5240, renewable: 25, efficiency: 63 },
  { label: "Nov 25", carbon: 2.9, electricity: 4750, renewable: 24, efficiency: 64 },
  { label: "Dec 25", carbon: 3.1, electricity: 5080, renewable: 22, efficiency: 62 },
  { label: "Jan 26", carbon: 3.3, electricity: 5410, renewable: 22, efficiency: 61 },
  { label: "Feb 26", carbon: 3.0, electricity: 4920, renewable: 26, efficiency: 65 },
  { label: "Mar 26", carbon: 2.7, electricity: 4430, renewable: 29, efficiency: 68 },
  { label: "Apr 26", carbon: 2.5, electricity: 4100, renewable: 32, efficiency: 71 },
  { label: "May 26", carbon: 2.8, electricity: 4590, renewable: 34, efficiency: 72 },
  { label: "Jun 26", carbon: 3.4, electricity: 5570, renewable: 33, efficiency: 70 },
  { label: "Jul 26", carbon: 3.6, electricity: 5900, renewable: 31, efficiency: 69 }
];

export const SAMPLE_CURRENT = {
  carbon: 3.6,
  carbonTrend: -12.2,
  electricity: 5900,
  renewable: 31,
  renewableTrend: 8.4,
  efficiency: 69,
  efficiencyTrend: 4.1,
  waste: 46
};

export const samplePeers = (labels: {
  carbon: string;
  renewables: string;
  waste: string;
  overall: string;
}): PeerRow[] => [
  { label: labels.carbon, percentile: 62 },
  { label: labels.renewables, percentile: 74 },
  { label: labels.waste, percentile: 48 },
  { label: labels.overall, percentile: 65 }
];
