"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function TournamentDetailSkeleton() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600">
      {/* Header Section */}
      <div className="relative text-white p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Left section */}
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-64 bg-white/20" />
            <Skeleton className="h-4 w-48 bg-white/20" />
          </div>

          {/* Right action buttons */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-32 bg-white/20 rounded-md" />
            <Skeleton className="h-8 w-28 bg-white/20 rounded-md" />
            <Skeleton className="h-8 w-24 bg-white/20 rounded-md" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-[11px] text-white/89 mb-2">
            <Skeleton className="h-3 w-32 bg-white/20" />
            <Skeleton className="h-3 w-20 bg-white/20" />
          </div>
          <Skeleton className="h-1.5 w-full bg-white/20 rounded-full" />
        </div>
      </div>

      <div className="bg-white">
        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm"
            >
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>

        {/* Generate Matches CTA */}
        <Card className="border-2 border-blue-200 rounded-none bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg mx-4 mb-4">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left space-y-2 flex-1">
                <Skeleton className="h-6 w-48 mx-auto sm:mx-0" />
                <Skeleton className="h-4 w-64 mx-auto sm:mx-0" />
              </div>
              <Skeleton className="h-11 w-40 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <div className="w-full">
          {/* Tabs List */}
          <div className="grid w-full max-w-3xl p-0 rounded-none mx-auto shadow-sm grid-cols-4 border-b">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-10 w-full rounded-none"
              />
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 space-y-4">
            {/* Groups/Standings Content */}
            <div className="space-y-4">
              {/* Groups Overview (if groups) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-5 rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-5 w-8 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-5 w-12 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Standings Table */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Table Header */}
                    <div className="grid grid-cols-6 gap-4 pb-2 border-b">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                      ))}
                    </div>
                    {/* Table Rows */}
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-6 gap-4 py-3 border-b last:border-0"
                      >
                        {Array.from({ length: 6 }).map((_, j) => (
                          <Skeleton key={j} className="h-4 w-full" />
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Schedule Content */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <div className="space-y-2">
                      {Array.from({ length: 2 }).map((_, j) => (
                        <div
                          key={j}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Participants Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 bg-slate-50/50"
                >
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              ))}
            </div>

            {/* Info Card */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center py-1 border-b border-black/5"
                      >
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
