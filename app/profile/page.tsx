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
  Shield,
  ChevronRight,
  Loader2,
} from "lucide-react";
import ProfileHeader from "./components/ProfileHeader";

import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import Diversity3Icon from '@mui/icons-material/Diversity3';

const ProfilePage = () => {
  const { user } = useAuthStore();
  const router = useRouter();

  const navigationCards = [
    {
      id: "performance-insights",
      title: "Performance Insights",
      icon: TrendingUp,
      color: "text-blue-500",
      route: "/profile/insights",
    },
    {
      id: "player-stats",
      title: "Player Stats",

      icon: BarChart3,
      color: "text-purple-500",
      route: "/profile/stats",
    },
    {
      id: "shot-analysis",
      title: "Shot Analysis",

      icon: ScatterPlotIcon,
      color: "text-yellow-500",
      route: "/profile/shots",
    },
    {
      id: "team-stats",
      title: "Team Stats",

      icon: Diversity3Icon,
      color: "text-green-500",
      route: "/profile/team",
    },
    {
      id: "tournaments",
      title: "Tournaments",

      icon: Trophy,
      color: "text-amber-500",
      route: "/profile/tournaments",
    },
    {
      id: "head-to-head",
      title: "Head to Head",

      icon: Swords,
      color: "text-red-500",
      route: "/profile/head-to-head",
    },
    {
      id: "my-teams",
      title: "My Teams",

      icon: Shield,
      color: "text-indigo-500",
      route: "/profile/my-teams",
    },
    {
      id: "match-history",
      title: "Match History",

      icon: History,
      color: "text-cyan-500",
      route: "/profile/history",
    },
    {
      id: "activity-trends",
      title: "Activity & Trends",

      icon: Calendar,
      color: "text-pink-500",
      route: "/profile/activity",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gray-50">
      {user ? (
        <ProfileHeader
          detailedStats={null}
          tournamentStats={null}
          user={user}
        />
      ) : (
        <Loader2 />
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Section Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Your Dashboard</h2>
          <p className="text-gray-600 mt-2 text-sm">
            Comprehensive stats, insights, and achievements
          </p>
        </div>

        {/* Navigation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {navigationCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => router.push(card.route)}
                className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-transparent overflow-hidden text-left transform hover:-translate-y-1"
              >
                <div className="relative">
                  {/* Content */}
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-sm flex items-center gap-2 font-bold text-gray-800 group-hover:text-gray-900 mb-2">
                      <Icon className={`size-5 ${card.color}`} />
                      <span>{card.title}</span>
                    </h3>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
