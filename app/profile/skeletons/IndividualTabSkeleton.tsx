import React from "react";

const IndividualTabSkeleton = () => {
  return (
    <>
      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="border-blue-100 border-2 rounded-xl p-4 space-y-3"
          >
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-6 w-10 bg-gray-300 rounded" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="bg-white rounded-2xl p-6 mt-6 animate-pulse">
        <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-64 w-full bg-gray-100 rounded-xl" />
      </div>
    </>
  );
};

export default IndividualTabSkeleton;
