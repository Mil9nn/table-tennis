"use client";

export function TournamentPageFullSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 border-b border-blue-700/20">
        <div className="max-w-7xl mx-auto">
          <div className="px-6 py-4">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 space-y-1">
                {/* Title + Status */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Title skeleton */}
                  <div className="h-8 bg-white/20 rounded animate-pulse w-64" />
                  {/* Status badge skeleton */}
                  <div className="h-6 bg-white/20 rounded-md animate-pulse w-24" />
                </div>
                {/* Subtitle skeleton */}
                <div className="h-4 bg-white/20 rounded animate-pulse w-96" />
              </div>

              {/* Action Buttons - Compact */}
              <div className="flex items-center gap-2">
                <div className="h-10 bg-white/20 rounded animate-pulse w-32" />
                <div className="h-10 bg-white/20 rounded animate-pulse w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {/* Info Cards Section */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-lg border border-slate-200 space-y-2"
              >
                <div className="h-5 bg-slate-200 rounded animate-pulse w-20" />
                <div className="h-8 bg-slate-200 rounded animate-pulse w-32" />
              </div>
            ))}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="px-6 py-2 border-b border-slate-200 flex gap-4 flex-wrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-6 bg-slate-200 rounded animate-pulse w-20"
            />
          ))}
        </div>

        {/* Tab Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Section title */}
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-6 bg-slate-200 rounded animate-pulse w-48" />
          </div>

          {/* Main content grid */}
          <div className="space-y-4">
            {/* First row of content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-lg border border-slate-200 space-y-3"
                >
                  <div className="h-5 bg-slate-200 rounded animate-pulse w-32" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-full" />
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6" />
                  </div>
                </div>
              ))}
            </div>

            {/* Large content area */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
              <div className="h-5 bg-slate-200 rounded animate-pulse w-40" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-slate-200 rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
