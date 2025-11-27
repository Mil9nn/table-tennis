"use client";

function MatchRowSkeleton() {
  return (
    <div className="block px-4 py-3">
      {/* Line 1: Players & Score */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Side 1: Avatar + Name */}
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 skeleton-shimmer" />
          <div className="h-4 w-20 bg-gray-200 rounded skeleton-shimmer" />
        </div>

        {/* Score */}
        <div className="h-5 w-10 bg-gray-100 rounded skeleton-shimmer" />

        {/* Side 2: Avatar + Name */}
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 skeleton-shimmer" />
          <div className="h-4 w-20 bg-gray-200 rounded skeleton-shimmer" />
        </div>
      </div>

      {/* Line 2: Meta info + Status */}
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-2">
          <div className="h-3 w-12 bg-gray-100 rounded skeleton-shimmer" />
          <div className="h-3 w-16 bg-gray-100 rounded skeleton-shimmer" />
          <div className="h-3 w-14 bg-gray-100 rounded skeleton-shimmer" />
        </div>
        <div className="h-5 w-16 bg-gray-100 rounded-full skeleton-shimmer" />
      </div>
    </div>
  );
}

export default function MatchesListSkeleton({ count = 6 }: { count?: number }) {
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
        @media (prefers-reduced-motion: reduce) {
          :global(.skeleton-shimmer) {
            animation: none;
            opacity: 0.9;
          }
        }
      `}</style>
      <div className="divide-y divide-gray-100" role="status" aria-busy="true">
        {Array.from({ length: count }).map((_, i) => (
          <MatchRowSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
