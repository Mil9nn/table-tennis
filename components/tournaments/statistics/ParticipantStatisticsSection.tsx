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
      "Third Place": 5.5, // Between Runner-up (6) and Semi-finalist (5)
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
      case "Third Place":
        return "Bronze";
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
      case "Third Place":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "Semi-finalist":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Quarter-finalist":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // Get first name from full name
  const getFirstName = (fullName: string): string => {
    return fullName.split(' ')[0] || fullName;
  };

  return (
    <div className="w-full flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">

  {/* Header */}
  <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
    <div className="flex items-center gap-2">
      <TrendingUp className="w-4 h-4 text-slate-800" />
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-800">
        Participant Statistics
      </h2>
    </div>

    <div className="text-[11px] font-mono text-slate-500">
      {sortedData.length} Participants
    </div>
  </div>

  {/* Scrollable Table */}
  <div className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
    <Table className="min-w-[1100px] lg:min-w-full border-collapse">

      {/* Table Head */}
      <TableHeader className="bg-slate-50 sticky top-0 z-20">
        <TableRow className="border-b">

          <TableHead className="sticky left-0 z-30 bg-slate-50 h-9 px-2 md:px-4 text-[10px] font-semibold uppercase tracking-wide text-slate-500 border-r">
            Participant
          </TableHead>

          {[
            "Final Status","MP","Record","Sets","Set +/-","Points","Point +/-",
            "PTS/Set","CON/Set","Peak Win","Peak Round","Eliminated By"
          ].map(label => (
            <TableHead
              key={label}
              className="h-9 px-3 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500"
            >
              {label}
            </TableHead>
          ))}

        </TableRow>
      </TableHeader>

      {/* Table Body */}
      <TableBody className="divide-y">

        {sortedData.map((participant) => (
          <TableRow
            key={participant.participantId}
            className="group hover:bg-slate-50/60 transition"
          >

            {/* Participant */}
            <TableCell className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 py-2.5 px-2 md:px-4 border-r">
              <div className="flex items-center gap-2">
                {participant.seedNumber && (
                  <span className="text-[10px] font-mono text-slate-400">
                    #{participant.seedNumber}
                  </span>
                )}
                <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                  <span className="md:hidden">{getFirstName(participant.participantName)}</span>
                  <span className="hidden md:inline">{participant.participantName}</span>
                </span>
              </div>
            </TableCell>

            {/* Final Status */}
            <TableCell className="py-2.5 px-3">
              <span className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-tight",
                getPositionBadgeClass(participant.roundReached)
              )}>
                {getPositionDisplayText(participant.roundReached)}
              </span>
            </TableCell>

            {/* MP */}
            <TableCell className="py-2.5 px-3 text-center font-mono text-sm font-medium text-slate-700">
              {participant.matchesPlayed}
            </TableCell>

            {/* Record */}
            <TableCell className="py-2.5 px-3 text-center">
              <div className="inline-flex items-baseline gap-1.5">
                <span className="text-sm font-mono font-semibold text-emerald-600">
                  {participant.matchesWon}
                </span>
                <span className="text-[10px] text-slate-300">-</span>
                <span className="text-sm font-mono font-semibold text-rose-600">
                  {participant.matchesLost}
                </span>
              </div>
            </TableCell>

            {/* Sets */}
            <TableCell className="py-2.5 px-3 text-center text-[11px] font-mono text-slate-600">
              {participant.setsWon}-{participant.setsLost}
            </TableCell>

            {/* Set +/- */}
            <TableCell className="py-2.5 px-3 text-center">
              <span className={cn(
                "text-[11px] font-mono font-semibold",
                participant.setsDiff > 0 ? "text-blue-600" :
                participant.setsDiff < 0 ? "text-rose-500" : "text-slate-400"
              )}>
                {participant.setsDiff > 0 ? `+${participant.setsDiff}` : participant.setsDiff}
              </span>
            </TableCell>

            {/* Points */}
            <TableCell className="py-2.5 px-3 text-center text-sm font-mono font-semibold text-slate-900">
              {participant.pointsScored}
            </TableCell>

            {/* Point +/- */}
            <TableCell className="py-2.5 px-3 text-center">
              <span className={cn(
                "text-[11px] font-mono font-semibold",
                participant.pointsDiff > 0 ? "text-emerald-600" :
                participant.pointsDiff < 0 ? "text-rose-500" : "text-slate-400"
              )}>
                {participant.pointsDiff > 0 ? `+${participant.pointsDiff}` : participant.pointsDiff}
              </span>
            </TableCell>

            {/* Avg PTS / Set */}
            <TableCell className="py-2.5 px-3 text-center text-sm font-mono font-medium text-blue-600">
              {participant.avgPointsPerSet.toFixed(1)}
            </TableCell>

            {/* Avg CON / Set */}
            <TableCell className="py-2.5 px-3 text-center text-sm font-mono font-medium text-slate-600">
              {participant.avgPointsConcededPerSet.toFixed(1)}
            </TableCell>

            {/* Peak Win */}
            <TableCell className="py-2.5 px-3">
              {participant.biggestWinOpponent !== "N/A" && participant.biggestWinOpponent ? (
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-medium text-slate-700">
                    {participant.biggestWinOpponent}
                  </span>
                  {participant.biggestWinScore && participant.biggestWinScore !== "N/A" && (
                    <span className="text-sm font-semibold text-slate-900">
                      {participant.biggestWinScore}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </TableCell>

            {/* Peak Round */}
            <TableCell className="py-2.5 px-3 text-xs uppercase tracking-wide text-slate-600">
              {participant.biggestWinRound && participant.biggestWinRound !== "N/A"
                ? participant.biggestWinRound
                : "—"}
            </TableCell>

            {/* Eliminated By */}
            <TableCell className="py-2.5 px-3">
              {participant.eliminatedBy ? (
                <span className="text-xs font-medium text-slate-700">
                  {participant.eliminatedBy.participantName}
                </span>
              ) : (
                <span className="text-xs font-semibold text-yellow-600">—</span>
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
