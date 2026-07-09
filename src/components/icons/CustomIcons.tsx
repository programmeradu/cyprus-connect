"use client";

/**
 * Icon primitives.
 *
 * These used to be hand-rolled SVGs that read as amateur (leaf-that-was-a-heart,
 * carbon-with-sun-rays, off-proportion fire/sparkles). They are now thin
 * wrappers around Lucide icons so the public API stays identical to keep
 * every call site working — but the glyphs render as professional,
 * single-stroke, consistent icons.
 *
 * Per design rules (mem://constraints/no-icons-no-pills) decorative icons
 * should be avoided in UI. Prefer typography, spacing and numerals for
 * hierarchy. Where a call site is purely decorative, remove the icon
 * rather than restyling it.
 */

import {
  Leaf,
  LayoutGrid,
  Calculator,
  Trophy,
  LineChart,
  Lightbulb,
  Settings,
  Gauge,
  Target,
  Sparkles,
  Flame,
  Zap,
  Droplet,
  Recycle,
  Menu,
  X,
  ArrowRight,
  Check,
  Bell,
  User,
  FileText,
  type LucideProps,
} from "lucide-react";

type IconProps = {
  className?: string;
  /** Legacy prop kept for API compatibility; no longer animates. */
  animated?: boolean;
} & Omit<LucideProps, "className">;

const make = (Cmp: React.ComponentType<LucideProps>) => {
  const Wrapped = ({ className = "w-5 h-5", animated: _animated, ...rest }: IconProps) => (
    <Cmp className={className} strokeWidth={1.5} {...rest} />
  );
  Wrapped.displayName = Cmp.displayName || Cmp.name || "Icon";
  return Wrapped;
};

export const LeafIcon = make(Leaf);
export const DashboardIcon = make(LayoutGrid);
export const CalculatorIcon = make(Calculator);
export const TrophyIcon = make(Trophy);
export const ChartIcon = make(LineChart);
export const BulbIcon = make(Lightbulb);
export const SettingsIcon = make(Settings);
export const CarbonIcon = make(Gauge);
export const TargetIcon = make(Target);
export const SparklesIcon = make(Sparkles);
export const FireIcon = make(Flame);
export const BoltIcon = make(Zap);
export const WaterIcon = make(Droplet);
export const RecycleIcon = make(Recycle);
export const MenuIcon = make(Menu);
export const CloseIcon = make(X);
export const ArrowRightIcon = make(ArrowRight);
export const CheckIcon = make(Check);
export const BellIcon = make(Bell);
export const UserIcon = make(User);
export const AIDocumentIcon = make(FileText);
