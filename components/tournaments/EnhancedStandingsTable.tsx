"use client";

import React, { useState } from "react";
import { Standing } from "@/types/tournament.type";
import { axiosInstance } from "@/lib/axiosInstance";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Flame } from "lucide-react";

interface DetailedPlayerStats {
  participant: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  standing: {
    rank: number;
    played: number;
    won: number;
    lost: number;
    drawn: number;
    setsWon: number;
    setsLost: number;
    setsDiff: number;
    pointsScored: number;
    pointsConceded: number;
    pointsDiff: number;
    points: number;
    form: string[];
  };
  advancedStats: {
    winRate: number;
    setsWinRate: number;
    pointsPerMatch: number;
    avgPointsScored: number;
    avgPointsConceded: number;
    avgSetDifferential: number;
    currentStreak: number;
    longestWinStreak: number;
    dominanceRating: number;
  };
  matchHistory: {
    matchId: string;
    opponent: {
      _id: string;
      username: string;
      fullName?: string;
    };
    result: "win" | "loss" | "draw";
    score: string;
    setsWon: number;
    setsLost: number;
    pointsScored: number;
    pointsConceded: number;
    date?: Date;
    roundNumber?: number;
    groupId?: string;
  }[];
  headToHead: {
    opponentId: string;
    opponent: {
      username: string;
      fullName?: string;
    };
    matches: number;
    wins: number;
    losses: number;
    draws: number;
    setsWon: number;
    setsLost: number;
    pointsScored: number;
    pointsConceded: number;
  }[];
}

interface Props {
  standings: Standing[];
  showDetailedStats?: boolean;
  highlightTop?: number;
  groupName?: string;
  tournamentId?: string;
}

