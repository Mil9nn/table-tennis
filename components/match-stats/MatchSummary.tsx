"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { IndividualMatch, TeamMatch } from "@/types/match.type";

interface MatchSummaryProps {
  match: IndividualMatch | TeamMatch;
  matchCategory: "individual" | "team";
  side1Name: string;
  side2Name: string;
  side1Sets: number;
  side2Sets: number;
}

export function MatchSummary({
  side1Name,
  side2Name,
  side1Sets,
  side2Sets,
}: MatchSummaryProps) {

  const isSide1Winner = side1Sets > side2Sets;
  const isSide2Winner = side2Sets > side1Sets;


  return (
      <div className="max-w-5xl mx-auto px-4 py-2 space-y-2">
        {/* Match Pills */}
        <div className="space-y-2">
          {/* Side 1 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-between`}
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-zinc-200 text-xs font-semibold">
                  {side1Name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <span className={`text-sm font-medium truncate ${isSide1Winner ? "text-yellow-400" : ""}`}>
                {side1Name}
              </span>
            </div>

            <span
              className={`text-lg font-bold tabular-nums ${
                isSide1Winner ? "text-blue-400" : "text-zinc-300"
              }`}
            >
              {side1Sets}
            </span>
          </motion.div>

          {/* Side 2 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`flex items-center justify-between`}
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-zinc-200 text-xs font-semibold">
                  {side2Name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <span className={`text-sm font-medium truncate ${isSide2Winner ? "text-yellow-400" : ""}`}>
                {side2Name}
              </span>
            </div>

            <span
              className={`text-lg font-bold tabular-nums ${
                isSide2Winner ? "text-blue-400" : "text-zinc-300"
              }`}
            >
              {side2Sets}
            </span>
          </motion.div>
        </div>
      </div>
  );
}
