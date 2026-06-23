function MatchRowSkeleton() {
  return (
    <div className="block px-4 py-3">
      {/* Line 1: Players & Score */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Side 1 */}
        <div className="flex items-center gap-1.5">
          <div className="bg-accent animate-pulse rounded-md h-4 w-30" />
        </div>

        {/* Score */}
        <div className="bg-accent animate-pulse rounded-md h-4 w-20" />

        {/* Side 2 */}
        <div className="flex items-center gap-1.5">
          <div className="bg-accent animate-pulse rounded-md h-4 w-30" />
        </div>
      </div>

      {/* Line 2: Meta info */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1">
          <div className="bg-accent animate-pulse rounded-md h-3 w-14" />
          <div className="bg-accent animate-pulse rounded-md h-3 w-18" />
          <div className="bg-accent animate-pulse rounded-md h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export default function MatchesListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="divide-y divide-gray-100" role="status" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <MatchRowSkeleton key={i} />
      ))}
    </div>
  );
}
