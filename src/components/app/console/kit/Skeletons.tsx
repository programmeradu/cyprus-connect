"use client";

/**
 * Skeletons shaped like the surface they stand in for, so the page does
 * not jump when the records arrive. Never a centred spinner.
 */

export const SkeletonLine = ({ className = "" }: { className?: string }) => (
  <span className={`vck-skel-line ${className}`} />
);

export const SkeletonMetric = () => (
  <div className="vck-reading vck-skel" aria-hidden="true">
    <SkeletonLine className="w-24" />
    <SkeletonLine className="w-32" />
    <SkeletonLine className="w-20" />
  </div>
);

export const SkeletonMetricRow = ({ count = 4 }: { count?: number }) => (
  <div className="vck-reading-rail" aria-hidden="true">
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonMetric key={index} />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="vck-plate vck-skel" aria-hidden="true">
    <div className="vck-skel-head">
      <SkeletonLine className="w-32" />
      <SkeletonLine className="w-16" />
    </div>
    {Array.from({ length: rows }).map((_, index) => (
      <div className="vck-skel-row" key={index}>
        <SkeletonLine className="w-48" />
        <SkeletonLine className="w-20" />
      </div>
    ))}
  </div>
);

export const SkeletonCards = ({ count = 3 }: { count?: number }) => (
  <div className="vck-grid vck-grid-3" aria-hidden="true">
    {Array.from({ length: count }).map((_, index) => (
      <div className="vck-plate vck-skel" key={index}>
        <div className="vck-skel-row">
          <SkeletonLine className="w-2/3" />
        </div>
        <div className="vck-skel-row">
          <SkeletonLine className="w-full" />
        </div>
      </div>
    ))}
  </div>
);

/** The default page scaffold: a reading rail and a table. */
export const PageSkeleton = () => (
  <div className="vck-deck" aria-busy="true">
    <SkeletonMetricRow />
    <SkeletonTable />
  </div>
);
