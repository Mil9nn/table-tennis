"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Crown, Flame, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { axiosInstance } from "@/lib/axiosInstance";

interface GlobalPlayerStats {
  player: {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
  };
  rank: number;
  overallStats: {
    totalMatches: number;
    totalWins: number;
    totalLosses: number;
    totalDraws: number;
    winRate: number;
    setsWon: number;
    setsLost: number;
    setsDiff: number;
    pointsScored: number;
    pointsConceded: number;
    pointsDiff: number;
    currentStreak: number;
    longestWinStreak: number;
  };
  tournamentStats: {
    tournamentsPlayed: number;
    tournamentsWon: number;
    podiumFinishes: number;
    averageRank: number;
    bestFinish: number;
    tournamentWinRate: number;
  };
  recentPerformance: {
    last7Days: {
      matches: number;
      wins: number;
      winRate: number;
    };
    last30Days: {
      matches: number;
      wins: number;
      winRate: number;
    };
  };
  performanceRating: number;
}

export default function GlobalLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<GlobalPlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchType, setMatchType] = useState("all");
  const [selectedPlayer, setSelectedPlayer] =
    useState<GlobalPlayerStats | null>(null);
  const [showPlayerDialog, setShowPlayerDialog] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [matchType]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosInstance.get(
        `/leaderboard/global?matchType=${matchType}`
      );
      
      setLeaderboard(data.leaderboard || []);
    } catch (error: any) {
      console.error("Error fetching global leaderboard:", error);
      setError(error.response?.data?.error || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const getPlayerDisplayName = (player: {
    username?: string;
    fullName?: string;
  }) => {
    if (player.fullName) {
      return player.fullName;
    }
    return player.username;
  };

  const getRankBadge = (rank: number) => {
    return <div className="font-semibold">{rank}</div>;
  };

  const getStreakDisplay = (streak: number) => {
    if (streak === 0) return null;
    const isWinStreak = streak > 0;
    return (
      <Badge
        variant="outline"
        className={
          isWinStreak
            ? "bg-green-50 text-green-700 border-green-300"
            : "bg-red-50 text-red-700 border-red-300"
        }
      >
        <Flame className="w-3 h-3 mr-1" />
        {Math.abs(streak)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="pt-6">
        <div className="flex items-center justify-center h-[calc(100vh-150px)]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-lg font-medium text-red-600">
          Error Loading Leaderboard
        </p>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
        <Button onClick={fetchLeaderboard} variant="outline" className="">
          Try Again
        </Button>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mb-4 opacity-50" />
            <p className="text-lg font-medium text-gray-600">
              No Data Available
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Complete some matches or tournaments to appear on the global
              leaderboard
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="">
        <div>
          <header className="px-4 p-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="flex items-center gap-2 font-semibold">
                Global Leaderboard
              </h2>
              <Select value={matchType} onValueChange={setMatchType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Match Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Matches</SelectItem>
                  <SelectItem value="singles">Singles</SelectItem>
                  <SelectItem value="doubles">Doubles</SelectItem>
                  <SelectItem value="mixed_doubles">Mixed Doubles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </header>
        </div>

        {leaderboard.length >= 3 && (
          <Card className="rounded-none p-2">
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                {leaderboard[1] && (
                  <div className="flex flex-col items-center pt-6">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-gray-400">
                        <AvatarImage src={leaderboard[1].player.profileImage} />
                        <AvatarFallback>
                          {leaderboard[1].player.username
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-0 -right-2 bg-gray-400 text-white rounded-full w-5 h-5 flex items-center justify-center font-semibold text-xs">
                        2
                      </div>
                    </div>
                    <p className="font-semibold mt-2 text-center text-sm">
                      {getPlayerDisplayName(leaderboard[1].player)}
                    </p>
                  </div>
                )}

                {leaderboard[0] && (
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <Avatar className="h-15 w-15 border-2 border-yellow-400">
                        <AvatarImage src={leaderboard[0].player.profileImage} />
                        <AvatarFallback>
                          {leaderboard[0].player.username
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                        <Crown className="w-5 h-5 text-yellow-500 bg-yellow-100 p-1 rounded-full" />
                      </div>
                    </div>
                    <p className="font-semibold text-sm mt-2 text-center">
                      {getPlayerDisplayName(leaderboard[0].player)}
                    </p>
                  </div>
                )}

                {leaderboard[2] && (
                  <div className="flex flex-col items-center pt-6">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-amber-700">
                        <AvatarImage src={leaderboard[2].player.profileImage} />
                        <AvatarFallback>
                          {leaderboard[2].player.username
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-0 -right-2 bg-amber-700 text-white rounded-full w-5 h-5 flex items-center justify-center font-semibold text-xs">
                        3
                      </div>
                    </div>
                    <p className="font-semibold mt-2 text-center text-sm">
                      {getPlayerDisplayName(leaderboard[2].player)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-none p-0">
          <CardContent className="p-0">
            <div className="divide-y">
              {leaderboard.map((player) => (
                <div
                  key={player.player._id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    player.rank <= 3 ? "bg-muted/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 font-semibold">
                      {player.rank}
                    </div>

                    <Avatar className="h-10 w-10">
                      <AvatarImage src={player.player.profileImage} />
                      <AvatarFallback>
                        {player.player.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {getPlayerDisplayName(player.player)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {player.performanceRating} pts
                      </p>
                    </div>

                    <div className="hidden lg:grid grid-cols-4 gap-8 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Record</p>
                        <p className="font-semibold text-sm">
                          {player.overallStats.totalWins}-
                          {player.overallStats.totalLosses}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Win Rate
                        </p>
                        <p className="font-semibold text-sm text-green-600">
                          {player.overallStats.winRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Tournaments
                        </p>
                        <p className="font-semibold text-sm">
                          {player.tournamentStats.tournamentsWon}/
                          {player.tournamentStats.tournamentsPlayed}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Streak</p>
                        <div className="flex justify-center">
                          {getStreakDisplay(
                            player.overallStats.currentStreak
                          ) || <span className="text-sm text-gray-400">-</span>}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPlayer(player);
                        setShowPlayerDialog(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="lg:hidden mt-3 pt-3 border-t grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Record</p>
                      <p className="font-semibold text-sm">
                        {player.overallStats.totalWins}-
                        {player.overallStats.totalLosses}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                      <p className="font-semibold text-sm text-green-600">
                        {player.overallStats.winRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Tournaments
                      </p>
                      <p className="font-semibold text-sm">
                        {player.tournamentStats.tournamentsWon}/
                        {player.tournamentStats.tournamentsPlayed}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPlayerDialog} onOpenChange={setShowPlayerDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedPlayer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedPlayer.player.profileImage} />
                    <AvatarFallback>
                      {selectedPlayer.player.username
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div>{getPlayerDisplayName(selectedPlayer.player)}</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      Global Rank #{selectedPlayer.rank}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Overall Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 shadow-sm border rounded-lg">
                          <div className="text-xl font-bold">
                            {selectedPlayer.overallStats.totalMatches}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Matches
                          </div>
                        </div>
                        <div className="text-center p-4 bg-green-50 shadow-sm rounded-lg">
                          <div className="text-xl font-bold text-green-600">
                            {selectedPlayer.overallStats.totalWins}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Wins
                          </div>
                        </div>
                        <div className="text-center p-4 bg-red-50 shadow-sm rounded-lg">
                          <div className="text-xl font-bold text-red-600">
                            {selectedPlayer.overallStats.totalLosses}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Losses
                          </div>
                        </div>
                        <div className="text-center p-4 shadow-sm rounded-lg">
                          <div className="text-xl font-bold text-blue-600">
                            {selectedPlayer.performanceRating}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Rating
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Win Rate</span>
                          <span className="text-sm font-bold">
                            {selectedPlayer.overallStats.winRate.toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={selectedPlayer.overallStats.winRate}
                          className="h-2"
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-3 shadow-sm rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">
                            Sets Won/Lost
                          </div>
                          <div className="text-lg font-bold">
                            {selectedPlayer.overallStats.setsWon}/
                            {selectedPlayer.overallStats.setsLost}
                          </div>
                        </div>
                        <div className="p-3 shadow-sm rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">
                            Current Streak
                          </div>
                          <div className="text-lg font-bold">
                            {selectedPlayer.overallStats.currentStreak > 0 &&
                              "+"}
                            {selectedPlayer.overallStats.currentStreak}
                          </div>
                        </div>
                        <div className="p-3 shadow-sm rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">
                            Best Streak
                          </div>
                          <div className="text-lg font-bold flex items-center gap-1">
                            <Flame className="w-4 h-4 text-orange-500" />
                            {selectedPlayer.overallStats.longestWinStreak}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tournaments" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Tournament Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-yellow-50 shadow-sm rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            {selectedPlayer.tournamentStats.tournamentsWon}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Tournaments Won
                          </div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 shadow-sm rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedPlayer.tournamentStats.podiumFinishes}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Podium Finishes
                          </div>
                        </div>
                        <div className="text-center p-4 bg-green-50 shadow-sm rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {selectedPlayer.tournamentStats.tournamentsPlayed}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Tournaments Played
                          </div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 shadow-sm rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            #
                            {selectedPlayer.tournamentStats.bestFinish || "N/A"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Best Finish
                          </div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 shadow-sm rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {selectedPlayer.tournamentStats.averageRank.toFixed(
                              1
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Avg Rank
                          </div>
                        </div>
                        <div className="text-center p-4 bg-teal-50 shadow-sm rounded-lg">
                          <div className="text-2xl font-bold text-teal-600">
                            {selectedPlayer.tournamentStats.tournamentWinRate.toFixed(
                              1
                            )}
                            %
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Tournament WR
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="recent" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Recent Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-3">Last 7 Days</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-xl font-bold">
                              {
                                selectedPlayer.recentPerformance.last7Days
                                  .matches
                              }
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Matches
                            </div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-xl font-bold text-green-600">
                              {selectedPlayer.recentPerformance.last7Days.wins}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Wins
                            </div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-xl font-bold text-blue-600">
                              {selectedPlayer.recentPerformance.last7Days.winRate.toFixed(
                                1
                              )}
                              %
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Win Rate
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">Last 30 Days</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-xl font-bold">
                              {
                                selectedPlayer.recentPerformance.last30Days
                                  .matches
                              }
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Matches
                            </div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-xl font-bold text-green-600">
                              {selectedPlayer.recentPerformance.last30Days.wins}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Wins
                            </div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-xl font-bold text-blue-600">
                              {selectedPlayer.recentPerformance.last30Days.winRate.toFixed(
                                1
                              )}
                              %
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Win Rate
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
