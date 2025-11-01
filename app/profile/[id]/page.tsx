"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { axiosInstance } from "@/lib/axiosInstance";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function UserProfilePage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get(`/profile/${id}`);
      setProfileData(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!profileData?.success) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center">
        <p className="text-muted-foreground text-lg font-medium">
          User not found
        </p>
      </div>
    );
  }

  const { user, stats } = profileData;

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-white via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-black p-4"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {user.profileImage ? (
            <Image
              src={user.profileImage}
              alt={user.fullName || user.username}
              width={96}
              height={96}
              className="w-12 h-12 rounded-full object-cover border border-zinc-300 dark:border-zinc-700"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
              {(user.fullName?.[0] || user.username?.[0] || "U").toUpperCase()}
            </div>
          )}

          <div className="text-left">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {user.fullName || user.username}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              @{user.username}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title: "Total Matches",
            value: stats.overall.totalMatches,
          },
          {
            title: "Win Rate",
            value:
              stats.overall.totalMatches > 0
                ? `${Math.round(
                    (stats.overall.totalWins / stats.overall.totalMatches) * 100
                  )}%`
                : "0%",
          },
          {
            title: "Record",
            value: `${stats.overall.totalWins}W - ${stats.overall.totalLosses}L`,
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-lg text-center border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 backdrop-blur-sm transition-all duration-200"
          >
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {item.title}
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {item.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-[400px] mx-auto mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Individual Matches */}
            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 transition-all duration-200">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Individual Matches
              </h2>
              <div className="space-y-2">
                {[
                  { label: "Total", value: stats.individual.total },
                  {
                    label: "Wins",
                    value: stats.individual.wins,
                    color: "text-green-600",
                  },
                  {
                    label: "Losses",
                    value: stats.individual.losses,
                    color: "text-red-600",
                  },
                ].map((s, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {s.label}
                    </span>
                    <span
                      className={`font-medium ${
                        s.color || "text-zinc-800 dark:text-zinc-100"
                      }`}
                    >
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Matches */}
            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 transition-all duration-200">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Team Matches
              </h2>
              <div className="space-y-2">
                {[
                  { label: "Total", value: stats.team.total },
                  {
                    label: "Wins",
                    value: stats.team.wins,
                    color: "text-green-600",
                  },
                  {
                    label: "Losses",
                    value: stats.team.losses,
                    color: "text-red-600",
                  },
                ].map((s, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {s.label}
                    </span>
                    <span
                      className={`font-medium ${
                        s.color || "text-zinc-800 dark:text-zinc-100"
                      }`}
                    >
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Teams */}
        <TabsContent value="teams">
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 transition-all duration-200">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Teams
            </h2>
            {stats.teams.length > 0 ? (
              <div className="space-y-2 w-fit">
                {stats.teams.map((team: any) => (
                  <div
                    key={team._id}
                    className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all duration-150"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {team.name}
                      </p>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {team.playerCount} players
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {team.role}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Not part of any teams
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
