"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import {
  Users,
  Crown,
  ChevronRight,
  Loader2,
  Compass,
  Sparkles,
} from "lucide-react";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "../components/EmptyState";

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
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
            My Teams
          </h1>
          <div className="h-[1px] bg-[#d9d9d9] w-24"></div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-[calc(100vh-70px)]">
            <Loader2 className="animate-spin text-[#3c6e71]" />
          </div>
        ) : teams.length === 0 ? (
          <div className="space-y-4">
            <EmptyState
              icon={GroupWorkIcon}
              title="No teams yet."
              description="Join or create a team to start competing together!"
            />
            <div className="flex justify-center pt-4">
              <button
                onClick={() => router.push("/teams")}
                className="px-6 py-2 bg-[#3c6e71] text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-[#2d525b] transition-colors"
              >
                Browse Teams
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Total Teams
                </h3>
                <p className="text-3xl font-bold text-[#353535]">
                  {totalTeams}
                </p>
                <p className="text-xs text-[#353535] mt-3">Team affiliations</p>
              </div>

              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Team Captain
                </h3>
                <p className="text-3xl font-bold text-[#353535]">
                  {captainOf}
                </p>
                <p className="text-xs text-[#353535] mt-3">Leading teams</p>
              </div>

              <div className="bg-[#ffffff] border border-[#d9d9d9] p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3c6e71] mb-3">
                  Team Member
                </h3>
                <p className="text-3xl font-bold text-[#353535]">
                  {memberOf}
                </p>
                <p className="text-xs text-[#353535] mt-3">Playing for</p>
              </div>
            </div>

            {/* Teams List */}
            <div className="space-y-4">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
                  Your Teams ({teams.length})
                </h2>
                <p className="text-xs text-[#353535] mt-1">
                  Teams you are part of and your roles
                </p>
              </div>

              <div className="bg-[#ffffff] border border-[#d9d9d9]">
                <div className="divide-y divide-[#d9d9d9]">
                  {teams.map((team, index) => (
                    <div
                      key={index}
                      onClick={() => router.push(`/teams/${team._id}`)}
                      className="px-6 py-4 hover:bg-[#f5f5f5] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Team Info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Team Avatar */}
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#3c6e71] to-[#5a9fa5] flex items-center justify-center text-white flex-shrink-0">
                            {team.logo ? (
                              <Image
                                src={team.logo}
                                alt={team.name}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <GroupWorkIcon
                                className="w-5 h-5"
                                style={{
                                  fontSize: "inherit",
                                  width: "inherit",
                                  height: "inherit",
                                }}
                              />
                            )}
                          </div>

                          {/* Team Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-[#353535] text-sm truncate">
                                {team.name}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#666666]">
                              <span>•</span>
                              <span>{team.playerCount} members</span>
                            </div>
                          </div>

                          {/* Role Badge */}
                          <div
                            className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap flex-shrink-0 ${
                              team.role === "Captain"
                                ? "bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]"
                                : "bg-[#e0f2fe] text-[#0c4a6e] border border-[#7dd3fc]"
                            }`}
                          >
                            {team.role}
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-5 h-5 text-[#d9d9d9] group-hover:text-[#3c6e71] group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
                  Quick Actions
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/teams"
                  className="flex items-center gap-3 px-6 py-4 bg-[#ffffff] hover:bg-[#f5f5f5] rounded border border-[#d9d9d9] transition-all group"
                >
                  <div className="p-2 bg-[#e0f2fe] group-hover:bg-[#bfdbfe] rounded">
                    <Compass className="w-5 h-5 text-[#3c6e71] flex-shrink-0" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-[#353535] text-sm">
                      Browse Teams
                    </p>
                    <p className="text-xs text-[#666666]">
                      Find and join new teams
                    </p>
                  </div>
                </Link>

                <Link
                  href="/teams/create"
                  className="flex items-center gap-3 px-6 py-4 bg-[#ffffff] hover:bg-[#f5f5f5] rounded border border-[#d9d9d9] transition-all group"
                >
                  <div className="p-2 bg-[#fef3c7] group-hover:bg-[#fde68a] rounded">
                    <Sparkles className="w-5 h-5 text-[#92400e] flex-shrink-0" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-[#353535] text-sm">
                      Create Team
                    </p>
                    <p className="text-xs text-[#666666]">Start your own team</p>
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