export function EnhancedStandingsTable({
  standings,
  showDetailedStats = true,
  highlightTop = 3,
  groupName,
  tournamentId,
}: Props) {
  const [selectedPlayer, setSelectedPlayer] =
    useState<DetailedPlayerStats | null>(null);
  const [showPlayerDialog, setShowPlayerDialog] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const formChip = (r: string) => {
    const base =
      "text-[10px] w-4 h-4 flex items-center justify-center rounded-[4px] font-medium";

    switch (r) {
      case "W":
        return <div className={`${base} bg-green-100 text-green-700`}>W</div>;
      case "L":
        return <div className={`${base} bg-red-100 text-red-700`}>L</div>;
      default:
        return <div className={`${base} bg-slate-200 text-slate-600`}>D</div>;
    }
  };

  const rankChip = (rank: number) => {
    if (rank <= highlightTop)
      return (
        <div className="text-indigo-600 font-semibold text-[12px]">{rank}</div>
      );

    return <div className="text-slate-400 text-[12px]">{rank}</div>;
  };

  // Import calculation utilities
  const calculateWinRate = (won: number, played: number) => {
    if (played === 0) return 0;
    return (won / played) * 100;
  };

  const calculatePointsPerMatch = (points: number, played: number) => {
    if (played === 0) return 0;
    return points / played;
  };

  const calculateStreak = (form: string[]) => {
    if (form.length === 0) return 0;
    const lastResult = form[form.length - 1];
    let streak = 0;
    for (let i = form.length - 1; i >= 0; i--) {
      if (form[i] === lastResult) {
        streak += lastResult === "W" ? 1 : lastResult === "L" ? -1 : 0;
      } else {
        break;
      }
    }
    return streak;
  };

  const getStreakDisplay = (streak: number) => {
    if (streak === 0)
      return <span className="text-slate-400 text-[11px]">-</span>;
    const isWinStreak = streak > 0;
    return (
      <Badge
        variant="outline"
        className={`text-[10px] px-1.5 py-0.5 font-semibold ${
          isWinStreak
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}
      >
        <Flame className="w-2.5 h-2.5 mr-0.5" />
        {Math.abs(streak)}
        {isWinStreak ? "W" : "L"}
      </Badge>
    );
  };

  const handleViewPlayer = async (participantId: string) => {
    if (!tournamentId) return;

    setLoadingDetails(true);
    try {
      const { data } = await axiosInstance.get(
        `tournaments/${tournamentId}/leaderboard/detailed`
      );
      const player = data.leaderboard.find(
        (p: DetailedPlayerStats) => p.participant._id === participantId
      );
      if (player) {
        setSelectedPlayer(player);
        setShowPlayerDialog(true);
      }
    } catch (error) {
      console.error("Error fetching player details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getPlayerDisplayName = (player: {
    username: string;
    fullName?: string;
  }) => {
    return player.fullName || player.username;
  };

  return (
    <div className="border border-slate-200 shadow-sm">
      {groupName && (
        <div className="border-b border-slate-200 p-4 bg-slate-50">
          <h3 className="font-semibold text-sm tracking-wide text-slate-700">
            {groupName}
          </h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className="text-[12px]">
          <TableHeader>
            <TableRow className="bg-slate-50/80 border-b border-slate-200">
              <TableHead className="text-center font-medium text-[11px] text-slate-600">
                Rank
              </TableHead>
              <TableHead className="font-medium text-[11px] text-slate-600">
                Player
              </TableHead>
              <TableHead className="text-center font-medium text-[11px] text-slate-600">
                MP
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium text-slate-600">
                W
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium text-slate-600">
                L
              </TableHead>

              {showDetailedStats && (
                <>
                  <TableHead className="text-center text-[11px] text-slate-600">
                    D
                  </TableHead>
                  <TableHead className="text-center text-[11px] text-slate-600">
                    SW
                  </TableHead>
                  <TableHead className="text-center text-[11px] text-slate-600">
                    SL
                  </TableHead>
                  <TableHead className="text-center text-[11px] text-slate-600">
                    SD
                  </TableHead>
                  <TableHead className="text-center text-[11px] text-slate-600">
                    PS
                  </TableHead>
                  <TableHead className="text-center text-[11px] text-slate-600">
                    PD
                  </TableHead>
                </>
              )}

              <TableHead className="text-center font-semibold text-[11px] text-slate-700">
                Pts
              </TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">
                WR
              </TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">
                Pts/M
              </TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">
                Streak
              </TableHead>
              <TableHead className="text-center text-[11px] text-slate-600">
                Form
              </TableHead>
              {tournamentId && (
                <TableHead className="text-right text-[11px] text-slate-600">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {standings.map((s) => {
              const highlight = s.rank <= highlightTop;

              return (
                <TableRow
                  key={s.participant._id}
                  className={`transition-all ${
                    highlight ? "bg-indigo-50/60" : "hover:bg-slate-50"
                  }`}
                >
                  {/* Rank */}
                  <TableCell className="text-center">
                    {rankChip(s.rank)}
                  </TableCell>

                  {/* Player */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage
                          src={s.participant.profileImage}
                          alt={s.participant.fullName}
                        />
                      </Avatar>
                      <div className="flex flex-col leading-tight">
                        <span className="text-[13px] font-medium text-slate-700">
                          {s.participant.fullName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          @{s.participant.username}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* MP */}
                  <TableCell className="text-center text-slate-700">
                    {s.played}
                  </TableCell>

                  {/* W */}
                  <TableCell className="text-center text-green-600 font-medium">
                    {s.won}
                  </TableCell>

                  {/* L */}
                  <TableCell className="text-center text-red-600 font-medium">
                    {s.lost}
                  </TableCell>

                  {showDetailedStats && (
                    <>
                      <TableCell className="text-center text-slate-500">
                        {s.drawn}
                      </TableCell>
                      <TableCell className="text-center">{s.setsWon}</TableCell>
                      <TableCell className="text-center">
                        {s.setsLost}
                      </TableCell>

                      <TableCell className="text-center">
                        <span
                          className={
                            s.setsDiff > 0
                              ? "text-green-600"
                              : s.setsDiff < 0
                              ? "text-red-600"
                              : "text-slate-500"
                          }
                        >
                          {s.setsDiff > 0 && "+"}
                          {s.setsDiff}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        {s.pointsScored}
                      </TableCell>

                      <TableCell className="text-center">
                        <span
                          className={
                            s.pointsDiff > 0
                              ? "text-green-600"
                              : s.pointsDiff < 0
                              ? "text-red-600"
                              : "text-slate-500"
                          }
                        >
                          {s.pointsDiff > 0 && "+"}
                          {s.pointsDiff}
                        </span>
                      </TableCell>
                    </>
                  )}

                  {/* Points */}
                  <TableCell className="text-center">
                    <Badge className="bg-indigo-100 text-indigo-700 font-semibold text-[11px] px-2 py-0.5 rounded-md">
                      {s.points}
                    </Badge>
                  </TableCell>

                  {/* Win Rate */}
                  <TableCell className="text-center text-slate-700 font-medium">
                    {calculateWinRate(s.won, s.played).toFixed(1)}%
                  </TableCell>

                  {/* Points per Match */}
                  <TableCell className="text-center text-slate-700">
                    <span className="text-xs">
                      {calculatePointsPerMatch(s.points, s.played).toFixed(1)}
                    </span>
                  </TableCell>

                  {/* Streak */}
                  <TableCell className="text-center">
                    {getStreakDisplay(calculateStreak(s.form))}
                  </TableCell>

                  {/* Form */}
                  <TableCell>
                    <div className="flex gap-1 justify-center">
                      {s.form.slice(-5).map((r, i) => (
                        <div key={i}>{formChip(r)}</div>
                      ))}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  {tournamentId && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPlayer(s.participant._id)}
                        disabled={loadingDetails}
                        className="h-7 text-[11px] px-2 text-slate-600 hover:text-slate-900"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Player Details Dialog */}
      <Dialog open={showPlayerDialog} onOpenChange={setShowPlayerDialog}>
        <DialogContent className="max-w-4xl max-h-[75vh] overflow-y-auto">
          {selectedPlayer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={selectedPlayer.participant.profileImage}
                      alt={selectedPlayer.participant.username}
                    />
                    <AvatarFallback className="text-[11px]">
                      {selectedPlayer.participant.username
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-base font-semibold text-slate-800">
                      {getPlayerDisplayName(selectedPlayer.participant)}
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      @{selectedPlayer.participant.username}
                    </div>
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-700 text-[11px] font-semibold px-2.5 py-1">
                    Rank #{selectedPlayer.standing.rank}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-[11px] text-slate-500">
                  Complete match history and head-to-head records
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="matches" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-2 h-9">
                  <TabsTrigger value="matches" className="text-[12px]">
                    Match History
                  </TabsTrigger>
                  <TabsTrigger value="h2h" className="text-[12px]">
                    Head-to-Head
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="matches" className="mt-3">
                  {selectedPlayer.matchHistory.length === 0 ? (
                    <div className="text-center text-slate-500 text-[12px] py-12">
                      No matches played yet
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {selectedPlayer.matchHistory.map((match) => (
                        <div
                          key={match.matchId}
                          className="flex items-center justify-between py-2.5 px-3 border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                match.result === "win"
                                  ? "bg-green-100 text-green-700"
                                  : match.result === "loss"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {match.result === "win"
                                ? "W"
                                : match.result === "loss"
                                ? "L"
                                : "D"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-[13px] text-slate-700 truncate">
                                vs {getPlayerDisplayName(match.opponent)}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {match.groupId ? "Group Stage" : "Round Robin"}
                                {match.roundNumber &&
                                  ` • Round ${match.roundNumber}`}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-base font-semibold text-slate-800">
                              {match.score}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {match.pointsScored}-{match.pointsConceded} pts
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="h2h" className="mt-4">
                  {selectedPlayer.headToHead.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      No head-to-head data available
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedPlayer.headToHead.map((h2h) => {
                        const winRate =
                          h2h.matches > 0 ? (h2h.wins / h2h.matches) * 100 : 0;
                        return (
                          <div
                            key={h2h.opponentId}
                            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-sm">
                                vs {getPlayerDisplayName(h2h.opponent)}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {h2h.matches}{" "}
                                {h2h.matches === 1 ? "match" : "matches"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-green-600">
                                  {h2h.wins}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  W
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-red-600">
                                  {h2h.losses}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  L
                                </span>
                              </div>
                              {h2h.draws > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-gray-600">
                                    {h2h.draws}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    D
                                  </span>
                                </div>
                              )}
                              <div className="ml-auto text-right">
                                <div className="text-sm font-semibold">
                                  {winRate.toFixed(0)}%
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Win Rate
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">
                                  Sets:
                                </span>
                                <span className="font-medium">
                                  {h2h.setsWon}-{h2h.setsLost}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">
                                  Points:
                                </span>
                                <span className="font-medium">
                                  {h2h.pointsScored}-{h2h.pointsConceded}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
