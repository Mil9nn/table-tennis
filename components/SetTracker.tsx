// components/SetTracker.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { match } from "assert";

interface SetTrackerProps {
  bestOf: number;
  side1Sets: number;
  side2Sets: number;
  status: string;
}

export default function SetTracker({
  bestOf,
  side1Sets,
  side2Sets,
  status,
}: SetTrackerProps) {
  const setsToWin = Math.ceil(bestOf / 2);
  const side1Winning = side1Sets > side2Sets;
  const side2Winning = side2Sets > side1Sets;

  return (
    <div className="p-2">
      <div className="flex items-center justify-center gap-4">
        {/* Side 1 Sets */}
        <div className="flex gap-1.5">
          {Array.from({ length: setsToWin }).map((_, i) => (
            <motion.div
              key={`s1-${i}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center 
                font-bold text-sm transition-all
                ${
                  i < side1Sets
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg scale-110"
                    : "bg-gray-100 text-gray-300"
                }`}
            >
              {i < side1Sets ? "✓" : ""}
            </motion.div>
          ))}
        </div>

        {/* Score Display */}
        <div className="px-4 py-2 bg-white rounded-full shadow-md border-2 border-gray-200">
          <span
            className={`font-black text-2xl ${
              side1Winning ? "text-emerald-600" : "text-gray-600"
            }`}
          >
            {side1Sets}
          </span>
          <span className="mx-3 text-gray-400 font-semibold">:</span>
          <span
            className={`font-black text-2xl ${
              side2Winning ? "text-rose-600" : "text-gray-600"
            }`}
          >
            {side2Sets}
          </span>
        </div>

        {/* Side 2 Sets */}
        <div className="flex gap-1.5">
          {Array.from({ length: setsToWin }).map((_, i) => (
            <motion.div
              key={`s2-${i}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center 
                font-bold text-sm transition-all
                ${
                  i < side2Sets
                    ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg scale-110"
                    : "bg-gray-100 text-gray-300"
                }`}
            >
              {i < side2Sets ? "✓" : ""}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sets to Win Indicator */}
      {status !== "completed" && (
        <p className="text-xs text-center text-gray-500 mt-3 font-medium">
          First to {setsToWin} sets wins
        </p>
      )}
    </div>
  );
}