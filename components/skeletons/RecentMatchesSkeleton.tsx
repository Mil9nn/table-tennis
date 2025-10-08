"use client";

export default function RecentMatchesSkeleton() {
  const placeholders = Array.from({ length: 2 }); // show 6 cards

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {placeholders.map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse"
        >
          {/* Players Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Player 1 */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full border border-gray-200 shadow-sm" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>

            {/* Player 2 */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="w-10 h-10 bg-gray-200 rounded-full border border-gray-200 shadow-sm" />
            </div>
          </div>

          {/* Divider + Score + Time */}
          <div className="flex items-center justify-between mt-6 border-t border-gray-100 pt-4">
            <div className="h-5 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
