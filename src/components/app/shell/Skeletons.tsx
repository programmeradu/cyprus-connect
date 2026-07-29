"use client";

/**
 * Skeletons that match the shape of the content they replace. Never a
 * centred spinner. Pages should pick the variant matching their layout.
 */

const shimmer =
  "animate-pulse rounded bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]";

export const SkeletonLine = ({ className = "" }: { className?: string }) => (
  <div className={`${shimmer} h-3 ${className}`} />
);

export const SkeletonMetric = () => (
  <div className="app-card space-y-3 p-4">
    <SkeletonLine className="w-24" />
    <div className={`${shimmer} h-7 w-32`} />
    <SkeletonLine className="w-20" />
  </div>
);

export const SkeletonMetricRow = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonMetric key={i} />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="app-ledger">
    <div className="flex items-center gap-4 px-4 py-3">
      <SkeletonLine className="w-32" />
      <div className="flex-1" />
      <SkeletonLine className="w-16" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-4">
        <SkeletonLine className="w-48" />
        <div className="flex-1" />
        <SkeletonLine className="w-20" />
      </div>
    ))}
  </div>
);

export const SkeletonCards = ({ count = 3 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="app-card space-y-3 p-4">
        <SkeletonLine className="w-2/3" />
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-5/6" />
      </div>
    ))}
  </div>
);

/** Default page scaffold: a metric row plus a table. */
export const PageSkeleton = () => (
  <div className="space-y-8">
    <SkeletonMetricRow />
    <SkeletonTable />
  </div>
);
