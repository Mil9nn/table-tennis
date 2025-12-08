"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { axiosInstance } from "@/lib/axiosInstance";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Material UI Icons
import JoinRightIcon from '@mui/icons-material/JoinRight';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import SportsMmaIcon from '@mui/icons-material/SportsMma';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import BoltIcon from '@mui/icons-material/Bolt';
import BarChartIcon from '@mui/icons-material/BarChart';


// Stat card component
const StatCard = ({
  label,
  value,
  subtitle,
  delay = 0,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700"
    >
      <div>
        <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
          {label}
        </p>
        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono mb-0.5">
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

// Progress ring component
const WinRateRing = ({ percentage }: { percentage: number }) => {
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="36"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-zinc-200 dark:text-zinc-700"
        />
        <motion.circle
          cx="48"
          cy="48"
          r="36"
          stroke="url(#gradient)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, delay: 0.5 }}
          style={{ strokeDasharray: circumference }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-zinc-100 dark:text-zinc-100">
          {percentage}%
        </span>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Win</span>
      </div>
    </div>
  );
};

export default function UserProfilePage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [tournamentStats, setTournamentStats] = useState<any>(null);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const fetchMatchHistory = async (opponentId: string) => {
    try {
      setLoadingHistory(true);
      const res = await axiosInstance.get(`/profile/${id}/head-to-head/${opponentId}`);
      if (res.data.success) {
        setMatchHistory(res.data.matches);
      }
    } catch (err) {
      console.error("Error fetching match history:", err);
      setMatchHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpponentClick = (opponent: any) => {
    setSelectedOpponent(opponent);
    setIsModalOpen(true);
    fetchMatchHistory(opponent._id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOpponent(null);
    setMatchHistory([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center gap-6">
            <Skeleton className="w-28 h-28 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="w-24 h-24 rounded-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profileData?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-12 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800"
        >
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <PeopleIcon className="w-8 h-8 text-zinc-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Player Not Found
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            This profile doesn't exist or has been removed.
          </p>
        </motion.div>
      </div>
    );
  }

  const { user, stats } = profileData;

  // Calculate derived stats
  const totalMatches = (stats.individual?.overall?.totalMatches || 0) + (stats.team?.totalMatches || 0);
  const totalWins = (stats.individual?.overall?.wins || 0) + (stats.team?.wins || 0);
  const totalLosses = (stats.individual?.overall?.losses || 0) + (stats.team?.losses || 0);
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
  const currentStreak = stats.individual?.overall?.currentStreak || 0;
  const bestStreak = stats.individual?.overall?.bestWinStreak || 0;
  const setsWon = (stats.individual?.overall?.setsWon || 0) + (stats.team?.setsWon || 0);
  const setsLost = (stats.individual?.overall?.setsLost || 0) + (stats.team?.setsLost || 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="max-w-5xl mx-auto py-4">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-800 dark:via-zinc-900 dark:to-black p-6 md:p-8"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }} />
          </div>
          
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            {/* Profile Image */}
            <div className="relative">
              {user.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt={user.fullName || user.username}
                  width={112}
                  height={112}
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-white/20 shadow-2xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-4xl ring-4 ring-white/20 shadow-2xl">
                  {(user.fullName?.[0] || user.username?.[0] || "?").toUpperCase()}
                </div>
              )}
              {currentStreak >= 3 && (
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full p-1.5 ring-2 ring-zinc-900">
                  <LocalFireDepartmentIcon className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {user.fullName || user.username}
              </h1>
              <p className="text-zinc-400 text-sm mt-1">@{user.username}</p>
              
              {/* Quick Stats Pills */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                  <JoinRightIcon className="w-3 h-3 text-emerald-400" />
                  {totalMatches} Matches
                </span>
                {currentStreak > 0 && (
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                    <LocalFireDepartmentIcon className="w-3 h-3 text-orange-400" />
                    {currentStreak} Win Streak
                  </span>
                )}
              </div>
            </div>

            {/* Win Rate Ring */}
            <div className="flex-shrink-0">
              <WinRateRing percentage={winRate} />
            </div>
          </div>
        </motion.div>

        {/* Tabbed Content */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="w-full max-w-lg mx-auto grid grid-cols-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-none p-0">
            <TabsTrigger
              value="performance"
              className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-sm font-medium transition-all"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="tournaments"
              className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-sm font-medium transition-all"
            >
              Tournaments
            </TabsTrigger>
            <TabsTrigger
              value="rivals"
              className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-sm font-medium transition-all"
            >
              Rivals
            </TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="mt-6 space-y-4 px-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Match Type Breakdown */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
              >
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <SportsTennisIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  Match Type Breakdown
                </h3>
                <div className="space-y-4">
                  {[
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
                  ].filter(item => item.matches > 0).map((item, i) => {
                    const itemWinRate = item.matches > 0 ? Math.round((item.wins / item.matches) * 100) : 0;
                    const totalSets = item.setsWon + item.setsLost;
                    const setWinRate = totalSets > 0 ? Math.round((item.setsWon / totalSets) * 100) : 0;
                    return (
                      <div key={i} className="space-y-3">
                        {/* Match Stats */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {item.label}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {item.wins}W / {item.losses}L
                            </span>
                          </div>
                          <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${itemWinRate}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className={`h-full ${item.color} rounded-full`}
                            />
                          </div>
                          <p className="text-xs text-zinc-400">{itemWinRate}% win rate • {item.matches} matches</p>
                        </div>
                        
                        {/* Sets Stats Subsection */}
                        {totalSets > 0 && (
                          <div className="pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                Sets
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                {item.setsWon}W / {item.setsLost}L
                              </span>
                            </div>
                            <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${setWinRate}%` }}
                                transition={{ duration: 0.8, delay: (i * 0.1) + 0.2 }}
                                className={`h-full ${item.color} opacity-70 rounded-full`}
                              />
                            </div>
                            <p className="text-[10px] text-zinc-400">{setWinRate}% win rate • {totalSets} sets</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!stats.individual?.singles?.totalMatches && !stats.individual?.doubles?.totalMatches && !stats.team?.totalMatches && (
                    <p className="text-sm text-zinc-400 text-center py-4">No matches played yet</p>
                  )}
                </div>
              </motion.div>

              {/* Playing Style Analysis */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
              >
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <BoltIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  Playing Style
                </h3>
                {stats.shotAnalysis && (stats.shotAnalysis.offensive > 0 || stats.shotAnalysis.defensive > 0) ? (
                  <div className="space-y-4">
                    {/* Style Distribution with Percentages */}
                    {(() => {
                      const totalShots = (stats.shotAnalysis.offensive || 0) + (stats.shotAnalysis.neutral || 0) + (stats.shotAnalysis.defensive || 0);
                      if (totalShots === 0) return null;
                      
                      const offensivePct = Math.round((stats.shotAnalysis.offensive / totalShots) * 100);
                      const neutralPct = Math.round((stats.shotAnalysis.neutral / totalShots) * 100);
                      const defensivePct = Math.round((stats.shotAnalysis.defensive / totalShots) * 100);
                      
                      return (
                        <div className="space-y-3">
                          {[
                            { label: "Offensive", value: offensivePct, color: "bg-red-500", textColor: "text-red-500" },
                            { label: "Neutral", value: neutralPct, color: "bg-zinc-500", textColor: "text-zinc-500" },
                            { label: "Defensive", value: defensivePct, color: "bg-blue-500", textColor: "text-blue-500" },
                          ].map((style) => (
                            <div key={style.label} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-600 dark:text-zinc-400 font-medium">{style.label}</span>
                                <span className={`font-bold ${style.textColor}`}>{style.value}%</span>
                              </div>
                              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${style.value}%` }}
                                  transition={{ duration: 0.8 }}
                                  className={`h-full ${style.color} rounded-full`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                    <BoltIcon className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No shot data available</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Recent Matches */}
            {stats.recentMatches && stats.recentMatches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <CalendarTodayIcon fontSize="small" className="text-blue-500" />
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Recent Matches</span>
                  </h3>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {stats.recentMatches.slice(0, 5).map((match: any, i: number) => {
                    // opponent can be a string (name) or an object with fullName/username
                    const opponentName = typeof match.opponent === 'string' 
                      ? match.opponent 
                      : (match.opponent?.fullName || match.opponent?.username || 'Unknown');
                    
                    return (
                      <Link
                        key={i}
                        href={`/matches/${match.matchId}`}
                        className="px-5 py-3 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          match.result === 'win' 
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {match.result === 'win' ? 'W' : 'L'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            vs {opponentName}
                          </p>
                          <p className="text-xs text-zinc-500 capitalize">{match.matchType?.replace('_', ' ')}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <p className="text-sm font-mono font-medium text-zinc-700 dark:text-zinc-300">
                              {match.score || '—'}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {match.date ? new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                            </p>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </TabsContent>

          {/* Tournaments Tab */}
          <TabsContent value="tournaments" className="mt-6 space-y-4 px-2">
            {loadingTournaments ? (
              <div className="space-y-4">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
            ) : tournamentStats?.overview?.totalTournaments > 0 ? (
              <>
                {/* Tournament Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-white/20 dark:border-zinc-700/50 rounded-lg p-3 hover:bg-white/80 dark:hover:bg-zinc-900/80 shadow-sm transition-all">
                    <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1.5">
                      Championships
                    </p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                      {tournamentStats.overview.tournamentWins}
                    </p>
                  </div>
                  <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-white/20 dark:border-zinc-700/50 rounded-lg p-3 hover:bg-white/80 dark:hover:bg-zinc-900/80 shadow-sm transition-all">
                    <p className="text-[10px] font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1.5">
                      Podium Finishes
                    </p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                      {tournamentStats.overview.podiumFinishes}
                    </p>
                  </div>
                  <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-white/20 dark:border-zinc-700/50 rounded-lg p-3 hover:bg-white/80 dark:hover:bg-zinc-900/80 shadow-sm transition-all">
                    <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1.5">
                      Tournament Win Rate
                    </p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                      {Math.round(tournamentStats.overview.winRate || 0)}%
                    </p>
                  </div>
                </div>

                {/* Tournament History */}
                {tournamentStats.tournaments && tournamentStats.tournaments.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tournament History</h3>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {tournamentStats.tournaments.slice(0, 6).map((t: any, i: number) => (
                        <div key={i} className="px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                {t.tournament.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                                {t.tournament.city && (
                                  <span className="flex items-center gap-1">
                                    <LocationOnIcon sx={{ fontSize: 12 }} />
                                    {t.tournament.city}
                                  </span>
                                )}
                                <span className="capitalize">{t.tournament.format?.replace('_', ' ')}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {t.stats.position === 1 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                                  <MilitaryTechIcon className="w-3 h-3" />
                                  Champion
                                </span>
                              ) : t.stats.position && typeof t.stats.position === 'number' ? (
                                <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-xs font-medium">
                                  #{t.stats.position}
                                </span>
                              ) : null}
                              <p className="text-xs text-zinc-500 mt-1">
                                {t.stats.wins}W - {t.stats.losses}L
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center"
              >
                <EmojiEventsIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">No Tournaments Yet</h3>
                <p className="text-sm text-zinc-500">This player hasn't participated in any tournaments.</p>
              </motion.div>
            )}
          </TabsContent>

          {/* Rivals Tab */}
          <TabsContent value="rivals" className="mt-6 px-2">
            {stats.headToHead && stats.headToHead.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <SportsMmaIcon className="w-4 h-4 text-zinc-400" />
                    Head-to-Head Records
                  </h3>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {stats.headToHead.map((h2h: any, i: number) => {
                    const isWinning = h2h.wins > h2h.losses;
                    const isLosing = h2h.losses > h2h.wins;
                    return (
                      <div
                        key={i}
                        onClick={() => handleOpponentClick(h2h.opponent)}
                        className="p-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer"
                      >
                        {h2h.opponent.profileImage ? (
                          <Image
                            src={h2h.opponent.profileImage}
                            alt={h2h.opponent.fullName || h2h.opponent.username}
                            width={44}
                            height={44}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-bold">
                            {(h2h.opponent.fullName?.[0] || h2h.opponent.username?.[0] || "?").toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {h2h.opponent.fullName || h2h.opponent.username}
                          </p>
                          <p className="text-xs text-zinc-500">@{h2h.opponent.username}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="flex items-center gap-1 font-mono text-sm">
                              <span className={`font-bold ${isWinning ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                {h2h.wins}
                              </span>
                              <span className="text-zinc-300 dark:text-zinc-600">-</span>
                              <span className={`font-bold ${isLosing ? 'text-red-600 dark:text-red-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                {h2h.losses}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400">{h2h.total} matches</p>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center"
              >
                <SportsMmaIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">No Rivals Yet</h3>
                <p className="text-sm text-zinc-500">Play matches against other players to build your rivalry records.</p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>

        {/* Teams Section */}
        {stats.teams && stats.teams.length > 0 && (
          <div className="px-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-zinc-900 rounded-xl mt-4 border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Team Affiliations
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-zinc-800">
              {stats.teams.map((team: any, i: number) => (
                <Link
                  key={i}
                  href={`/teams/${team._id}`}
                  className="px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    {team.logo ? (
                      <Image
                        src={team.logo}
                        alt={team.name}
                        width={44}
                        height={44}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-bold flex-shrink-0">
                        {(team.name?.[0] || "T").toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {team.name}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {team.role} • {team.playerCount} members
                      </p>
                    </div>
                    {team.stats && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300">
                          {team.stats.wins}W - {team.stats.losses}L
                        </p>
                        <p className="text-xs text-zinc-400">
                          {Math.round(team.stats.winRate || 0)}% win rate
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
          </div>
        )}

        {/* Head-to-Head Match History Modal */}
        <Dialog open={isModalOpen} onOpenChange={closeModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0">
            {selectedOpponent && (
              <>
                <DialogHeader className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-4">
                    {selectedOpponent.profileImage ? (
                      <Image
                        src={selectedOpponent.profileImage}
                        alt={selectedOpponent.fullName || selectedOpponent.username}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-bold">
                        {(selectedOpponent.fullName?.[0] || selectedOpponent.username?.[0] || "?").toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {selectedOpponent.fullName || selectedOpponent.username}
                      </DialogTitle>
                      <p className="text-sm text-zinc-500">@{selectedOpponent.username}</p>
                    </div>
                  </div>
                </DialogHeader>

                {loadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <p className="text-sm text-zinc-500">Loading match history...</p>
                    </div>
                  </div>
                ) : matchHistory.length > 0 ? (
                  <div className="flex flex-col overflow-hidden">
                    {/* Summary Stats */}
                    {(() => {
                      const wins = matchHistory.filter((m) => m.result === "win").length;
                      const losses = matchHistory.filter((m) => m.result === "loss").length;
                      const total = wins + losses;
                      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
                      const isWinning = wins > losses;

                      return (
                        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                                Head-to-Head Record
                              </p>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 font-mono text-xl">
                                  <span className={`font-bold ${isWinning ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                    {wins}
                                  </span>
                                  <span className="text-zinc-300 dark:text-zinc-600">-</span>
                                  <span className={`font-bold ${!isWinning && losses > wins ? 'text-red-600 dark:text-red-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                    {losses}
                                  </span>
                                </div>
                                <span className="text-sm text-zinc-500">({winRate}% win rate)</span>
                              </div>
                            </div>
                            <p className="text-sm text-zinc-500">{total} total matches</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Match List */}
                    <div className="overflow-y-auto flex-1">
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {matchHistory.map((match: any, i: number) => (
                          <Link
                            key={i}
                            href={`/matches/${match.matchId}`}
                            className="px-6 py-3 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                              match.result === 'win' 
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {match.result === 'win' ? 'W' : 'L'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                                  {match.matchType?.replace('_', ' ')}
                                </p>
                                {match.tournament && (
                                  <span className="text-xs text-zinc-500">• {match.tournament.name}</span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-500">
                                {match.date ? new Date(match.date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : ''}
                              </p>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <div>
                                <p className="text-sm font-mono font-medium text-zinc-700 dark:text-zinc-300">
                                  {match.score || '—'}
                                </p>
                              </div>
                              <ChevronRightIcon className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 transition-colors" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-6">
                    <SportsMmaIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4" />
                    <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">No Matches Found</h3>
                    <p className="text-sm text-zinc-500 text-center">
                      No completed matches found between you and this player.
                    </p>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
