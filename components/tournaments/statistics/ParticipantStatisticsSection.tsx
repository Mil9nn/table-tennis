"use client";

import { useState } from "react";
import {
  ParticipantProgression,
  ParticipantStats,
  PerformanceMetrics
} from "@/types/knockoutStatistics.type";
import { TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface ParticipantStatisticsSectionProps {
  progression: ParticipantProgression[];
  stats: ParticipantStats[];
  metrics: PerformanceMetrics[];
}

interface CombinedParticipantData {
  participantId: string;
  participantName: string;
  seedNumber?: number;
  // Progression
  matchesPlayed: number;
  roundReached: string;
  eliminatedBy?: { participantId: string; participantName: string };
  // Stats
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  setsDiff: number;
  pointsScored: number;
  pointsConceded: number;
  pointsDiff: number;
  // Metrics
  avgPointsPerSet: number;
  avgPointsConcededPerSet: number;
  biggestWinOpponent: string;
  biggestWinScore: string;
  biggestWinMargin?: number;
  biggestWinRound: string;
}

type SortKey =
  | "participantName"
  | "roundReached"
  | "matchesPlayed"
  | "matchesWon"
  | "pointsDiff"
  | "avgPointsPerSet";

export function ParticipantStatisticsSection({
  progression,
  stats,
  metrics
}: ParticipantStatisticsSectionProps) {
  const [sortKey, setSortKey] = useState<SortKey>("roundReached");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Combine all data by participantId
  const combinedData: CombinedParticipantData[] = progression.map((prog) => {
    const stat = stats.find((s) => s.participantId === prog.participantId);
    const metric = metrics.find((m) => m.participantId === prog.participantId);

    return {
      participantId: prog.participantId,
      participantName: prog.participantName,
      seedNumber: prog.seedNumber,
      matchesPlayed: prog.matchesPlayed,
      roundReached: prog.roundReached,
      eliminatedBy: prog.eliminatedBy,
      matchesWon: stat?.matchesWon || 0,
      matchesLost: stat?.matchesLost || 0,
      setsWon: stat?.setsWon || 0,
      setsLost: stat?.setsLost || 0,
      setsDiff: stat?.setsDiff || 0,
      pointsScored: stat?.pointsScored || 0,
      pointsConceded: stat?.pointsConceded || 0,
      pointsDiff: stat?.pointsDiff || 0,
      avgPointsPerSet: metric?.avgPointsPerSet || 0,
      avgPointsConcededPerSet: metric?.avgPointsConcededPerSet || 0,
      biggestWinOpponent: metric?.biggestWin.opponentName || "N/A",
      biggestWinScore: metric?.biggestWin.setScore || "N/A",
      biggestWinMargin: metric?.biggestWin.pointMargin,
      biggestWinRound: metric?.biggestWin.roundName || "N/A",
    };
  });

  // Get weight for round reached (for sorting)
  const getRoundWeight = (round: string): number => {
    const weights: Record<string, number> = {
      Champion: 7,
      "Runner-up": 6,
      "Semi-finalist": 5,
      "Quarter-finalist": 4,
      "Round of 16": 3,
      "Round of 32": 2,
    };
    return weights[round] || 1;
  };

  // Sort data
  const sortedData = [...combinedData].sort((a, b) => {
    const factor = sortOrder === "asc" ? 1 : -1;

    if (sortKey === "participantName") {
      return factor * a.participantName.localeCompare(b.participantName);
    }

    if (sortKey === "roundReached") {
      return factor * (getRoundWeight(a.roundReached) - getRoundWeight(b.roundReached));
    }

    return factor * ((a[sortKey] as number) - (b[sortKey] as number));
  });

  const handleSort = (key: SortKey) => {
    setSortOrder(sortKey === key && sortOrder === "desc" ? "asc" : "desc");
    setSortKey(key);
  };

  // Get display text for position
  const getPositionDisplayText = (position: string) => {
    switch (position) {
      case "Champion":
        return "Gold";
      case "Runner-up":
        return "Silver";
      default:
        return position;
    }
  };

  // Get badge color for position
  const getPositionBadgeClass = (position: string) => {
    switch (position) {
      case "Champion":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Runner-up":
        return "bg-slate-200 text-slate-800 border-slate-300";
      case "Semi-finalist":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Quarter-finalist":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="w-full flex flex-col border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-white">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-slate-900" />
          <h2 className="text-[10px] font-black uppercase tracking-tighter text-slate-800">
            Participant Statistics
          </h2>
        </div>
        <div className="text-[9px] font-mono font-bold text-slate-400">
          {sortedData.length} Participants
        </div>
      </div>

      {/* Scrollable Table */}
      <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-200">
        <Table className="border-collapse min-w-200 lg:min-w-full">
          <TableHeader className="bg-slate-50/80 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent border-b">
              {/* Sticky Participant Name Column */}
              <TableHead
                 className="sticky left-0 bg-slate-50 z-10 h-7 px-3 text-[9px] font-bold uppercase text-slate-500 border-r"
               >
                 Participant
               </TableHead>

               {/* Final Status */}
               <TableHead
                 className="h-7 px-3 text-[9px] font-bold uppercase text-slate-500"
               >
                 Final Status
               </TableHead>

               {/* MP */}
               <TableHead
                 className="h-7 px-2 text-center text-[9px] font-bold uppercase text-slate-500"
               >
                 MP
               </TableHead>

               {/* Record */}
               <TableHead
                 className="h-7 px-2 text-center text-[9px] font-bold uppercase text-slate-500"
               >
                 Record
               </TableHead>

               {/* Sets */}
               <TableHead className="h-7 px-2 text-center text-[9px] font-bold uppercase text-slate-500">
                 Sets
               </TableHead>

               {/* Set +/- */}
               <TableHead className="h-7 px-2 text-center text-[9px] font-bold uppercase text-slate-500">
                 Set +/-
               </TableHead>

               {/* Points */}
               <TableHead
                 className="h-7 px-2 text-center text-[9px] font-bold uppercase text-slate-500"
               >
                 Points
               </TableHead>

               {/* Point +/- */}
               <TableHead
                 className="h-7 px-2 text-center text-[9px] font-bold uppercase text-slate-500"
               >
                 Point +/-
               </TableHead>

               {/* Avg PTS/Set */}
               <TableHead
                 className="h-7 px-2 text-center text-[9px] font-bold uppercase text-slate-500"
               >
                 PTS/Set
               </TableHead>

              {/* Avg CON/Set */}
              <TableHead className="h-7 px-2 text-center text-[9px] font-bold uppercase text-slate-500">
                CON/Set
              </TableHead>

              {/* Peak Win */}
              <TableHead className="h-7 px-3 text-[9px] font-bold uppercase text-slate-500">
                Peak Win
              </TableHead>

              {/* Peak Round */}
              <TableHead className="h-7 px-3 text-[9px] font-bold uppercase text-slate-500">
                Peak Round
              </TableHead>

              {/* Eliminated By */}
              <TableHead className="h-7 px-3 text-[9px] font-bold uppercase text-slate-500">
                Eliminated By
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedData.map((participant) => (
              <TableRow
                key={participant.participantId}
                className="group border-b last:border-0"
              >
                {/* Participant Name (Sticky) */}
                <TableCell className="sticky left-0 bg-white z-10 py-1.5 px-3 border-r">
                  <div className="flex items-center gap-2">
                    {participant.seedNumber && (
                      <span className="text-[9px] font-mono text-slate-400">
                        #{participant.seedNumber}
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-slate-900 whitespace-nowrap">
                      {participant.participantName}
                    </span>
                  </div>
                </TableCell>

                {/* Final Status */}
                <TableCell className="py-1.5 px-3">
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-tight whitespace-nowrap",
                    getPositionBadgeClass(participant.roundReached)
                  )}>
                    {getPositionDisplayText(participant.roundReached)}
                  </span>
                </TableCell>

                {/* MP */}
                <TableCell className="py-1.5 px-2 text-center font-mono text-[11px] font-semibold text-slate-700">
                  {participant.matchesPlayed}
                </TableCell>

                {/* Record (W-L) */}
                <TableCell className="py-1.5 px-2 text-center">
                  <div className="inline-flex items-baseline gap-1">
                    <span className="text-[11px] font-mono font-black text-emerald-600">
                      {participant.matchesWon}
                    </span>
                    <span className="text-[9px] text-slate-300">-</span>
                    <span className="text-[11px] font-mono font-black text-rose-600">
                      {participant.matchesLost}
                    </span>
                  </div>
                </TableCell>

                {/* Sets */}
                <TableCell className="py-1.5 px-2 text-center">
                  <span className="text-[10px] font-mono text-slate-600">
                    {participant.setsWon}-{participant.setsLost}
                  </span>
                </TableCell>

                {/* Set +/- */}
                <TableCell className="py-1.5 px-2 text-center">
                  <span className={cn(
                    "text-[10px] font-mono font-bold",
                    participant.setsDiff > 0 ? "text-blue-600" :
                    participant.setsDiff < 0 ? "text-rose-500" : "text-slate-400"
                  )}>
                    {participant.setsDiff > 0 ? `+${participant.setsDiff}` : participant.setsDiff}
                  </span>
                </TableCell>

                {/* Points */}
                <TableCell className="py-1.5 px-2 text-center">
                  <span className="text-[11px] font-mono font-black text-slate-900">
                    {participant.pointsScored}
                  </span>
                </TableCell>

                {/* Point +/- */}
                <TableCell className="py-1.5 px-2 text-center">
                  <span className={cn(
                    "text-[10px] font-mono font-bold",
                    participant.pointsDiff > 0 ? "text-emerald-600" :
                    participant.pointsDiff < 0 ? "text-rose-500" : "text-slate-400"
                  )}>
                    {participant.pointsDiff > 0 ? `+${participant.pointsDiff}` : participant.pointsDiff}
                  </span>
                </TableCell>

                {/* Avg PTS/Set */}
                <TableCell className="py-1.5 px-2 text-center font-mono text-[11px] font-semibold text-blue-600">
                  {participant.avgPointsPerSet.toFixed(1)}
                </TableCell>

                {/* Avg CON/Set */}
                <TableCell className="py-1.5 px-2 text-center font-mono text-[11px] font-semibold text-slate-600">
                  {participant.avgPointsConcededPerSet.toFixed(1)}
                </TableCell>

                {/* Peak Win */}
                <TableCell className="py-1.5 px-3">
                  {participant.biggestWinOpponent !== "N/A" && participant.biggestWinOpponent ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-medium text-slate-700 whitespace-nowrap">
                        {participant.biggestWinOpponent}
                      </span>
                      {participant.biggestWinScore && participant.biggestWinScore !== "N/A" && (
                        <span className="text-[11px] font-black text-slate-900">
                          {participant.biggestWinScore}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">—</span>
                  )}
                </TableCell>

                {/* Peak Round */}
                <TableCell className="py-1.5 px-3">
                  {participant.biggestWinRound && participant.biggestWinRound !== "N/A" ? (
                    <span className="text-[10px] text-slate-600 uppercase tracking-tight">
                      {participant.biggestWinRound}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">—</span>
                  )}
                </TableCell>

                {/* Eliminated By */}
                <TableCell className="py-1.5 px-3">
                  {participant.eliminatedBy ? (
                    <span className="text-[10px] font-medium text-slate-700 whitespace-nowrap">
                      {participant.eliminatedBy.participantName}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-yellow-600">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
