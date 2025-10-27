import React from "react";

const OverviewTabSkeleton = () => {
  return (
    <>
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="border-blue-100 border-2 rounded-xl p-4 space-y-3"
          >
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-8 w-16 bg-gray-300 rounded" />
          </div>
        ))}
      </div>

      {/* Recent Matches Skeleton */}
      <div className="bg-white rounded-2xl p-6 animate-pulse">
        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                    <div className="h-3 w-12 bg-gray-200 rounded" />
                  </div>
                  <div className="h-4 w-32 bg-gray-300 rounded" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
                <div className="h-6 w-12 bg-gray-300 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Head-to-Head Skeleton */}
      <div className="bg-white rounded-2xl p-6 animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-300 rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-300 rounded" />
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-5 w-12 bg-gray-300 rounded ml-auto" />
                <div className="h-3 w-20 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default OverviewTabSkeleton;