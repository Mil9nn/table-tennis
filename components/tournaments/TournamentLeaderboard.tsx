"use client";

import { useState, useEffect } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Eye, Award, Flame } from "lucide-react";

interface DetailedPlayerStats {
  participant: {
    _id: string;
    username: string;
    fullName: string;
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
  qualificationInfo?: {
    status: "qualified" | "eliminated" | "in_contention" | "pending";
    fromGroup?: string;
    groupRank?: number;
    advancementPosition?: number;
  };
  matchHistory: {
    matchId: string;
    opponent: {
      _id: string;
      username: string;
      fullName: string;
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
      fullName: string;
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
  seedingInfo?: {
    seedNumber: number;
    seedingRank?: number;
    seedingPoints?: number;
  };
}

interface TournamentLeaderboardProps {
  tournamentId: string;
}

export default function TournamentLeaderboard({
  tournamentId,
}: TournamentLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<{
    tournament: any;
    leaderboard: DetailedPlayerStats[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] =
    useState<DetailedPlayerStats | null>(null);
  const [showPlayerDialog, setShowPlayerDialog] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [tournamentId]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(
        `tournaments/${tournamentId}/leaderboard/detailed`
      );
      setLeaderboardData(data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPlayerDisplayName = (player: {
    username: string;
    fullName?: string;
  }) => {
    return player.fullName;
  };

  const getStreakDisplay = (streak: number) => {
    if (streak === 0) return <span className="text-slate-400 text-[11px]">-</span>;
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
        {Math.abs(streak)}{isWinStreak ? "W" : "L"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!leaderboardData) {
    return (
      <div className="text-center text-muted-foreground">
        No leaderboard data available
      </div>
    );
  }

  return (
    <>
      <section className="shadow-sm">
        <div className="border-b border-slate-200 p-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-slate-700">
                  Tournament Leaderboard
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Final standings from knockout stage
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="text-[12px]">
            <TableHeader>
              <TableRow className="bg-slate-50/80 border-b border-slate-200">
                <TableHead className="text-center font-medium text-[11px] text-slate-600 w-16">Rank</TableHead>
                <TableHead className="font-medium text-[11px] text-slate-600">Player</TableHead>
                <TableHead className="text-center font-medium text-[11px] text-slate-600">MP</TableHead>
                <TableHead className="text-center font-medium text-[11px] text-slate-600">Record</TableHead>
                <TableHead className="text-center font-medium text-[11px] text-slate-600">WR</TableHead>
                <TableHead className="text-center font-medium text-[11px] text-slate-600">Sets</TableHead>
                <TableHead className="text-center font-medium text-[11px] text-slate-600">Points</TableHead>
                <TableHead className="text-center font-medium text-[11px] text-slate-600">Pts/M</TableHead>
                <TableHead className="text-center font-medium text-[11px] text-slate-600">Streak</TableHead>
                <TableHead className="text-right font-medium text-[11px] text-slate-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.leaderboard.map((player) => {
                const isTopOne = player.standing.rank <= 1;
                return (
                  <TableRow
                    key={player.participant._id}
                    className={`transition-all ${
                      isTopOne ? "bg-yellow-100 hover:bg-yellow-300" : "hover:bg-slate-50"
                    }`}
                  >
                    <TableCell className="text-center">
                      {player.standing.rank === 1 ? (
                        <div className="flex items-center justify-center gap-1 text-amber-600 font-semibold">
                          <Award className="w-3 h-3" />
                          1
                        </div>
                      ) : player.standing.rank === 2 ? (
                        <div className="flex items-center justify-center gap-1 text-slate-500 font-semibold text-[12px]">
                          <Award className="w-3 h-3" />
                          2
                        </div>
                      ) : player.standing.rank === 3 ? (
                        <div className="flex items-center justify-center gap-1 text-amber-700 font-semibold text-[12px]">
                          <Award className="w-3 h-3" />
                          3
                        </div>
                      ) : (
                        <div className="text-slate-400 text-[12px]">{player.standing.rank}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage
                            src={player.participant.profileImage}
                            alt={player.participant.username}
                          />
                          <AvatarFallback className="text-[10px]">
                            {player.participant.username
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col leading-tight">
                          <span className="text-[13px] font-medium text-slate-700">
                            {getPlayerDisplayName(player.participant)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            @{player.participant.username}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-slate-700">
                      {player.standing.played}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-green-600 font-medium">
                          {player.standing.won}
                        </span>
                        <span className="text-slate-400">-</span>
                        <span className="text-red-600 font-medium">
                          {player.standing.lost}
                        </span>
                        {player.standing.drawn > 0 && (
                          <>
                            <span className="text-slate-400">-</span>
                            <span className="text-slate-600 font-medium">
                              {player.standing.drawn}
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-slate-700 font-medium">
                      {player.advancedStats.winRate.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-slate-700">
                          {player.standing.setsWon}-{player.standing.setsLost}
                        </span>
                        <span
                          className={`text-[10px] ${
                            player.standing.setsDiff > 0
                              ? "text-green-600"
                              : player.standing.setsDiff < 0
                              ? "text-red-600"
                              : "text-slate-500"
                          }`}
                        >
                          {player.standing.setsDiff > 0 && "+"}
                          {player.standing.setsDiff}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-slate-700">{player.standing.pointsScored}</span>
                        <span
                          className={`text-[10px] ${
                            player.standing.pointsDiff > 0
                              ? "text-green-600"
                              : player.standing.pointsDiff < 0
                              ? "text-red-600"
                              : "text-slate-500"
                          }`}
                        >
                          {player.standing.pointsDiff > 0 && "+"}
                          {player.standing.pointsDiff}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <p className="text-xs text-slate-700">
                        {player.advancedStats.pointsPerMatch.toFixed(1)}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStreakDisplay(player.advancedStats.currentStreak)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPlayer(player);
                          setShowPlayerDialog(true);
                        }}
                        className="h-7 text-[11px] px-2 text-slate-600 hover:text-slate-900"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

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
                  <TabsTrigger value="matches" className="text-[12px]">Match History</TabsTrigger>
                  <TabsTrigger value="h2h" className="text-[12px]">Head-to-Head</TabsTrigger>
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
                                {match.groupId ? "Group Stage" : "Knockout"}
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
    </>
  );
}
