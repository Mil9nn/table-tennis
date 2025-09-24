"use client";

import { MatchStatus } from "@/types/match.type";

interface SetTrackerProps {
  bestOf: number;
  side1Sets: number;
  side2Sets: number;
  status: MatchStatus;
}

export default function SetTracker({
  bestOf,
  side1Sets,
  side2Sets,
  status,
}: SetTrackerProps) {
  const totalSets = bestOf; // in table tennis, best-of-N means N possible sets
  const setsNeeded = Math.floor(bestOf / 2) + 1;
  const currentSet = side1Sets + side2Sets + 1;

  return (
    <div className="flex justify-center flex-wrap gap-2 py-2">
      {Array.from({ length: totalSets }).map((_, idx) => {
        const setIndex = idx + 1;

        // decide circle color
        let bg = "bg-gray-200";
        if (setIndex <= side1Sets) {
          bg = "bg-emerald-500"; // ✅ player1 won this set
        } else if (setIndex <= side1Sets + side2Sets) {
          bg = "bg-rose-500"; // ✅ player2 won this set
        } else if (status !== "completed" && setIndex === currentSet) {
          bg = "bg-blue-400 animate-pulse"; // 🔵 current set in progress
        }

        return (
          <div
            key={setIndex}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${bg}`}
          >
            {setIndex}
          </div>
        );
      })}

      {/* Info label */}
      <span className="text-sm text-gray-600">
        First to {setsNeeded} sets wins
      </span>
    </div>
  );
}
