"use client";

import { Skeleton } from "@/components/ui/skeleton";

function Shimmer({ className = "" }) {
  return <Skeleton className={className} />;
}

export default function TournamentsSkeleton() {
  return (
    <section className="grid grid-cols-1 gap-0.5 bg-gray-200">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="p-3 bg-white"
        >
          {/* First Row: Status Badge + Title | Format Badge + Chevron */}
          <div className="w-full flex items-center justify-between gap-4 flex-wrap">
            {/* Left: Status Badge + Title */}
            <div className="flex items-center gap-3">
              <Shimmer className="h-3 w-14 rounded" />
              <Shimmer className="h-3 w-48 rounded" />
            </div>

            {/* Right: Format Badge + Chevron */}
            <div className="flex items-center gap-2">
              <Shimmer className="h-3 w-24 rounded" />
              <Shimmer className="h-3 w-16 rounded" />
            </div>
          </div>

          {/* Second Row: Metadata (date • city • players) */}
          <div className="mt-3 flex items-center gap-2">
            <Shimmer className="h-3 w-20 rounded" />
            <Shimmer className="h-3 w-20 rounded" />
            <Shimmer className="h-3 w-24 rounded" />
          </div>
        </div>
      ))}
    </section>
  );
}
