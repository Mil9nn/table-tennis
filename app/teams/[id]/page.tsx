"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { useAuthStore } from "@/hooks/useAuthStore";
import { Loader2, Edit2, Trash, MapPin, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Team = {
  _id: string;
  name: string;
  city?: string;
  logo?: string;
  record?: { wins: number; losses: number };
  captain?: {
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
  }[];
};

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/teams/${teamId}`);
      setTeam(res.data.team);
    } catch (error: any) {
      console.error("Error fetching team:", error);
      toast.error("Failed to load team details");
      router.push("/teams");
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async () => {
    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
      await axiosInstance.delete(`/teams/${teamId}`);
      toast.success("Team deleted successfully");
      router.push("/teams");
    } catch (error: any) {
      console.error("Error deleting team:", error);
      toast.error(error.response?.data?.message || "Failed to delete team");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <div className="bg-[#667eea]">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <Skeleton className="h-10 w-32 mb-4 bg-white/20" />
            <div className="flex flex-col items-center py-6">
              <Skeleton className="w-18 h-18 rounded-full mb-4 bg-white/20" />
              <Skeleton className="h-6 w-48 mb-2 bg-white/20" />
              <Skeleton className="h-4 w-32 bg-white/20" />
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Team Not Found</h2>
          <p className="text-gray-600 mb-4">This team doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/teams")}>Go Back to Teams</Button>
        </div>
      </div>
    );
  }

  const isOwner = user && team.captain?._id === user._id;
  const totalMatches = (team.record?.wins || 0) + (team.record?.losses || 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header Bar */}
      <div className="bg-[#667eea]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => router.back()}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="size-6 text-white" />
            </button>
            <h1 className="text-white font-semibold text-base flex-1 text-center">
              Team Details
            </h1>
            <div>
              {isOwner && (
                <div className="flex gap-1">
                  <Link href={`/teams/${team._id}/edit`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 hover:bg-white/10 text-white"
                    >
                      <Edit2 className="size-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 hover:bg-white/10 text-white hover:text-red-300"
                    onClick={deleteTeam}
                  >
                    <Trash className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Team Info */}
      <div className="bg-gradient-to-b from-[#667eea] to-[#5a6fd6]">
        <div className="max-w-2xl mx-auto px-4 pb-5 pt-2">
          <div className="flex flex-col items-center">
            <Image
              src={team.logo || "/imgs/logo.png"}
              alt={team.name}
              width={72}
              height={72}
              className="w-18 h-18 rounded-full object-cover border-3 border-white/20"
            />
            <h2 className="text-white font-bold text-xl mt-2">{team.name}</h2>
            {team.city && (
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="size-3.5 text-white/60" />
                <span className="text-white/80 text-sm">{team.city}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-white/10 backdrop-blur rounded-lg py-2 px-1 text-center">
              <p className="text-lg text-white font-bold">
                {team.players?.length || 0}
              </p>
              <p className="text-[10px] text-white/70 uppercase tracking-wide">Players</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg py-2 px-1 text-center">
              <p className="text-lg text-white font-bold">
                {totalMatches}
              </p>
              <p className="text-[10px] text-white/70 uppercase tracking-wide">Matches</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg py-2 px-1 text-center">
              <p className="text-lg text-green-300 font-bold">
                {team.record?.wins || 0}
              </p>
              <p className="text-[10px] text-white/70 uppercase tracking-wide">Wins</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg py-2 px-1 text-center">
              <p className="text-lg text-red-300 font-bold">
                {team.record?.losses || 0}
              </p>
              <p className="text-[10px] text-white/70 uppercase tracking-wide">Losses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Players */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Squad ({team.players?.length || 0})
              </h3>
              {isOwner && (
                <Link href={`/teams/${team._id}/assign`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-[#667eea] hover:text-[#5a6fd6] h-7 px-2"
                  >
                    Assign Positions
                  </Button>
                </Link>
              )}
            </div>
            <div className="space-y-1.5">
              {team.players.length > 0 ? (
                team.players.map((p) => {
                  const isCaptain = team.captain?._id === p.user._id;
                  return (
                    <Link
                      key={p.user._id}
                      href={`/profile/${p.user._id}`}
                      className="flex items-center justify-between py-2.5 px-3 bg-[#F8F9FA] rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {p.user.profileImage ? (
                          <Image
                            src={p.user.profileImage}
                            alt={p.user.fullName || p.user.username}
                            width={36}
                            height={36}
                            className={`w-9 h-9 rounded-full object-cover ${isCaptain ? "ring-2 ring-yellow-400" : ""}`}
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-[#667eea] to-[#5a6fd6] flex items-center justify-center text-white font-semibold text-sm ${isCaptain ? "ring-2 ring-yellow-400" : ""}`}>
                            {(p.user.fullName?.[0] || p.user.username?.[0] || "?").toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-sm text-gray-800">
                              {p.user.fullName || p.user.username}
                            </p>
                            {isCaptain && (
                              <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                                C
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            @{p.user.username}
                          </p>
                        </div>
                      </div>
                      {p.assignment && (
                        <span className="text-[10px] font-medium py-1 px-2 rounded-full bg-[#667eea]/10 text-[#667eea]">
                          {p.assignment}
                        </span>
                      )}
                    </Link>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">
                  No players yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

