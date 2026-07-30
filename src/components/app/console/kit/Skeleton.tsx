"use client";

/**
 * Loading scaffolds. Each one has the shape of the surface it stands in
 * for, so the page does not jump when the records arrive.
 */

export const SkeletonLine = ({ width = "100%" }: { width?: string }) => (
  <span className="vck-skel-line" style={{ width }} />
);

export const PlateSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="vck-plate vck-skel" aria-hidden="true">
    <div className="vck-skel-head">
      <SkeletonLine width="38%" />
      <SkeletonLine width="14%" />
    </div>
    {Array.from({ length: rows }).map((_, index) => (
      <div className="vck-skel-row" key={index}>
        <SkeletonLine width={`${88 - index * 11}%`} />
        <SkeletonLine width="42%" />
      </div>
    ))}
  </div>
);

export const ReadingSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="vck-reading-rail" aria-hidden="true">
    {Array.from({ length: count }).map((_, index) => (
      <div className="vck-reading vck-skel" key={index}>
        <SkeletonLine width="60%" />
        <SkeletonLine width="46%" />
      </div>
    ))}
  </div>
);

export const ChartSkeleton = ({ height = 210 }: { height?: number }) => (
  <div className="vck-skel-chart" style={{ height }} aria-hidden="true" />
);

/** The whole deck while the workspace read is in flight. */
export const DeckSkeleton = () => (
  <div className="vck-deck" aria-busy="true" aria-label="Loading the workspace">
    <ReadingSkeleton />
    <div className="vck-grid vck-grid-2">
      <PlateSkeleton rows={4} />
      <PlateSkeleton rows={4} />
    </div>
  </div>
);
