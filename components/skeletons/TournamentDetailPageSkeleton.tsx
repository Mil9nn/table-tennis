"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function TournamentDetailPageSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 bg-slate-200 rounded-xl animate-pulse"
          />
        ))}
      </div>

      {/* Main Content Card */}
      <Card className="border-2 border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-11 w-40 rounded-full" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs and Content */}
      <div className="bg-white rounded-lg border border-slate-200">
        {/* Tabs List */}
        <div className="flex gap-2 border-b p-4 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-10 w-24 rounded-md"
            />
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 space-y-4">
          {/* Multiple content skeletons */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, j) => (
                  <Skeleton key={j} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
