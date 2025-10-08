"use client";

import React from "react";

const TeamListSkeleton = () => {
  return (
    <div className="p-4 space-y-6">
      {/* Teams grid skeleton */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="border rounded-xl shadow-sm p-3 animate-pulse bg-white dark:bg-neutral-900 space-y-3"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-md" />
              <div className="flex gap-2">
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-md" />
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-md" />
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2 mt-3">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded-md" />
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded-md" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded-md" />
                <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded-md" />
                <div className="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded-md" />
              </div>
            </div>

            {/* Players list */}
            <div className="border-t border-gray-100 dark:border-gray-800 mt-3 pt-3 space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex justify-between items-center">
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded-md" />
                  <div className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded-md" />
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-3">
              <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded-md" />
              <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamListSkeleton;