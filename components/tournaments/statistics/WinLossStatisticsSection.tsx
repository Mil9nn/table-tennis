"use client";

import { useState } from "react";
import { ParticipantStats } from "@/types/knockoutStatistics.type";
import { BarChart3, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface WinLossStatisticsSectionProps {
  stats: ParticipantStats[];
}

type SortKey = "participantName" | "matchesWon" | "pointsDiff";

export function WinLossStatisticsSection({ stats }: WinLossStatisticsSectionProps) {
  const [sortKey, setSortKey] = useState<SortKey>("matchesWon");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortedStats = [...stats].sort((a, b) => {
    const factor = sortOrder === "asc" ? 1 : -1;
    if (sortKey === "participantName") return factor * a.participantName.localeCompare(b.participantName);
    return factor * ((a[sortKey] as number) - (b[sortKey] as number));
  });

  return (
    <div className="w-full flex flex-col bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* Precision Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-slate-50">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Competitive Standings</h2>
        </div>
        <div className="text-[9px] font-mono font-bold text-slate-400 uppercase">
          Sorted by: {sortKey}
        </div>
      </div>

      {/* Main Content: High-Density Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-150 scrollbar-thin">
        <table className="w-full border-collapse text-left min-w-125">
          <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
            <tr className="border-b">
              <th className="py-2 px-3 text-[9px] font-black uppercase text-slate-400 w-12 text-center">#</th>
              <th className="py-2 px-2 text-[9px] font-black uppercase text-slate-400">Participant</th>
              <th className="py-2 px-2 text-[9px] font-black uppercase text-slate-400 text-center">Record</th>
              <th className="py-2 px-2 text-[9px] font-black uppercase text-slate-400 text-center">Sets (W-L)</th>
              <th className="py-2 px-2 text-[9px] font-black uppercase text-slate-400 text-center">+/-</th>
              <th className="py-2 px-3 text-[9px] font-black uppercase text-slate-400 text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedStats.map((p, i) => (
              <tr key={p.participantId} className="group hover:bg-slate-50/80 transition-colors">
                {/* Ranking */}
                <td className="py-2 px-3 text-center border-r border-slate-50">
                  <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-slate-900">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                </td>

                {/* Name */}
                <td className="py-2 px-2">
                  <div className="text-[11px] font-bold text-slate-900 uppercase tracking-tight truncate max-w-30">
                    {p.participantName}
                  </div>
                </td>

                {/* Match Record (W-L) */}
                <td className="py-2 px-2 text-center">
                  <div className="inline-flex items-baseline gap-1">
                    <span className="text-[11px] font-mono font-black text-emerald-600">{p.matchesWon}</span>
                    <span className="text-[9px] text-slate-300">/</span>
                    <span className="text-[11px] font-mono font-black text-rose-600">{p.matchesLost}</span>
                  </div>
                </td>

                {/* Sets Detail */}
                <td className="py-2 px-2 text-center">
                  <span className="text-[10px] font-mono text-slate-500 font-medium">
                    {p.setsWon}-{p.setsLost}
                  </span>
                </td>

                {/* Difference with Logic Color */}
                <td className="py-2 px-2 text-center">
                  <span className={cn(
                    "text-[10px] font-mono font-black",
                    p.setsDiff > 0 ? "text-blue-600" : p.setsDiff < 0 ? "text-rose-500" : "text-slate-400"
                  )}>
                    {p.setsDiff > 0 ? `+${p.setsDiff}` : p.setsDiff}
                  </span>
                </td>

                {/* Total Points / Diff */}
                <td className="py-2 px-3 text-right border-l border-slate-50">
                  <div className="flex flex-col items-end leading-none">
                    <span className="text-[11px] font-mono font-black text-slate-900">
                      {p.pointsScored}
                    </span>
                    <span className={cn(
                      "text-[9px] font-bold mt-0.5",
                      p.pointsDiff > 0 ? "text-emerald-600" : "text-slate-400"
                    )}>
                      {p.pointsDiff > 0 ? `+${p.pointsDiff}` : p.pointsDiff}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}