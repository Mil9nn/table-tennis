"use client";

function Shimmer({ className = "" }) {
  return (
    <div
      className={`
        animate-pulse bg-gradient-to-r 
        from-[#f2f3f7] via-[#e9eaf0] to-[#f2f3f7] 
        bg-[length:200%_100%] rounded-md 
        ${className}
      `}
    />
  );
}

export default function TournamentsSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-100 shadow-sm p-4"
        >
          <div className="flex items-center justify-between gap-4">
            
            {/* LEFT SIDE */}
            <div className="flex items-center gap-4 min-w-0">
              {/* Icon placeholder */}
              <Shimmer className="w-10 h-10 rounded-lg" />

              {/* Text lines */}
              <div className="min-w-0 space-y-2">
                <Shimmer className="h-3 w-32" />
                <Shimmer className="h-3 w-20" />
              </div>

              {/* Status badges (hidden on mobile) */}
              <div className="hidden sm:flex items-center gap-2 ml-3">
                <Shimmer className="h-4 w-20 rounded-full" />
                <Shimmer className="h-4 w-16 rounded-full" />
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-4">
              {/* numbers */}
              <div className="flex flex-col items-end text-right mr-2">
                <Shimmer className="h-3 w-10" />
                <Shimmer className="h-3 w-14" />
              </div>

              {/* progress bar desktop */}
              <div className="hidden md:block w-36 h-2 bg-gray-100 rounded-full overflow-hidden">
                <Shimmer className="h-full w-1/3" />
              </div>

              {/* arrow button placeholder */}
              <Shimmer className="w-8 h-8 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}