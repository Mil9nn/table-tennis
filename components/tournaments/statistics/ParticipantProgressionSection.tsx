"use client";

import { useState } from "react";
import { ParticipantProgression } from "@/types/knockoutStatistics.type";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParticipantProgressionSectionProps {
  progression: ParticipantProgression[];
}

type SortKey = "participantName" | "matchesPlayed" | "roundReached";

export function ParticipantProgressionSection({ progression }: ParticipantProgressionSectionProps) {
  const [sortKey, setSortKey] = useState<SortKey>("roundReached");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const getRoundWeight = (round: string): number => {
    const weights: Record<string, number> = {
      "Champion": 7, "Runner-up": 6, "Semi-finalist": 5,
      "Quarter-finalist": 4, "Round of 16": 3, "Round of 32": 2,
    };
    return weights[round] || 1;
  };

  const sortedData = [...progression].sort((a, b) => {
    const factor = sortOrder === "asc" ? 1 : -1;
    if (sortKey === "participantName") return factor * a.participantName.localeCompare(b.participantName);
    if (sortKey === "matchesPlayed") return factor * (a.matchesPlayed - b.matchesPlayed);
    return factor * (getRoundWeight(a.roundReached) - getRoundWeight(b.roundReached));
  });

  const handleSort = (key: SortKey) => {
    setSortOrder(sortKey === key && sortOrder === "desc" ? "asc" : "desc");
    setSortKey(key);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border border-slate-200 overflow-hidden font-sans">
      {/* Sleek Minimal Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-slate-50/50">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Progression Log</h2>
        </div>
      </div>

      {/* Grid Header - No rounded buttons, just interactive text */}
      <div className="grid grid-cols-12 border-b bg-white text-[9px] font-black uppercase tracking-tight text-slate-400">
        <div 
          onClick={() => handleSort("participantName")}
          className="col-span-6 px-3 py-1.5 cursor-pointer hover:text-slate-900 transition-colors border-r border-slate-50"
        >
          Participant {sortKey === "participantName" && (sortOrder === "desc" ? "↓" : "↑")}
        </div>
        <div 
          onClick={() => handleSort("matchesPlayed")}
          className="col-span-2 px-1 py-1.5 text-center cursor-pointer hover:text-slate-900 transition-colors border-r border-slate-50"
        >
          MP {sortKey === "matchesPlayed" && (sortOrder === "desc" ? "↓" : "↑")}
        </div>
        <div 
          onClick={() => handleSort("roundReached")}
          className="col-span-4 px-3 py-1.5 text-right cursor-pointer hover:text-slate-900 transition-colors"
        >
          Final Status {sortKey === "roundReached" && (sortOrder === "desc" ? "↓" : "↑")}
        </div>
      </div>

      {/* Viewport Contained Rows */}
      <div className="flex-1 overflow-hidden">
        {sortedData.map((p, i) => (
          <div 
            key={p.participantId} 
            className="grid grid-cols-12 items-center border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
          >
            {/* Subject Info */}
            <div className="col-span-6 px-3 py-1.5 border-r border-slate-50 overflow-hidden">
              <div className="flex items-baseline gap-2">
                <span className="text-[9px] font-mono text-slate-300 font-bold">{(i + 1).toString().padStart(2, '0')}</span>
                <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tighter truncate leading-none">
                  {p.participantName}
                </span>
              </div>
              {p.eliminatedBy && (
                <div className="text-[9px] text-slate-400 mt-0.5 truncate pl-6 border-l ml-1 border-slate-100">
                  OUT: {p.eliminatedBy.participantName}
                </div>
              )}
            </div>

            {/* MP */}
            <div className="col-span-2 text-center border-r border-slate-50 py-1.5">
              <span className="text-[11px] font-mono font-black text-slate-700">{p.matchesPlayed}</span>
            </div>

            {/* Status (No Badges, just Typography) */}
            <div className="col-span-4 px-3 py-1.5 text-right flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  p.roundReached === "Champion" ? "bg-yellow-400" : 
                  p.roundReached === "Runner-up" ? "bg-slate-300" : "bg-blue-400"
                )} />
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">
                  {p.roundReached}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}