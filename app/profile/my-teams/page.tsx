"use client";

import { useAuthStore } from "@/hooks/useAuthStore";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { ArrowLeft, Users, Crown, User, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

const MyTeamsPage = () => {
  const router = useRouter();
  const [detailedStats, setDetailedStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetailedStats = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/profile/detailed-stats`);
        setDetailedStats(response.data.stats);
      } catch (error) {
        console.error("Failed to fetch detailed stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedStats();
  }, []);

  const teams = detailedStats?.teams || [];

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
            Teams you're part of and your role in each team
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
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Teams Yet
            </h3>
            <p className="text-gray-600">
              You haven't joined any teams yet. Join or create a team to start playing team matches!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Teams Count */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-indigo-600" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{teams.length}</h3>
                  <p className="text-sm text-gray-600">Team{teams.length !== 1 ? 's' : ''} Joined</p>
                </div>
              </div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team: any) => (
                <div
                  key={team._id}
                  className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {team.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {team.role === "Captain" ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                            <Crown className="w-4 h-4" />
                            Captain
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            <User className="w-4 h-4" />
                            Player
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">{team.playerCount}</span>
                      </div>
                      <p className="text-xs text-gray-500">members</p>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/teams/${team._id}`)}
                    className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition font-medium text-sm"
                  >
                    View Team Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeamsPage;
