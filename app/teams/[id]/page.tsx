"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  ChevronLeft,
  Crown,
  Users,
  MapPin,
  Loader2,
  Shield,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Team = {
  _id: string;
  name: string;
  city?: string;
  logo?: string;
  captain: {
    _id: string;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  players: {
    user: {
      _id: string;
      username: string;
      fullName?: string;
      profileImage?: string;
    };
    assignment?: string;
    role?: string;
  }[];
  assignments?: Record<string, string>;
};

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await axiosInstance.get(`/teams/${teamId}`);
        setTeam(response.data.team);
      } catch (error) {
        console.error("Failed to fetch team:", error);
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      fetchTeam();
    }
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Team Not Found
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            This team doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/teams")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  const isCaptain = (playerId: string) => {
    return team.captain._id.toString() === playerId.toString();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
          <div className="flex-1">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">Team Details</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{team.name}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Team Header Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6">
            <div className="flex items-center gap-4">
              {/* Team Logo */}
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                {team.logo ? (
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Shield className="w-10 h-10 text-white" />
                )}
              </div>

              {/* Team Info */}
              <div className="flex-1 text-white">
                <h1 className="text-2xl font-bold mb-1">{team.name}</h1>
                {team.city && (
                  <div className="flex items-center gap-1 text-white/80 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{team.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Stats */}
          <div className="p-6 grid grid-cols-3 gap-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {team.players.length}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Players</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {team.captain.fullName || team.captain.username}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Captain</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {Object.keys(team.assignments || {}).length}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Assignments</p>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Players ({team.players.length})
            </h2>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {team.players.map((player, index) => {
              const playerUser = player.user;
              const isPlayerCaptain = isCaptain(playerUser._id);
              
              return (
                <div
                  key={index}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  {/* Player Avatar */}
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center flex-shrink-0">
                    {playerUser.profileImage ? (
                      <Image
                        src={playerUser.profileImage}
                        alt={playerUser.fullName || playerUser.username}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-zinc-600 dark:text-zinc-300 font-bold text-lg">
                        {(playerUser.fullName?.[0] || playerUser.username[0]).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {playerUser.fullName || playerUser.username}
                      </p>
                      {isPlayerCaptain && (
                        <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      @{playerUser.username}
                    </p>
                  </div>

                  {/* Assignment Badge */}
                  {player.assignment && (
                    <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                      {player.assignment}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

