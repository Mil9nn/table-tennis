"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Users, Medal, Crown } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import { Skeleton } from "@/components/ui/skeleton";

interface IndividualStats {
  player: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  setsWon: number;
  setsLost: number;
  recentMatches: string[];
}

interface TeamStats {
  teamName: string;
  city?: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  tiesWon: number;
  tiesLost: number;
  recentMatches: string[];
}

export default function LeaderboardPage() {
  const [individualLeaderboard, setIndividualLeaderboard] = useState<IndividualStats[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamStats[]>([]);
  const [loadingIndividual, setLoadingIndividual] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    fetchIndividualLeaderboard();
    fetchTeamLeaderboard();
  }, []);

  const fetchIndividualLeaderboard = async () => {
    try {
      const { data } = await axiosInstance.get("/leaderboard/individual");
      setIndividualLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error("Error fetching individual leaderboard:", error);
    } finally {
      setLoadingIndividual(false);
    }
  };

  const fetchTeamLeaderboard = async () => {
    try {
      const { data } = await axiosInstance.get("/leaderboard/team");
      setTeamLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error("Error fetching team leaderboard:", error);
    } finally {
      setLoadingTeam(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-[#CD7F32]" />;
    return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            Leaderboards
          </h1>
        </div>
        <p className="text-gray-600">Top performers across matches</p>
      </div>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto h-fit" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <TabsTrigger value="individual" className="gap-2 p-2">
            Individual
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2 p-2">
            Teams
          </TabsTrigger>
        </TabsList>

        {/* Individual Leaderboard */}
        <TabsContent value="individual" className="space-y-4 mt-6">
          {loadingIndividual ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-15 w-full" />
              ))}
            </div>
          ) : individualLeaderboard.length === 0 ? (
            <div>
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 font-medium">No completed matches yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Play your first match to appear on the leaderboard
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {individualLeaderboard.map((stats, index) => {
                const rank = index + 1;
                const isTopThree = rank <= 3;

                return (
                  <Card
                    key={stats.player._id}
                    className={`p-2 border-0 border-b-2 rounded-none transition-all hover:shadow-lg ${
                      isTopThree
                        ? "border-yellow-300 "
                        : ""
                    }`}
                  >
                    <CardContent>
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-12 flex items-center justify-center">
                          {getRankIcon(rank)}
                        </div>

                        {/* Player Info */}
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={stats.player.profileImage} />
                          <AvatarFallback>
                            {(stats.player.fullName || stats.player.username)
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            @{stats.player.username}
                          </p>
                          
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-6 text-xs">
                          <div className="text-center">
                            <p className="font-bold">{stats.wins}</p>
                            <p className="text-emerald-500 font-bold">W</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold">{stats.losses}</p>
                            <p className="text-rose-500 font-bold">L</p>
                          </div>
                          <div className="text-center">
                            <Badge
                              variant="outline"
                              className="font-bold text-xs rounded-full border-green-300 text-green-700"
                            >
                              {stats.winRate}%
                            </Badge>
                            <p className="text-blue-500 font-bold">WR</p>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Stats */}
                      <div className="sm:hidden flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="font-bold">{stats.wins}W</span>
                            <span className="text-gray-400 mx-1">-</span>
                            <span className="font-bold">{stats.losses}L</span>
                          </div>
                          <Badge variant="outline" className="font-bold border-green-300 bg-green-50 text-green-700">
                            {stats.winRate}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Team Leaderboard */}
        <TabsContent value="team" className="space-y-4 mt-6">
          {loadingTeam ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : teamLeaderboard.length === 0 ? (
            <div>
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 font-medium">No completed team matches yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Create a team and play your first match
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {teamLeaderboard.map((stats, index) => {
                const rank = index + 1;
                const isTopThree = rank <= 3;

                return (
                  <Card
                    key={stats.teamName}
                    className={`transition-all rounded-none p-0 border-0 ${
                      isTopThree
                        ? "border-b-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50"
                        : ""
                    }`}
                  >
                    <CardContent>
                      <div className="flex items-center gap-2">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-10 flex items-center justify-center">
                          {getRankIcon(rank)}
                        </div>

                        {/* Team Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                            {stats.teamName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {stats.teamName}
                            </h3>
                            {stats.city && (
                              <p className="text-sm text-gray-500">{stats.city}</p>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-bold text-sm">{stats.wins}</p>
                            <p className="text-gray-500 text-xs">Wins</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-sm">{stats.losses}</p>
                            <p className="text-gray-500 text-xs">Losses</p>
                          </div>
                          <div className="text-center">
                            <Badge
                              variant="outline"
                              className="font-bold text-xs border-green-300 rounded-full text-green-700"
                            >
                              {stats.winRate}%
                            </Badge>
                            <p className="text-gray-500 text-xs">Win Rate</p>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Stats */}
                      <div className="sm:hidden flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="font-bold">{stats.wins}W</span>
                            <span className="text-gray-400 mx-1">-</span>
                            <span className="font-bold">{stats.losses}L</span>
                          </div>
                          <Badge variant="outline" className="font-bold border-green-300 bg-green-50 text-green-700">
                            {stats.winRate}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}