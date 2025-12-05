"use client";

import { Skeleton } from "@/components/ui/skeleton";

function Shimmer({ className = "" }) {
  return <Skeleton className={className} />;
}

export default function TournamentsSkeleton() {
  
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-100 hover:border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-all"
        >
          {/* LEFT SECTION */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              {/* Title + optional icon to match rows */}
              <div className="flex items-center gap-3 min-w-0">
                <Shimmer
                  className={`h-5 w-36 rounded`}
                />
              </div>
              {/* Status badges */}
              <div className="flex items-end gap-1 shrink-0">
                <Shimmer className="h-6 w-24 rounded-full" />
                <Shimmer className="h-6 w-24 rounded-full" />
              </div>
            </div>

            {/* INLINE META ROW */}
            <div className="flex items-center gap-2 mt-2">
              <Shimmer className="h-4 w-24" />
              <Shimmer className={`h-4 w-16`} />
              <Shimmer
                className={`h-4 w-24`}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
