"use client";

import { useState } from "react";
import {
  ParticipantProgression,
  ParticipantStats,
  PerformanceMetrics
} from "@/types/knockoutStatistics.type";
import { TrendingUp, ChevronDown, ChevronRight } from "lucide-react";
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

  const toggleRow = (participantId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(participantId)) {
      newExpanded.delete(participantId);
    } else {
      newExpanded.add(participantId);
    }
    setExpandedRows(newExpanded);
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

  // Get text color for position
  const getPositionTextColor = (position: string) => {
    switch (position) {
      case "Champion":
        return "text-amber-600";
      case "Runner-up":
        return "text-slate-500";
      case "Third Place":
        return "text-orange-600";
      default:
        return "text-slate-600";
    }
  };

  // Get badge color for position
  const getPositionBadgeClass = (position: string) => {
    switch (position) {
      case "Champion":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Runner-up":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "Third Place":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Semi-finalist":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Quarter-finalist":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  // Get row background color for top 3 positions
  const getRowBackgroundClass = (position: string) => {
    switch (position) {
      case "Champion":
        return "bg-gradient-to-r from-amber-50/80 to-amber-50/40 border-l-4 border-l-amber-400";
      case "Runner-up":
        return "bg-gradient-to-r from-slate-50/80 to-slate-50/40 border-l-4 border-l-slate-400";
      case "Third Place":
        return "bg-gradient-to-r from-orange-50/80 to-orange-50/40 border-l-4 border-l-orange-400";
      default:
        return "";
    }
  };

  // Get first name from full name
  const getFirstName = (fullName: string): string => {
    return fullName.split(' ')[0] || fullName;
  };

  return (
    <div className="w-full bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Knockout Stage Statistics
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {sortedData.length} Participants
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table className="w-full border-collapse">
          {/* Table Head */}
          <TableHeader className="bg-slate-50/50 border-b border-slate-200/60">
            <TableRow className="hover:bg-slate-50/50">
              <TableHead className="h-12 px-4 text-left">
                <span className="text-xs font-semibold text-slate-700 tracking-wide">
                  Participant
                </span>
              </TableHead>
              <TableHead className="h-12 px-4 text-left">
                <span className="text-xs font-semibold text-slate-700 tracking-wide">
                  Status
                </span>
              </TableHead>
              <TableHead className="h-12 px-4 text-center">
                <span className="text-xs font-semibold text-slate-700 tracking-wide">
                  Record
                </span>
              </TableHead>
              <TableHead className="h-12 px-4 text-center">
                <span className="text-xs font-semibold text-slate-700 tracking-wide">
                  Eliminated By
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>

      {/* Table Body */}
      <TableBody>
        {sortedData.map((participant) => {
          const isExpanded = expandedRows.has(participant.participantId);
          
          return (
            <React.Fragment key={participant.participantId}>
              <TableRow
                className={cn(
                  "cursor-pointer transition-all duration-200 border-b border-slate-200/60 hover:bg-slate-50/30",
                  getRowBackgroundClass(participant.roundReached)
                )}
                onClick={() => toggleRow(participant.participantId)}
              >
                {/* Participant */}
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all duration-200">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <span className="text-sm font-semibold text-slate-900">
                      {participant.participantName}
                    </span>
                  </div>
                </TableCell>

                {/* Final Status */}
                <TableCell className="px-4 py-3 text-left">
                  <span className={cn(
                    "text-xs font-medium",
                    getPositionTextColor(participant.roundReached)
                  )}>
                    {getPositionDisplayText(participant.roundReached)}
                  </span>
                </TableCell>

                {/* Record */}
                <TableCell className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-bold text-emerald-600">
                      {participant.matchesWon}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">—</span>
                    <span className="text-sm font-bold text-rose-600">
                      {participant.matchesLost}
                    </span>
                  </div>
                </TableCell>

                {/* Eliminated By */}
                <TableCell className="px-4 py-3 text-left">
                  {participant.eliminatedBy ? (
                    <span className="text-xs font-medium text-slate-600">
                      {participant.eliminatedBy.participantName}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </TableCell>
              </TableRow>

              {/* Expanded Detail Row */}
              <AnimatePresence>
                {isExpanded && (
                  <TableRow>
                    <TableCell 
                      colSpan={4} 
                      className={cn(
                        "p-0 border-b border-slate-200/60",
                        participant.roundReached === "Champion" ? "bg-amber-50/40" :
                        participant.roundReached === "Runner-up" ? "bg-slate-50/40" :
                        participant.roundReached === "Third Place" ? "bg-orange-50/40" :
                        "bg-slate-50/30"
                      )}
                    >
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="max-h-[60vh] max-w-[calc(100vw-2rem)] overflow-x-auto overflow-y-auto p-6 space-y-4">
                          {/* Match Statistics */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Matches Played
                              </span>
                              <span className="text-sm font-medium text-slate-900">
                                {participant.matchesPlayed}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Record
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-emerald-600">
                                  {participant.matchesWon}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">—</span>
                                <span className="text-sm font-medium text-rose-600">
                                  {participant.matchesLost}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Sets Statistics */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Sets
                              </span>
                              <span className="text-sm font-medium text-slate-900">
                                {participant.setsWon} - {participant.setsLost}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Set Difference
                              </span>
                              <span className={cn(
                                "text-sm font-medium",
                                participant.setsDiff > 0 ? "text-emerald-600" :
                                participant.setsDiff < 0 ? "text-rose-600" : "text-slate-900"
                              )}>
                                {participant.setsDiff > 0 ? `+${participant.setsDiff}` : participant.setsDiff}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Points Scored
                              </span>
                              <span className="text-sm font-medium text-slate-900">
                                {participant.pointsScored}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Points Conceded
                              </span>
                              <span className="text-sm font-medium text-slate-900">
                                {participant.pointsConceded}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Points Difference
                              </span>
                              <span className={cn(
                                "text-sm font-medium",
                                participant.pointsDiff > 0 ? "text-emerald-600" :
                                participant.pointsDiff < 0 ? "text-rose-600" : "text-slate-900"
                              )}>
                                {participant.pointsDiff > 0 ? `+${participant.pointsDiff}` : participant.pointsDiff}
                              </span>
                            </div>
                          </div>

                          {/* Performance Metrics */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Avg Points/Set
                              </span>
                              <span className="text-sm font-medium text-blue-600">
                                {participant.avgPointsPerSet.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Avg Conceded/Set
                              </span>
                              <span className="text-sm font-medium text-slate-900">
                                {participant.avgPointsConcededPerSet.toFixed(1)}
                              </span>
                            </div>
                            {participant.biggestWinOpponent !== "N/A" && participant.biggestWinOpponent && (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Biggest Win
                                  </span>
                                  <span className="text-sm font-medium text-slate-900 text-right">
                                    {participant.biggestWinOpponent}
                                    {participant.biggestWinScore && participant.biggestWinScore !== "N/A" && (
                                      <span className="ml-2 text-slate-600">
                                        ({participant.biggestWinScore})
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Peak Round
                                  </span>
                                  <span className="text-sm font-medium text-slate-900 uppercase">
                                    {participant.biggestWinRound !== "N/A" ? participant.biggestWinRound : "—"}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  </div>
</div>

  );
}
