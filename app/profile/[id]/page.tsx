"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { axiosInstance } from "@/lib/axiosInstance";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import TournamentTab from "@/app/profile/components/TournamentTab";

export default function UserProfilePage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [tournamentStats, setTournamentStats] = useState<any>(null);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchTournamentStats();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get(`/profile/${id}/stats`);
      setProfileData(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentStats = async () => {
    try {
      const res = await axiosInstance.get(`/profile/${id}/tournament-stats`);
      setTournamentStats(res.data.stats);
    } catch (err) {
      console.error("Error fetching tournament stats:", err);
    } finally {
      setLoadingTournaments(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!profileData?.success) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
          <p className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
            User not found
          </p>
        </div>
      </div>
    );
  }

  const { user, stats } = profileData;

  // Calculate derived stats
  const totalMatches = (stats.individual?.overall?.totalMatches || 0) + (stats.team?.totalMatches || 0);
  const totalWins = (stats.individual?.overall?.wins || 0) + (stats.team?.wins || 0);
  const totalLosses = (stats.individual?.overall?.losses || 0) + (stats.team?.losses || 0);
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

  return (
    <div className="max-w-6xl space-y-4">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6"
      >
        <div className="flex items-center gap-4">
          {user.profileImage ? (
            <Image
              src={user.profileImage}
              alt={user.fullName || user.username}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover border-2 border-white dark:border-zinc-800 shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
              {(user.fullName?.[0] || user.username?.[0] || "U").toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {user.fullName || user.username}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-base">
              @{user.username}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {winRate}%
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Win Rate
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2">
        {[
          {
            title: "Total Matches",
            value: totalMatches,
            subtitle: `${totalWins}W • ${totalLosses}L`,
          },
          {
            title: "Individual",
            value: stats.individual?.overall?.totalMatches || 0,
            subtitle: `${stats.individual?.overall?.wins || 0}W • ${stats.individual?.overall?.losses || 0}L`,
          },
          {
            title: "Team",
            value: stats.team?.totalMatches || 0,
            subtitle: `${stats.team?.wins || 0}W • ${stats.team?.losses || 0}L`,
          },
          {
            title: "Tournaments",
            value: tournamentStats?.overview?.totalTournaments ?? 0,
            subtitle: `${tournamentStats?.overview?.tournamentWins ?? 0} wins`,
            highlight: true,
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`p-5 rounded-xl border transition-all duration-200 ${
              item.highlight
                ? "border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40"
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-sm"
            }`}
          >
            <div className="flex items-center mb-2">
              <div className="">
                <p className={`text-2xl font-bold ${
                  item.highlight
                    ? "text-amber-900 dark:text-amber-100"
                    : "text-zinc-900 dark:text-zinc-100"
                }`}>
                  {item.value}
                </p>
                <p className={`text-xs font-medium ${
                  item.highlight
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}>
                  {item.title}
                </p>
              </div>
            </div>
            <p className={`text-xs ${
              item.highlight
                ? "text-amber-600 dark:text-amber-400"
                : "text-zinc-600 dark:text-zinc-400"
            }`}>
              {item.subtitle}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-zinc-100 dark:bg-zinc-800 p-0 rounded-none">
          <TabsTrigger 
            value="overview"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-700 rounded-none transition-all"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="tournaments"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-700 rounded-none transition-all"
          >
            Tournaments
          </TabsTrigger>
          <TabsTrigger 
            value="teams"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-700 rounded-none transition-all"
          >
            Teams
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance Summary */}
            <div className="bg-white dark:bg-zinc-900 p-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Performance Summary
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    <span>Win Rate</span>
                    <span>{winRate}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${winRate}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {totalWins}
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300">Wins</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {totalLosses}
                    </div>
                    <div className="text-xs text-red-700 dark:text-red-300">Losses</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Match Distribution */}
            <div className="dark:bg-zinc-900 p-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Match Distribution
              </h3>
              <div className="space-y-2">
                {[
                  {
                    type: "Individual",
                    count: stats.individual?.overall?.totalMatches || 0,
                    color: "bg-blue-500",
                  },
                  {
                    type: "Team",
                    count: stats.team?.totalMatches || 0,
                    color: "bg-purple-500",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {item.type}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {item.count}
                      </span>
                      <div className="w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${item.color} transition-all duration-500`}
                          style={{ 
                            width: totalMatches > 0 ? `${(item.count / totalMatches) * 100}%` : '0%' 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tournaments Tab */}
        <TabsContent value="tournaments" className="mt-6">
          {loadingTournaments ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4"></div>
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
                <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              </div>
            </div>
          ) : (
            <TournamentTab tournamentStats={tournamentStats} />
          )}
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="mt-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Team Affiliations
            </h3>
            {stats.teams?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.teams.map((team: any) => (
                  <div
                    key={team._id}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {team.name}
                      </h4>
                      <span className="text-xs px-2 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full">
                        {team.playerCount} members
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {team.role}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                  Not part of any teams
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}