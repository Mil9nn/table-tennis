"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function TournamentHeaderSkeleton() {
  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Clean Header Skeleton */}
      <header className="sticky top-0 z-10 border-b border-[#d9d9d9] bg-[#ffffff]">
        <div className="mx-auto px-4 py-3">
          {/* Header Row - Title + Status Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-4 justify-between">
                {/* Title placeholder */}
                <Skeleton className="h-6 w-64 bg-[#d9d9d9]" />
                {/* Status badge placeholder */}
                <Skeleton className="h-6 w-24 bg-[#d9d9d9]" />
              </div>
            </div>
          </div>

          {/* Stats Row Skeleton */}
          <div className="flex items-center gap-4 justify-between flex-wrap pt-3 mt-3 border-t border-[#d9d9d9]">
            {/* Date stat */}
            <div className="flex items-center gap-1.5">
              <Skeleton className="w-3.5 h-3.5 rounded-full bg-[#d9d9d9]" />
              <Skeleton className="h-4 w-20 bg-[#d9d9d9]" />
            </div>

            {/* Location stat */}
            <div className="flex items-center gap-1.5">
              <Skeleton className="w-3.5 h-3.5 rounded-full bg-[#d9d9d9]" />
              <Skeleton className="h-4 w-24 bg-[#d9d9d9]" />
            </div>

            {/* Participants stat */}
            <div className="flex items-center gap-1.5">
              <Skeleton className="w-3.5 h-3.5 rounded-full bg-[#d9d9d9]" />
              <Skeleton className="h-4 w-28 bg-[#d9d9d9]" />
            </div>

            {/* Progress stat (optional) */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Skeleton className="w-3.5 h-3.5 rounded-full bg-[#d9d9d9]" />
                <Skeleton className="h-4 w-20 bg-[#d9d9d9]" />
              </div>
              <Skeleton className="w-24 h-1.5 bg-[#d9d9d9]" />
            </div>
          </div>
        </div>
      </header>

      {/* Settings & Utilities Section Skeleton */}
      <div className="border-b border-[#d9d9d9] bg-[#f9f9f9]">
        <div className="mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Section Label */}
            <div className="flex items-center gap-2 mr-4">
              <Skeleton className="w-4 h-4 bg-[#d9d9d9]" />
              <Skeleton className="h-4 w-24 bg-[#d9d9d9]" />
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-5 w-px bg-[#d9d9d9]"></div>

            {/* Action buttons placeholders */}
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-8 w-20 bg-[#d9d9d9]"
                />
              ))}
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Destructive action buttons */}
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 bg-[#d9d9d9]" />
              <Skeleton className="h-8 w-20 bg-[#d9d9d9]" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section Skeleton */}
      <div className="mx-auto px-4 py-6">
        {/* Tab list placeholders */}
        <div className="flex items-center gap-1 mb-6 border border-[#d9d9d9] bg-[#ffffff] p-1 w-full">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-8 w-20 bg-[#d9d9d9]"
            />
          ))}
        </div>

        {/* Tab content area skeleton */}
        <div className="border border-[#d9d9d9] bg-[#ffffff]">
          {/* Content header placeholder */}
          <div className="flex items-center gap-2 p-4 border-b border-[#d9d9d9]">
            <Skeleton className="w-4 h-4 bg-[#d9d9d9]" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 bg-[#d9d9d9] mb-2" />
              <Skeleton className="h-3 w-48 bg-[#d9d9d9]" />
            </div>
          </div>

          {/* Main content area */}
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full bg-[#d9d9d9]" />
                <Skeleton className="h-4 w-5/6 bg-[#d9d9d9]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
