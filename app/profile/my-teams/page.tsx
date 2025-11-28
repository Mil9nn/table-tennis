"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  ArrowLeft,
  Shield,
  Users,
  Crown,
  Trophy,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const MyTeamsPage = () => {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/profile/detailed-stats`);
        setTeams(response.data.stats.teams || []);
      } catch (error) {
        console.error("Failed to fetch teams:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const totalTeams = teams.length;
  const captainOf = teams.filter((t) => t.role === "Captain").length;
  const memberOf = teams.filter((t) => t.role !== "Captain").length;

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Profile</span>
        </button>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Teams</h1>
          <p className="text-gray-600 mt-2">
            Teams you&apos;re part of and your roles
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-zinc-200 rounded w-1/4 mx-auto"></div>
            </div>
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Teams Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Join or create a team to start competing together!
            </p>
            <button
              onClick={() => router.push("/teams")}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Browse Teams
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-900">
                    Total Teams
                  </h3>
                </div>
                <p className="text-3xl font-bold text-blue-700">{totalTeams}</p>
                <p className="text-xs text-blue-600 mt-1">Team affiliations</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-purple-900">
                    Team Captain
                  </h3>
                </div>
                <p className="text-3xl font-bold text-purple-700">
                  {captainOf}
                </p>
                <p className="text-xs text-purple-600 mt-1">Leading teams</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-green-900">
                    Team Member
                  </h3>
                </div>
                <p className="text-3xl font-bold text-green-700">{memberOf}</p>
                <p className="text-xs text-green-600 mt-1">Playing for</p>
              </div>
            </div>

            {/* Teams List */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">
                  Your Teams ({teams.length})
                </h3>
              </div>

              <div className="divide-y divide-gray-100">
                {teams.map((team, index) => (
                  <div
                    key={index}
                    onClick={() => router.push(`/teams/${team._id}`)}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Team Info */}
                      <div className="flex items-center gap-4 flex-1">
                        {/* Team Icon/Avatar */}
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                          {team.logo ? (
                            <Image
                              src={team.logo}
                              alt={team.name}
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Shield className="w-8 h-8" />
                          )}
                        </div>

                        {/* Team Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-semibold text-gray-800">
                              {team.name}
                            </h4>
                            {team.role === "Captain" && (
                              <Crown className="w-5 h-5 text-yellow-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{team.playerCount} members</span>
                            </div>
                            <span>"</span>
                            <span
                              className={`font-medium ${
                                team.role === "Captain"
                                  ? "text-purple-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {team.role}
                            </span>
                          </div>
                        </div>

                        {/* Role Badge */}
                        <div
                          className={`px-4 py-2 rounded-lg text-xs font-semibold border ${
                            team.role === "Captain"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {team.role}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => router.push("/teams")}
                  className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition border border-blue-200"
                >
                  <Shield className="w-6 h-6 text-blue-600" />
                  <div className="text-left">
                    <p className="font-semibold text-blue-900">Browse Teams</p>
                    <p className="text-xs text-blue-600">
                      Find and join new teams
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => router.push("/teams/create")}
                  className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition border border-purple-200"
                >
                  <Trophy className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <p className="font-semibold text-purple-900">
                      Create Team
                    </p>
                    <p className="text-xs text-purple-600">
                      Start your own team
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Team Role Summary */}
            {captainOf > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-bold text-purple-900">
                    Leadership Role
                  </h3>
                </div>
                <p className="text-purple-700">
                  You are currently leading{" "}
                  <strong>{captainOf}</strong> team{captainOf > 1 ? "s" : ""}
                  . As a captain, you have the responsibility to manage your
                  team, organize matches, and lead your players to victory.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeamsPage;
