/**
 * The console kit. Every /app page builds from these primitives only.
 * Read src/app/[locale]/app/README.md before adding one.
 */

export { ConsolePage } from "./ConsolePage";
export { ConsoleHeader } from "./ConsoleHeader";
export { ConsoleTabs } from "./ConsoleTabs";
export type { TabItem } from "./ConsoleTabs";
export { Plate, PlateGrid } from "./Plate";
export { Ledger } from "./Ledger";
export type { LedgerItem } from "./Ledger";
export { ConsoleTable } from "./ConsoleTable";
export type { Column } from "./ConsoleTable";
export { Reading, ReadingRail } from "./Reading";
export { Empty, AiUnavailable } from "./Empty";
export { Btn, State, ChartFrame, Bar } from "./Controls";
export {
  DeckSkeleton,
  PlateSkeleton,
  ReadingSkeleton,
  ChartSkeleton,
  SkeletonLine,
} from "./Skeleton";
