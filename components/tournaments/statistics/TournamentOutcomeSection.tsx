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
    <div className="w-full flex flex-col bg-white shadow-sm overflow-hidden font-sans">
      {/* Precision Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-slate-50/50">
        <div className="text-[9px] font-mono font-bold text-slate-400">FINALS_SUMMARY</div>
      </div>

      <div className="flex flex-col">
        {/* Tier 1: Champion & Grand Final Result */}
        <div className="p-4 border-b bg-linear-to-r from-amber-50/30 to-transparent">
          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter mb-0.5">Gold / Champion</span>
              <h3 className="text-lg font-black text-slate-900 leading-none uppercase tracking-tighter">
                {outcome.champion.participantName}
              </h3>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono font-black text-slate-900">
                FT: {outcome.finalMatchScore.side1Sets} - {outcome.finalMatchScore.side2Sets}
              </span>
              <span className="text-[9px] font-mono text-slate-400 mt-1">
                {formatSetScore(outcome.finalMatchScore.setsBreakdown)}
              </span>
            </div>
          </div>
        </div>

        {/* Tier 2 & 3: Runners Up Grid */}
        <div className="grid grid-cols-2 divide-x divide-slate-100">
          {/* Silver */}
          <div className="p-3 flex items-start gap-3 overflow-hidden">
            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded border border-slate-100 bg-white text-[10px] font-black text-slate-400">
              2
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Runner-Up</span>
              <span className="text-[11px] font-bold text-slate-900 uppercase truncate">
                {outcome.runnerUp.participantName}
              </span>
            </div>
          </div>

          {/* Bronze */}
          <div className="p-3 flex items-start gap-3 overflow-hidden bg-slate-50/30">
            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded border border-slate-100 bg-white text-[10px] font-black text-slate-400">
              3
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-bold text-orange-600 uppercase tracking-tighter">Bronze</span>
              {outcome.thirdPlace ? (
                <>
                  <span className="text-[11px] font-bold text-slate-900 uppercase truncate">
                    {outcome.thirdPlace.participantName}
                  </span>
                  {outcome.thirdPlaceMatchScore && (
                    <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                      W: {outcome.thirdPlaceMatchScore.side1Sets}-{outcome.thirdPlaceMatchScore.side2Sets}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[11px] font-medium text-slate-300">N/A</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}