"use client";

import { useAuthStore } from "@/hooks/useAuthStore";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  BarChart3,
  Users,
  Trophy,
  Swords,
  Activity,
  Target,
  History,
  Zap,
  Calendar,
  ChevronRight,
  Loader2,
  LogOut,
  Settings,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import ProfileHeader from "./components/ProfileHeader";

import ScatterPlotIcon from "@mui/icons-material/ScatterPlot";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import GroupWorkIcon from "@mui/icons-material/GroupWork";

interface ProfilePageContentProps {
  userId?: string;
}

export const ProfilePageContent = ({ userId }: ProfilePageContentProps) => {
  const { user: currentUser, logout, fetchUser } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isUpdatingPreference, setIsUpdatingPreference] = useState(false);

  // Determine which user ID to use: provided userId or current authenticated user
  const targetUserId = userId || currentUser?._id;
  const isOwnProfile = !userId || userId === currentUser?._id;

  // Fetch profile stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!targetUserId) {
        setLoadingStats(false);
        return;
      }

      try {
        setLoadingStats(true);
        const response = await axiosInstance.get(
          `/profile/${targetUserId}/stats`
        );

        if (response.data) {
          // Extract user and stats from response
          if (response.data.user) {
            setProfileUser(response.data.user);
          }
          if (response.data.stats) {
            setStats(response.data.stats);
          }
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setStats(null);
        setProfileUser(null);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [targetUserId]);

  // Use currentUser for own profile (has complete data), otherwise use profileUser from API
  const displayUser = isOwnProfile ? currentUser : profileUser;

  const navigationCards = [
    {
      id: "player-stats",
      title: "Player Stats",
      icon: BarChart3,
      route: "/profile/stats",
    },
    {
      id: "match-history",
      title: "Match History",
      icon: History,
      route: "/profile/history",
    },
    {
      id: "performance-insights",
      title: "Performance Insights",
      icon: TrendingUp,
      route: "/profile/insights",
    },
    {
      id: "shot-analysis",
      title: "Shot Analysis",
      icon: ScatterPlotIcon,
      route: "/profile/shots",
    },
    {
      id: "my-teams",
      title: "My Teams",
      icon: GroupWorkIcon,
      route: "/profile/my-teams",
    },
    {
      id: "team-stats",
      title: "Team Stats",
      icon: Diversity3Icon,
      route: "/profile/team",
    },
    {
      id: "tournaments",
      title: "Tournaments",
      icon: Trophy,
      route: "/profile/tournaments",
    },
    {
      id: "head-to-head",
      title: "Head to Head",
      icon: Swords,
      route: "/profile/head-to-head",
    },
    {
      id: "activity-trends",
      title: "Activity & Trends",
      icon: Calendar,
      route: "/profile/activity",
    },
  ];

  // Prepare match type breakdown data
  const matchTypeData = stats
    ? [
        {
          label: "Singles",
          matches: stats.individual?.singles?.totalMatches || 0,
          wins: stats.individual?.singles?.wins || 0,
          losses: stats.individual?.singles?.losses || 0,
          setsWon: stats.individual?.singles?.setsWon || 0,
          setsLost: stats.individual?.singles?.setsLost || 0,
          color: "bg-blue-500",
        },
        {
          label: "Doubles",
          matches: stats.individual?.doubles?.totalMatches || 0,
          wins: stats.individual?.doubles?.wins || 0,
          losses: stats.individual?.doubles?.losses || 0,
          setsWon: stats.individual?.doubles?.setsWon || 0,
          setsLost: stats.individual?.doubles?.setsLost || 0,
          color: "bg-purple-500",
        },
        {
          label: "Mixed Doubles",
          matches: stats.individual?.mixed?.totalMatches || 0,
          wins: stats.individual?.mixed?.wins || 0,
          losses: stats.individual?.mixed?.losses || 0,
          setsWon: stats.individual?.mixed?.setsWon || 0,
          setsLost: stats.individual?.mixed?.setsLost || 0,
          color: "bg-pink-500",
        },
        {
          label: "Team Matches",
          matches: stats.team?.totalMatches || 0,
          wins: stats.team?.wins || 0,
          losses: stats.team?.losses || 0,
          setsWon: stats.team?.setsWon || 0,
          setsLost: stats.team?.setsLost || 0,
          color: "bg-emerald-500",
        },
      ]
    : [];

  // Guard against missing user ID
  if (!targetUserId) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#3c6e71]" />
          <p className="text-[#353535]">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {displayUser ? (
        <ProfileHeader
          detailedStats={null}
          tournamentStats={null}
          user={displayUser}
          stats={stats}
          isOwnProfile={isOwnProfile}
        />
      ) : loadingStats ? (
        <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#3c6e71]" />
        </div>
      ) : (
        <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#353535]">User not found</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Section Title */}
        <div className="mb-8">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] mb-1">
            Dashboard
          </h2>
          <div className="h-[1px] bg-[#d9d9d9] w-16"></div>
        </div>

        {/* Navigation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[#d9d9d9]">
          {navigationCards.map((card) => {
            const Icon = card.icon;

            const handleClick = () => {
              // If viewing another user's profile, include their ID in the route
              const route = isOwnProfile
                ? card.route
                : `/profile/${targetUserId}${card.route.replace(
                    "/profile",
                    ""
                  )}`;
              router.push(route);
            };

            return (
              <button
                key={card.id}
                onClick={handleClick}
                className="group bg-[#ffffff] hover:bg-[#3c6e71] transition-colors duration-200 text-left relative"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-[#3c6e71] group-hover:text-[#ffffff] transition-colors" />
                      <h3 className="text-sm font-semibold text-[#353535] group-hover:text-[#ffffff] transition-colors tracking-wide">
                        {card.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-[#d9d9d9] group-hover:text-[#ffffff] transition-all group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Settings Section - Only show on own profile */}
        {isOwnProfile && (
          <div className="mt-12 space-y-4">
            {/* Shot Tracking Mode Preference */}
            <div className="flex items-center justify-between rounded-lg border border-[#d9d9d9] bg-[#ffffff] p-4">
  <div className="flex-1">
    <Label className="text-[#353535] font-semibold text-sm mb-1">
      Detailed Shot Tracking
    </Label>
    <p className="text-xs text-[#8b8b8b]">
      Sets the default scoring mode for new matches. Can be changed during a match.
    </p>
  </div>

  <div className="flex items-center gap-3">
    {isUpdatingPreference && (
      <Loader2 className="h-4 w-4 animate-spin text-[#8b8b8b]" />
    )}

    <Switch
      checked={currentUser?.shotTrackingMode === "detailed"}
      onCheckedChange={async (checked) => {
        if (!currentUser) return;

        setIsUpdatingPreference(true);
        try {
          const newMode = checked ? "detailed" : "simple";
          await axiosInstance.patch("/auth/me", {
            shotTrackingMode: newMode,
          });
          await fetchUser();
        } catch (error) {
          console.error("Error updating preference:", error);
          toast.error("Failed to update preference");
        } finally {
          setIsUpdatingPreference(false);
        }
      }}
      disabled={isUpdatingPreference}
    />
  </div>
</div>


            {/* Logout Button */}
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfilePage = () => {
  // No userId provided, will use current authenticated user
  return <ProfilePageContent />;
};

export default ProfilePage;
