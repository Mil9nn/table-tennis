"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function MatchesListSkeleton() {
  // show e.g., 6 skeleton cards
  const placeholders = Array.from({ length: 6 });

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {placeholders.map((_, i) => (
        <Card
          key={i}
          className="border rounded-2xl overflow-hidden animate-pulse bg-white"
        >
          <CardContent className="p-5 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="h-3 w-28 bg-gray-200 rounded" />
              <div className="h-5 w-16 bg-gray-200 rounded-full" />
            </div>

            {/* Participants (2x2 or 2x1 grid mimic) */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-end gap-2">
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="h-7 w-7 bg-gray-200 rounded-full" />
              </div>
              <div className="flex items-center justify-start gap-2">
                <div className="h-7 w-7 bg-gray-200 rounded-full" />
                <div className="h-3 w-20 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Final Score */}
            <div className="text-center space-y-2">
              <div className="h-6 w-16 mx-auto bg-gray-200 rounded" />
            </div>

            {/* Footer */}
            <div className="flex justify-between text-xs text-gray-400">
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="h-3 w-12 bg-gray-200 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}