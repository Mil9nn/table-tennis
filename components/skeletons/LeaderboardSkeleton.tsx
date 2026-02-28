function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center px-4 py-3 border-b border-[#d9d9d9]">
      {/* Rank */}
      <div className="bg-accent animate-pulse rounded-md h-5 w-8 mr-4" />
      
      {/* Player/Team Info */}
      <div className="flex-1 flex items-center gap-3">
        <div className="bg-accent animate-pulse rounded-full h-8 w-8" />
        <div className="flex-1">
          <div className="bg-accent animate-pulse rounded-md h-4 w-32 mb-1" />
          <div className="bg-accent animate-pulse rounded-md h-3 w-20" />
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex items-center gap-6">
        <div className="bg-accent animate-pulse rounded-md h-4 w-12" />
        <div className="bg-accent animate-pulse rounded-md h-4 w-12" />
        <div className="bg-accent animate-pulse rounded-md h-4 w-12" />
        <div className="bg-accent animate-pulse rounded-md h-4 w-12" />
      </div>
      
      {/* Points */}
      <div className="bg-accent animate-pulse rounded-md h-5 w-16 ml-4" />
    </div>
  );
}

export default function LeaderboardSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="border border-[#d9d9d9]" role="status" aria-busy="true">
      {/* Header */}
      <div className="bg-[#f9f9f9] px-4 py-2 border-b border-[#d9d9d9]">
        <div className="flex items-center">
          <div className="bg-accent animate-pulse rounded-md h-4 w-8 mr-4" />
          <div className="flex-1 flex items-center gap-6">
            <div className="bg-accent animate-pulse rounded-md h-4 w-32" />
            <div className="bg-accent animate-pulse rounded-md h-4 w-12" />
            <div className="bg-accent animate-pulse rounded-md h-4 w-12" />
            <div className="bg-accent animate-pulse rounded-md h-4 w-12" />
            <div className="bg-accent animate-pulse rounded-md h-4 w-12" />
            <div className="bg-accent animate-pulse rounded-md h-4 w-16" />
          </div>
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: count }).map((_, i) => (
        <LeaderboardRowSkeleton key={i} />
      ))}
    </div>
  );
}
