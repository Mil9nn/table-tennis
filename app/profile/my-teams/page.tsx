"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  Users,
  Crown,
  ChevronRight,
  MoveLeft,
  Loader2,
  Compass,
  Sparkles,
} from "lucide-react";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
        const teamsData = response.data.stats.teams || [];
        console.log("Teams data:", teamsData); // Debug: check if logo is present
        setTeams(teamsData);
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
    <div className="min-h-[calc(100vh-65px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Page Title */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xs sm:text-sm flex items-center gap-2 font-bold text-gray-800">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 p-1 border-2 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
            >
              <MoveLeft className="size-3 sm:size-4" />
            </button>
            <span>My Teams</span>
          </h1>
          <p className="text-[10px] sm:text-xs mt-1.5 text-gray-600">
            Teams you&apos;re part of and your roles
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-200px)]">
            <Loader2 className="animate-spin" />
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-white rounded-lg sm:rounded-xl px-4 sm:px-6 py-8 sm:py-12 text-center border border-gray-100">
            <GroupWorkIcon className="text-gray-300 mx-auto mb-2" fontSize="large" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1.5 sm:mb-2">
              No Teams Yet
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Join or create a team to start competing together!
            </p>
            <button
              onClick={() => router.push("/teams")}
              className="px-4 sm:px-6 py-1.5 sm:py-2 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-600 transition"
            >
              Browse Teams
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-[9px] sm:text-[10px] font-semibold text-blue-500 tracking-wide mb-1.5 sm:mb-2">
                  Total Teams
                </h3>
                <p className="text-lg sm:text-xl font-bold text-gray-700">
                  {totalTeams}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                  Team affiliations
                </p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-[9px] sm:text-[10px] font-semibold text-purple-500 tracking-wide mb-1.5 sm:mb-2">
                  Team Captain
                </h3>
                <p className="text-lg sm:text-xl font-bold text-gray-700">
                  {captainOf}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                  Leading teams
                </p>
              </div>

              <div className="bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-all">
                <h3 className="text-[9px] sm:text-[10px] font-semibold text-green-500 tracking-wide mb-1.5 sm:mb-2">
                  Team Member
                </h3>
                <p className="text-lg sm:text-xl font-bold text-gray-700">
                  {memberOf}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                  Playing for
                </p>
              </div>
            </div>

            {/* Teams List */}
            <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100">
                <h3 className="text-sm sm:text-base font-bold text-gray-800">
                  Your Teams ({teams.length})
                </h3>
              </div>

              <div className="divide-y divide-gray-100">
                {teams.map((team, index) => (
                  <div
                    key={index}
                    onClick={() => router.push(`/teams/${team._id}`)}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      {/* Team Info */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {/* Team Avatar */}
                        <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                          {team.logo ? (
                            <Image
                              src={team.logo}
                              alt={team.name}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <GroupWorkIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ fontSize: 'inherit', width: 'inherit', height: 'inherit' }} />
                          )}
                        </div>

                        {/* Team Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                            <h4 className="font-semibold text-gray-800 text-xs sm:text-sm truncate">
                              {team.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <span>•</span>{" "}
                              <span>{team.playerCount} members</span>
                            </div>
                          </div>
                        </div>

                        {/* Role Badge */}
                        <div
                          className={`px-2 sm:px-2.5 rounded-full text-[10px] sm:text-xs font-semibold border flex-shrink-0 ${
                            team.role === "Captain"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {team.role}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg sm:rounded-xl px-3 sm:px-4 py-3 sm:py-4 border border-gray-100 shadow-sm">
              <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 sm:mb-3">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                <Link
                  href="/teams"
                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all border border-blue-100 hover:border-blue-200 hover:shadow-sm group"
                >
                  <div className="p-1.5 sm:p-2 bg-blue-100 group-hover:bg-blue-200 rounded-lg transition-colors">
                    <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-semibold text-blue-900 text-xs sm:text-sm">
                      Browse Teams
                    </p>
                    <p className="text-[10px] sm:text-xs text-blue-600">
                      Find and join new teams
                    </p>
                  </div>
                </Link>

                <Link
                  href="/teams/create"
                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all border border-purple-100 hover:border-purple-200 hover:shadow-sm group"
                >
                  <div className="p-1.5 sm:p-2 bg-purple-100 group-hover:bg-purple-200 rounded-lg transition-colors">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-semibold text-purple-900 text-xs sm:text-sm">
                      Create Team
                    </p>
                    <p className="text-[10px] sm:text-xs text-purple-600">
                      Start your own team
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeamsPage;
