"use client";

import { Skeleton } from "@/components/ui/skeleton";

function Shimmer({ className = "" }) {
  return <Skeleton className={className} />;
}

export default function TournamentsSkeleton() {
  return (
    <section className="grid grid-cols-1 gap-px">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="border border-[#d9d9d939] p-5"
        >
          {/* First Row: Status Badge + Title | Format Badge + Chevron */}
          <div className="w-full flex items-center justify-between gap-4 flex-wrap">
            {/* Left: Status Badge + Title */}
            <div className="flex items-center gap-3">
              <Shimmer className="h-5 w-14 rounded" />
              <Shimmer className="h-5 w-48 rounded" />
            </div>

            {/* Right: Format Badge + Chevron */}
            <div className="flex items-center gap-2">
              <Shimmer className="h-6 w-24 rounded" />
              <Shimmer className="h-4 w-4 rounded" />
            </div>
          </div>

          {/* Second Row: Metadata (date • city • players) */}
          <div className="mt-3 flex items-center gap-2">
            <Shimmer className="h-4 w-20 rounded" />
            <Shimmer className="h-4 w-20 rounded" />
            <Shimmer className="h-4 w-24 rounded" />
          </div>
        </div>
      ))}
    </section>
  );
}
