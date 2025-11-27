"use client";

function TeamRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Team Logo */}
      <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 skeleton-shimmer" />

      {/* Team Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-4 w-28 bg-gray-200 rounded skeleton-shimmer" />
          <div className="h-3 w-16 bg-gray-100 rounded skeleton-shimmer" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-3 w-16 bg-gray-100 rounded skeleton-shimmer" />
          <div className="h-3 w-14 bg-gray-100 rounded skeleton-shimmer" />
        </div>
      </div>

      {/* Captain Avatar */}
      <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0 skeleton-shimmer" />

      {/* Arrow */}
      <div className="w-4 h-4 bg-gray-100 rounded shrink-0 skeleton-shimmer" />
    </div>
  );
}

export default function TeamListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        :global(.skeleton-shimmer) {
          background: linear-gradient(
            90deg,
            #e5e7eb 0%,
            #f3f4f6 50%,
            #e5e7eb 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: count }).map((_, i) => (
          <TeamRowSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
