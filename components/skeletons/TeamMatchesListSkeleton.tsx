function TeamMatchRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Teams & Score */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="bg-accent rounded-md h-4 w-24" />
          <div className="bg-accent rounded-md h-4 w-12" />
          <div className="bg-accent rounded-md h-4 w-24" />
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2 mt-1">
          <div className="bg-accent rounded-md h-3 w-16" />
          <div className="bg-accent rounded-md h-3 w-14" />
        </div>
      </div>
    </div>
  );
}

export default function TeamMatchesListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="divide-y divide-gray-100" role="status" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <TeamMatchRowSkeleton key={i} />
      ))}
    </div>
  );
}

