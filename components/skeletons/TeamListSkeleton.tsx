function TeamRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Team Logo */}
      <div className="w-10 h-10 rounded-full bg-accent animate-pulse shrink-0" />

      {/* Team Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-4 w-28 bg-accent animate-pulse rounded-md" />
          <div className="h-3 w-16 bg-accent animate-pulse rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-3 w-16 bg-accent animate-pulse rounded-md" />
          <div className="h-3 w-14 bg-accent animate-pulse rounded-md" />
        </div>
      </div>

      {/* Captain Avatar */}
      <div className="w-7 h-7 rounded-full bg-accent animate-pulse shrink-0" />
    </div>
  );
}

export default function TeamListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="divide-y divide-gray-100" role="status" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <TeamRowSkeleton key={i} />
      ))}
    </div>
  );
}
