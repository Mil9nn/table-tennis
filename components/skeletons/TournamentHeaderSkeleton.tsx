"use client";

export function TournamentHeaderSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-60 p-6 rounded-none">
        <div className="h-8 bg-white/20 rounded animate-pulse mb-4 w-1/3" />
        <div className="h-4 bg-white/20 rounded animate-pulse w-1/2" />
      </div>

      {/* Stats Cards Grid */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-slate-200 rounded-xl animate-pulse"
            />
          ))}
        </div>

        {/* Main Content Area */}
        <div className="h-64 bg-slate-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
