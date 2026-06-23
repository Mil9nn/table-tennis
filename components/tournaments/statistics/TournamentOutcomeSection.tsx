"use client";

import { TournamentOutcome } from "@/types/knockoutStatistics.type";
import { Trophy, Hash } from "lucide-react";

interface TournamentOutcomeSectionProps {
  outcome: TournamentOutcome;
  category: "individual" | "team";
}

export function TournamentOutcomeSection({ outcome }: TournamentOutcomeSectionProps) {
  const formatSetScore = (sets: number[][]) => {
    return sets.map((s) => `${s[0]}-${s[1]}`).join("   ");
  };

  return (
    <div className="w-full flex flex-col border border-[#d9d9d9] bg-[#ffffff] overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#d9d9d9] bg-[#ffffff]">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#3c6e71]" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#353535]">
            Tournament Outcome
          </h2>
        </div>
      </div>

      <div className="flex flex-col">
        {/* Final Match Score */}
        <div className="p-4">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-[#3c6e71] uppercase tracking-[0.2em] mb-1">
              Final Match
            </span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#353535]">
                {outcome.finalMatchScore.side1Sets} - {outcome.finalMatchScore.side2Sets}
              </span>
              <span className="text-[10px] text-[#3c6e71]">
                {formatSetScore(outcome.finalMatchScore.setsBreakdown)}
              </span>
            </div>
            {outcome.thirdPlaceMatchScore && (
              <div className="mt-3 pt-3 border-t border-[#d9d9d9]">
                <span className="text-[10px] font-bold text-[#3c6e71] uppercase tracking-[0.2em] mb-1 block">
                  Third Place Match
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#353535]">
                    {outcome.thirdPlaceMatchScore.side1Sets} - {outcome.thirdPlaceMatchScore.side2Sets}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}