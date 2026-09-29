/**
 * Labels and small helpers shared by the console overview and its sections.
 */

import { Link } from "@/i18n/navigation";
import { IcoDoc, IcoLeaf, IcoPlug, IcoPulse, IcoCoin } from "@/components/app/console/icons";

export const CATEGORY_ICON: Record<string, typeof IcoPulse> = {
  emissions: IcoLeaf,
  energy: IcoPulse,
  assurance: IcoDoc,
  finance: IcoCoin,
  operations: IcoPlug,
};

export const CATEGORY_LABEL: Record<string, string> = {
  emissions: "Emissions",
  energy: "Energy",
  assurance: "Assurance",
  finance: "Cost",
  operations: "Operations",
};

export const STATUS_TONE: Record<string, string> = {
  live: "live",
  succeeded: "good",
  running: "live",
  syncing: "warn",
  needs_review: "warn",
  at_risk: "warn",
  error: "bad",
  failed: "bad",
  paused: "idle",
  available: "idle",
  planned: "idle",
  on_track: "good",
  done: "good",
  active: "live",
};

export { titleCase } from "./text";

export const greetingFor = (hour: number) =>
  hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

export type SectionKey = "overview" | "evidence" | "obligations" | "connections" | "audit";

/**
 * Every plate on the overview is a summary of a page that owns those records.
 * This link carries the reader to that page, so no figure is a dead end.
 */
export function PlateOpen({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href as never} className="vc-plate-open" aria-label={label}>
      Open
    </Link>
  );
}
