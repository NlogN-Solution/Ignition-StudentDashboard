import React from "react";

/** Placeholder block shown while a simulated "request" is in flight. */
export const Skeleton = ({ className = "" }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

export const SkeletonCard = () => (
  <div className="p-4 border border-gray-200 rounded-lg bg-white space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-3/4" />
    <Skeleton className="h-8 w-full rounded-md" />
  </div>
);

export const SkeletonList = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    ))}
  </div>
);

export default Skeleton;
